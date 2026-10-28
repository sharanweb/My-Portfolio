# Portfolio — Next.js build spec

This folder (`handoff/`) holds a finished, working design. Your job is to rebuild it as a Next.js app that looks **pixel-identical** and behaves the same, then replace the prototype's hosted storage with real backends.

Open `handoff/reference/index.html` in a browser to see the visitor view. Open `handoff/reference/owner.html` to see the owner editor (it uses a local mock).

## Ground rules

1. **Reuse the CSS verbatim.** Copy `design-source/styles.css` to `app/globals.css` unchanged. Do not convert it to Tailwind, CSS Modules or styled-components, and do not rename classes. The markup you write must produce the same class names and DOM structure as the reference, and it gets the same look for free.
2. **Markup is defined by `design-source/app.reference.js`.** Each `render*` function there returns the HTML string for one part of the page. Port each one to a React component that outputs the same elements, classes, attributes and text. Treat it as the source of truth whenever this spec and the code disagree.
3. **Content is data.** All text, links, section order, visibility and appearance come from `design-source/portfolio.json`, typed in `types/portfolio.ts`. Hard-code nothing that lives in the JSON.
4. **Icons come from `design-source/icons.json`.** It holds about 230 brand icons (Simple Icons, CC0, plus a few Font Awesome Free brand icons, CC BY 4.0). Port `key()`, `ALIAS`, `lum()`, `brandColor()`, `techIcon()` and `tiSpan()` to `lib/icons.ts` exactly. Very dark or very light brand colours fall back to the text colour, and unmatched names show a two-letter monogram. Interface icons are the inline paths in the `P` object. Port them to `components/Icon.tsx`.
5. **Done means visual parity.** Run `node handoff/scripts/visual-diff.mjs` and get every case under 1% pixel difference with matching page heights.

## Stack

- Next.js (App Router) + TypeScript, React Server Components where possible.
- Fonts via `next/font/google`: Geist (300–800), Geist Mono (400, 500), Instrument Serif (normal + italic). Expose them as the CSS variables `--font-sans`, `--font-mono` and `--font-serif`. Keep the fallback stacks from `styles.css` by overriding the `:root` values in a tiny `fonts.css`, or set the variables on `<html>`.
- No UI library. No Tailwind.

## Suggested structure

```
app/
  layout.tsx            fonts, <html>, theme bootstrap script, background layers
  page.tsx              loads content, renders <Portfolio data={...} />
  globals.css           = handoff/design-source/styles.css (verbatim)
  admin/page.tsx        owner editor (protected)
  api/content/route.ts  GET/PUT portfolio JSON (PUT requires auth)
  api/contact/route.ts  POST message → store + email
  api/messages/route.ts GET messages (auth)
  api/upload/route.ts   image upload (auth)
components/
  Background.tsx  Nav.tsx  Hero.tsx  ProfileCard.tsx  StackStrip.tsx
  About.tsx  Projects.tsx  ProjectModal.tsx  Experience.tsx  Testimonials.tsx
  Achievements.tsx  Certifications.tsx  Socials.tsx  Contact.tsx  Footer.tsx
  CommandPalette.tsx  Toast.tsx  SectionHead.tsx  Icon.tsx  TechIcon.tsx
  admin/Drawer.tsx  admin/fields.tsx  admin/ListEditor.tsx  admin/tabs/*.tsx
lib/
  icons.ts  content.ts (load/save + normalize)  rich.tsx (*accent* → <em className="accent-word">)
  accent.ts (hexToHsl + accent derivation)  urls.ts (safeUrl, socialUrl, socialHandle, liUrl)
types/portfolio.ts      = handoff/types/portfolio.ts
content/portfolio.json  = handoff/design-source/portfolio.json (initial content)
```

## Mapping from reference to components

| Reference function | Component | Notes |
|---|---|---|
| `renderNav` | `Nav` | Links come from `navItems()`: shown sections with a `nav` label and content. The theme segmented control, ⌘K button, and Edit button (owner only, on `/admin`). `.scrolled` is added after 8px of scroll. The active link is set with an IntersectionObserver (`rootMargin: -45% 0px -50% 0px`). |
| `renderHero` | `Hero` + `ProfileCard` | Rotator, stats, CTAs. Profile card: banner canvas, avatar, core stack (`stackIcons`, max 8), socials, rows, "Now building" (first project whose status is wip), availability strip. Two-column card via the container query already in CSS. |
| `renderStack` | `StackStrip` | Marquee; the item list is duplicated once, inside `aria-hidden`. |
| `renderAbout` | `About` | Bento. Skill card span: 1 group = 6, 2 = 3, 4 = 3, otherwise 2; the last odd card gets `.odd-last`. |
| `renderWork` + `coverHtml` + `stackIcons` | `Projects`, `ProjectModal` | A card click opens the modal. Generated cover when there is no image. |
| `renderExperience` | `Experience` | The first entry is expanded by default; a "Show N highlights" toggle. |
| `renderTestimonials` + `quoteCard` | `Testimonials` | Featured = `featured: true`, else the first one once there are 3 or more. The rest go in `.quotes` (`.few` when fewer than 3). "Read more" clamps over 300 chars (520 when featured). An "All recommendations" button appears when the owner's LinkedIn social is a `/in/` URL. |
| `renderAchievements` | `Achievements` | |
| `renderCerts` | `Certifications` | Copy credential ID, Verify link. |
| `renderSocials` | `Socials` | Visitors see only entries with a usable link; the owner also sees placeholders. |
| `renderContact` + `channel` | `Contact` | Empty channels are hidden for visitors. The form posts to `/api/contact`. |
| `renderFooter` | `Footer` | |
| `palActions`/`renderPal` | `CommandPalette` | ⌘K / Ctrl+K and `/` open it; arrow keys and Enter; groups as in the reference. |
| `openProject` | `ProjectModal` | Overlay, Escape closes it, focus returns to the trigger. |
| `toast`, `copyText` | `Toast`, `useCopy` | Clipboard with a `execCommand` fallback. |

Sections render in `data.sections` order, and a section is skipped when `show === false` or `hasContent()` is false. Keep the `id` attributes (`about`, `work`, …) because the nav and the palette scroll to them.

## Client behaviours to port exactly

- **Theme.** Three states: `light`, `dark`, `auto`. Set `data-theme` on `<html>`, or remove it for auto. Persist the choice in `localStorage['pf-theme']`, and fall back to `theme.defaultMode`. Add an inline script in `<head>` that applies the stored theme before paint, so there is no flash.
- **Accent.** From `theme.accent` hex, set `--acc-l`, `--acc2-l`, `--acc-d` and `--acc2-d` on `<html>` exactly as `applyAppearance()` does. Set `data-bg` and `data-grain` on `<body>`.
- **Aurora background** (`Background.tsx`, client component). A fixed `.bg` holds a canvas (rendered at 1/6 of viewport size), `.bg-grid` and `.bg-grain`. Port `BLOBS`, `drawBg`, `loop` (about 20fps), `startBg` and the resize and visibility handling unchanged. It renders statically when `animate` is false, the style is not `aurora`, or reduced motion is on, and redraws on theme change.
- **Banner canvas** in the profile card. Port `paintBanner` and repaint on resize and theme change.
- **Rotator.** Every 2.8s, add `.out`, swap the word after 420ms, then flash `.in`. Plain swap under reduced motion.
- **Clock.** `Intl.DateTimeFormat` in `profile.timezone`, ticking every 15s. Move the day-bar dot and set the working-hours text for 09:00–18:00.
- **Spotlight.** On pointer move, set `--mx`/`--my` on the nearest `.spot`.
- **Tilt.** On `#pcard`, with fine pointers only and no reduced motion, set `--rx`, `--ry`, `--gx` and `--gy` and toggle `.tilting`.
- **Copy buttons**, **toasts**, **tooltips** (pure CSS via `data-tip`).
- **Hydration.** Render every section on the server. Client-only effects (canvas, clock text, rotator) must not change layout, and the clock shows `--:--` until mounted, as in the reference.

## Replacing the prototype runtime

The prototype runs on claude.ai and calls `window.claude.use(...)`. None of that exists in Next.js. Replace it like this:

| Prototype | Next.js replacement (recommended default) |
|---|---|
| `artifact.publish(html)`, the page saving itself | `PUT /api/content` saves the portfolio JSON. Start with a JSON file in the repo, edited locally and committed. For live editing, use a database row (Supabase, Neon or Vercel KV/Upstash). Then revalidate the page with `revalidatePath('/')`. |
| `user.canEdit()` gating the editor | `/admin` protected by auth. Simplest: a password in `ADMIN_PASSWORD`, checked by a route handler that sets an httpOnly signed cookie, plus middleware on `/admin` and the write APIs. Or Auth.js with GitHub sign-in restricted to the owner's account. |
| `db` collection `messages` (contact form) | `POST /api/contact` validates the input (zod), rate-limits by IP, stores the message, and optionally emails the owner (Resend). `GET /api/messages` returns them for the admin Messages tab. Add a honeypot field. |
| `assets.upload` (avatar, covers, testimonial photos) | `POST /api/upload` to Vercel Blob, Cloudinary or Supabase Storage. Store the returned URL in the JSON. Allow the image host in `next.config` `images.remotePatterns`, or use plain `<img>` as the reference does. |

The visitor site must work with no auth and no JavaScript errors. The editor lives only on `/admin`, and the public page never ships admin code (load it with `next/dynamic`).

## Admin editor (`/admin`)

Port the drawer UI (`renderDrawer`, `adminTab`, `field`, `fields`, `LISTS`, `listEditor`) as React with controlled state:

- Same 13 tabs: Profile, Sections, Appearance, About & skills, Projects, Experience, Testimonials, Achievements, Certifications, Socials, Contact, Messages, JSON.
- Field types: text, area, lines (one per line → array), comma (→ array), icons (comma plus live icon preview, with missing ones dashed), hue (range plus dot), select, bool (switch), upload.
- List editing: add, remove, move up and down, using the templates in `LISTS[*].tpl`.
- Live preview: the page behind the drawer re-renders from the draft (debounced 160ms). Discard resets it; Publish calls `PUT /api/content`.
- Per-section "Edit" buttons on the public page appear only when signed in as the owner, and open the matching tab.
- The JSON tab pastes and applies through `normalize()`, so older shapes still load.

## Acceptance checklist

- [ ] `globals.css` is byte-identical to `handoff/design-source/styles.css` (apart from the font variable override).
- [ ] `node handoff/scripts/visual-diff.mjs` passes every case, with the reference and the app on the same content.
- [ ] Light, dark and auto themes work; the choice persists with no flash on reload.
- [ ] Every interaction in the reference works: palette, modal, copy, rotator, tilt, expand toggles, Read more.
- [ ] No horizontal scroll at 360px; layout scales at 1680, 1920, 2400, 3200 and 3800px (rem-based root scaling is already in the CSS).
- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 95 on mobile.
- [ ] Contact form stores messages and the admin can read them; uploads work; content edits persist and show on `/` after publish.
- [ ] No hard-coded content outside `content/portfolio.json`.

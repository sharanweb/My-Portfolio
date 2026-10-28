# Progress log

## Done
- Next.js 16 (App Router, TypeScript, no Tailwind) scaffolded.
- `app/globals.css` is byte-identical to `handoff/design-source/styles.css`. `app/reset.css` holds the reference's base reset; `app/fonts.css` points the font variables at `next/font`.
- Public page ported component by component (`components/`), with content from `content/portfolio.json`. Only the icons the content uses are sent to the browser.
- Theme (light/dark/auto), saved in `localStorage['pf-theme']` and applied before paint with no flash.
- Aurora background, banner canvas, rotator, clock, spotlight, tilt, command palette (⌘K, Ctrl+K, `/`), project modal, copy and toast, expand toggles, Read more.
- Visual diff: all 7 cases pass with matching page heights (see below).

| case | diff % | ref height | app height |
|---|---|---|---|
| mobile-light | 0.21 | 9588 | 9588 |
| mobile-dark | 0.20 | 9588 | 9588 |
| tablet-dark | 0.11 | 7203 | 7203 |
| laptop-light | 0.10 | 5685 | 5685 |
| laptop-dark | 0.09 | 5685 | 5685 |
| fullhd-dark | 0.07 | 6398 | 6398 |
| 4k-light | 0.06 | 10669 | 10669 |

The remaining difference is mostly the contact form. The reference says "Sign in to Claude to send a message" and disables the button; the app has a working form.

- Providers chosen: Vercel hosting, Supabase (content, messages, images), Resend (email), password login.
- Backend built: `/api/auth`, `/api/content`, `/api/contact` (zod, honeypot, per-IP rate limit, Resend email), `/api/messages`, `/api/upload`. Without Supabase keys it falls back to local files.
- `/admin` editor: all 13 tabs, every field type, list add/remove/reorder, live preview (160ms debounce), Discard, Publish, JSON apply/copy, Messages with delete, Sign out.
- Refactor for performance: sections are Server Components; only the Shell and small islands hydrate. Lighthouse mobile went from 68 to 90–92.
- End-to-end test of the owner flow passed: sign in, edit, upload, accent, add/move/hide, messages, publish, and visitors see the changes.

## Acceptance checklist
- [x] `globals.css` byte-identical to `handoff/design-source/styles.css`
- [x] Visual diff passes all 7 cases with matching heights
- [x] Light/dark/auto themes persist with no flash
- [x] Palette, modal, copy, rotator, tilt, expand toggles, Read more
- [x] No horizontal scroll at 360px; rem scaling from the CSS
- [x] Lighthouse mobile: Performance 90–92 (target ≥ 90), Accessibility 95 (target ≥ 95)
- [x] Contact form stores messages, admin reads them, uploads work, edits persist after publish (tested with local storage)
- [x] No hard-coded content outside `content/portfolio.json`

## Not done yet / to verify
- The Supabase and Resend paths are written but untested here. They need real keys. Test after setting up the project.
- Accessibility points kept as designed: muted `--text-3` contrast, the profile card's `h3` after the `h1`, and the logo's "Back to top" label.
- The rate limit is per server instance (best effort on serverless).

## Running the visual diff
```
npm run dev
node handoff/scripts/visual-diff.mjs
```
It needs `playwright`, `pixelmatch` and `pngjs`.

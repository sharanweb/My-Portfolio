# Portfolio

Personal portfolio built with Next.js (App Router, TypeScript). It's a rebuild of the design in `handoff/` and matches it pixel for pixel. All content lives in one JSON document that you edit from `/admin`.

## Run locally

```bash
npm install
cp .env.example .env.local   # then set ADMIN_PASSWORD
npm run dev
```

Open http://localhost:3000. Sign in at http://localhost:3000/admin with `ADMIN_PASSWORD`.

Without Supabase keys the app uses local files:
- content: `content/portfolio.json`
- messages: `data/messages.json`
- uploads: `public/uploads/`

That's fine on your computer, but on Vercel you need Supabase because the file system there is read-only.

## Deploy (Vercel + Supabase + Resend)

1. **Supabase.** Create a project, open the SQL editor, and run `supabase/schema.sql`. It creates the `portfolio_content` and `messages` tables and a public `portfolio` storage bucket.
2. **Resend** (optional). Create an API key. Until you verify your own domain, mail is sent from `onboarding@resend.dev` and can only go to the address you signed up with.
3. **Vercel.** Import the GitHub repo, then add these under Settings → Environment Variables:

   | Variable | Value |
   |---|---|
   | `ADMIN_PASSWORD` | A long password for `/admin` |
   | `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key (server-only, never expose it) |
   | `RESEND_API_KEY` | Optional |
   | `CONTACT_TO_EMAIL` | Optional; defaults to the email in the Contact section |
   | `RESEND_FROM` | Optional, e.g. `Portfolio <hello@yourdomain.com>` once your domain is verified |

4. Deploy, open `/admin`, and choose **Publish changes** once. That copies the content into Supabase. Until then the site shows `content/portfolio.json`.

## How it works

| Path | What it is |
|---|---|
| `app/globals.css` | The design's stylesheet, unchanged. Don't edit it; the visual parity depends on it. |
| `components/page/` | Page sections. They render as Server Components on the public site and on the client in the `/admin` live preview. |
| `components/page/islands.tsx` | The few interactive pieces inside sections: experience toggle, Read more, contact form. |
| `components/Shell.tsx` | Client behaviour: theme, aurora background, clock, rotator, palette (⌘K / `/`), project modal, copy and toasts. Clicks are handled by delegation on `data-*` attributes. |
| `components/admin/` | The editor drawer: 13 tabs, live preview, publish. Loaded only on `/admin`. |
| `app/api/` | `auth` (password sign-in), `content` (GET; PUT is owner only), `contact` (validated, rate-limited, honeypot), `messages` (owner only), `upload` (owner only, images up to 4 MB). |
| `lib/storage/` | Supabase store, plus a local-file store used when Supabase isn't configured. |
| `lib/content.ts` | Loads and saves content, and sends only the icons the page uses to the browser. |

Publishing calls `revalidatePath('/')`, so the static home page updates immediately.

## Checks

```bash
npm run lint                         # TypeScript
node handoff/scripts/visual-diff.mjs # needs `npm run dev` running and Playwright installed
```

GitHub Actions (`.github/workflows/ci.yml`) runs `npm run lint` and `npm run build` on every push to `main` and on pull requests.

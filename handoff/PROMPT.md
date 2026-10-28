Paste this into Claude Code from an empty project folder that contains the `handoff/` folder.

---

I have a finished portfolio design in `./handoff`. Please rebuild it as a Next.js (App Router, TypeScript) app that looks pixel-identical to the reference and behaves the same.

1. Read `handoff/SPEC.md` fully before writing code. It is the build spec. Then open `handoff/reference/index.html` and `handoff/reference/owner.html` and read `handoff/design-source/app.reference.js` — that file defines the exact markup and behaviour.
2. Scaffold Next.js with TypeScript and no Tailwind. Copy `handoff/design-source/styles.css` to `app/globals.css` unchanged, `handoff/types/portfolio.ts` to `types/`, and `handoff/design-source/portfolio.json` to `content/`.
3. Build the public page first, component by component, following the mapping table in the spec. Keep every class name and DOM structure the same as the reference.
4. Run `node handoff/scripts/visual-diff.mjs` against `npm run dev` and fix differences until every case is under 1%. Show me the summary table.
5. Then build the backend pieces in the "Replacing the prototype runtime" section: password-protected `/admin` editor, content API, contact form API with stored messages, and image uploads. Ask me which storage and email provider to use before installing anything for those.
6. Work through the acceptance checklist at the end of the spec and report what passes.

Keep a short progress log in `PROGRESS.md` so we can resume later.

# Portfolio handoff kit

Everything Claude Code needs to rebuild the portfolio as a Next.js app that looks the same as the current design.

## How to use it

1. Create an empty folder for your project and unzip this kit into it, so you have `your-project/handoff/`.
2. Open the project folder in Claude Code.
3. Paste the text from `PROMPT.md`.

Claude Code builds the public site, compares it with the reference using screenshots until they match, then builds the admin editor and contact form backend. It asks you which database and email provider you want before it installs anything for them.

## What's inside

| Path | What it is |
|---|---|
| `reference/index.html` | The current design, runnable offline. Double-click to open it in a browser. This is the visual source of truth. |
| `reference/owner.html` | The same page with the owner editor turned on through a local mock, so you can see the admin UI. Saving doesn't work here. |
| `design-source/styles.css` | The exact stylesheet. It's reused unchanged in Next.js, which is what keeps the UI identical. |
| `design-source/app.reference.js` | The working logic and markup, which Claude Code ports to React components. |
| `design-source/portfolio.json` | All the content: text, sections, colours and links. Edit this to change the site. |
| `design-source/icons.json` | About 230 tech and social brand icons. |
| `types/portfolio.ts` | TypeScript types for the content. |
| `scripts/visual-diff.mjs` | Compares the reference and the new app at 7 screen sizes and reports the pixel difference. |
| `SPEC.md` | The full build spec for Claude Code. |
| `PROMPT.md` | The message to paste into Claude Code. |

## Notes

- The content in `portfolio.json` is the current sample. Edit it before or after the build, or use the admin editor once it exists.
- Edits you make in the claude.ai version after this kit was made aren't included. To bring them over, open Edit, then the JSON tab, then Copy JSON, and paste the result over `design-source/portfolio.json`.
- Icon credits: Simple Icons (CC0) and Font Awesome Free brand icons (CC BY 4.0). Brand logos belong to their owners.

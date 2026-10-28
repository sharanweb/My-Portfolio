// Visual parity check: compares the reference design with the Next.js build.
//
// Usage:
//   npm i -D playwright pixelmatch pngjs && npx playwright install chromium
//   npm run dev            # in another terminal, app on http://localhost:3000
//   node scripts/visual-diff.mjs [http://localhost:3000]
//
// Output: ./visual-diff/<case>-reference.png, -app.png, -diff.png and a summary.
// Target: every case under 1% differing pixels (animations are frozen first).

import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const APP = process.argv[2] || "http://localhost:3000";
const REF = pathToFileURL(path.resolve("handoff/reference/index.html")).href;
const OUT = path.resolve("visual-diff");
fs.mkdirSync(OUT, { recursive: true });

const CASES = [
  { name: "mobile-light", width: 390, height: 844, scheme: "light" },
  { name: "mobile-dark", width: 390, height: 844, scheme: "dark" },
  { name: "tablet-dark", width: 900, height: 1100, scheme: "dark" },
  { name: "laptop-light", width: 1440, height: 900, scheme: "light" },
  { name: "laptop-dark", width: 1440, height: 900, scheme: "dark" },
  { name: "fullhd-dark", width: 1920, height: 1080, scheme: "dark" },
  { name: "4k-light", width: 3840, height: 2160, scheme: "light" },
];

// Freeze everything that moves so screenshots are deterministic.
const FREEZE = `
  *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
  html { scroll-behavior: auto !important; }
  #bg-canvas, canvas { visibility: hidden !important; }
  [data-clock] { visibility: hidden !important; }
`;

async function shoot(browser, url, c, file) {
  const page = await browser.newPage({ viewport: { width: c.width, height: c.height }, colorScheme: c.scheme, reducedMotion: "reduce" });
  await page.addInitScript(() => { try { localStorage.clear(); } catch {} });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: FREEZE });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(600);
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
}

const browser = await chromium.launch();
const rows = [];
for (const c of CASES) {
  const ref = path.join(OUT, `${c.name}-reference.png`);
  const app = path.join(OUT, `${c.name}-app.png`);
  await shoot(browser, REF, c, ref);
  await shoot(browser, APP, c, app);
  const a = PNG.sync.read(fs.readFileSync(ref));
  const b = PNG.sync.read(fs.readFileSync(app));
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  const crop = (img) => { const o = new PNG({ width: w, height: h }); PNG.bitblt(img, o, 0, 0, w, h, 0, 0); return o; };
  const ca = crop(a), cb = crop(b), diff = new PNG({ width: w, height: h });
  const n = pixelmatch(ca.data, cb.data, diff.data, w, h, { threshold: 0.1 });
  fs.writeFileSync(path.join(OUT, `${c.name}-diff.png`), PNG.sync.write(diff));
  const pct = (100 * n) / (w * h);
  rows.push({ case: c.name, diffPercent: pct.toFixed(2), heightRef: a.height, heightApp: b.height, pass: pct < 1 && Math.abs(a.height - b.height) < 8 });
}
await browser.close();
console.table(rows);
process.exit(rows.every((r) => r.pass) ? 0 : 1);

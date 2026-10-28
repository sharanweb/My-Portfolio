import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { IconMap, Portfolio } from "@/types/portfolio";
import { normalize, usedIcons } from "./model";
import { PLATFORMS } from "./urls";
import { store } from "./storage";
import ICONS from "./icons.json";

const SEED = path.join(process.cwd(), "content", "portfolio.json");

/** Reads the portfolio content, falling back to content/portfolio.json until the first publish. */
export async function loadContent(): Promise<Portfolio> {
  let raw = await store().getContent();
  if (!raw) raw = JSON.parse(await fs.readFile(SEED, "utf8"));
  return normalize(raw);
}

export async function saveContent(data: Portfolio): Promise<void> {
  const clean = normalize(JSON.parse(JSON.stringify(data)));
  delete clean.sample;
  await store().putContent(clean);
}

export const ALL_ICONS = ICONS as IconMap;

/** Only the icons this content uses, so the public page doesn't ship all ~230. */
export function iconsFor(d: Portfolio): IconMap {
  const platforms = d.socials.map((s) => (PLATFORMS[s.platform] || PLATFORMS.other).i || "").filter(Boolean);
  return usedIcons(d, ALL_ICONS, platforms);
}

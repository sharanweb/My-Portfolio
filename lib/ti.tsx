// Pure icon renderers usable from Server and Client Components.
import type { CSSProperties, ReactNode } from "react";
import type { IconMap, Social } from "@/types/portfolio";
import { brandColor, key, monogram } from "./icons";
import { PLATFORMS } from "./urls";
import { Icon } from "@/components/Icon";

export interface TechIconInfo { node: ReactNode; color: string; found: boolean }

export function svgFor(icons: IconMap, k: string) {
  const i = icons[k];
  return <svg className="bi" viewBox={i.v || '0 0 24 24'} aria-hidden="true"><path d={i.p} /></svg>;
}

/** Inner icon + brand colour for a tech / platform name (techIcon in the reference). */
export function techIcon(name: string, icons: IconMap): TechIconInfo {
  const k = key(name, icons);
  if (!k) return { node: <span className="mono-ico" aria-hidden="true">{monogram(name)}</span>, color: '', found: false };
  return { node: svgFor(icons, k), color: brandColor(k, icons), found: true };
}

export const brandStyle = (color: string) => (color ? ({ '--brand': color } as CSSProperties) : undefined);

/** <span class="ti"> wrapper (tiSpan in the reference). */
export function Ti({ name, icons, extra }: { name: string; icons: IconMap; extra?: string }) {
  const t = techIcon(name, icons);
  return <span className={'ti' + (t.color ? '' : ' mono') + (extra ? ' ' + extra : '')} style={brandStyle(t.color)}>{t.node}</span>;
}

export interface PlatformInfo { name: string; iconKey: string; glyph: string; color: string; mono: boolean }

export function platformInfo(s: Social, icons: IconMap): PlatformInfo {
  const p = PLATFORMS[s.platform] || PLATFORMS.other;
  if (p.i && icons[p.i]) { const color = brandColor(p.i, icons); return { name: p.n, iconKey: p.i, glyph: '', color, mono: !color }; }
  return { name: p.n, iconKey: '', glyph: p.g || 'link', color: '', mono: true };
}

export function PlatformIcon({ info, icons }: { info: PlatformInfo; icons: IconMap }) {
  return info.iconKey ? svgFor(icons, info.iconKey) : <Icon name={info.glyph} />;
}

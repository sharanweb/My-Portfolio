// Accent colour derivation, ported from applyAppearance() in app.reference.js.
export function hexToHsl(hex: string): [number, number, number] {
  hex = hex.replace('#', ''); if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const n = parseInt(hex, 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
  }
  return [h, s * 100, l * 100];
}

export function hsl(h: number, s: number, l: number) { return 'hsl(' + ((h % 360) + 360) % 360 + ' ' + Math.round(s) + '% ' + Math.round(l) + '%)'; }

export const ACCENTS: [string, string][] = [['Cobalt', '#2b59e8'], ['Violet', '#6d4aff'], ['Emerald', '#0f9f6e'], ['Rose', '#e0386b'], ['Amber', '#c26a00'], ['Teal', '#0e8fa3'], ['Graphite', '#3a3f4b']];

export interface AccentInfo { hue: number; sat: number; vars: Record<string, string> }

export function accentInfo(accent: string): AccentInfo {
  const hex = /^#[0-9a-f]{3,6}$/i.test(accent || '') ? accent : '#2b59e8';
  const c = hexToHsl(hex), h = c[0], s = Math.max(c[1], 8), l = c[2];
  return {
    hue: h, sat: s,
    vars: {
      '--acc-l': hex,
      '--acc2-l': hsl(h + 28, s, Math.min(l + 8, 62)),
      '--acc-d': hsl(h, Math.min(s, 92), Math.max(70, l + 20)),
      '--acc2-d': hsl(h + 28, Math.min(s, 90), 80),
    },
  };
}

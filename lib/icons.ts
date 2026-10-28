// Brand / tech icon lookup, ported from app.reference.js (key, ALIAS, lum, brandColor, techIcon).
import type { IconMap } from "@/types/portfolio";

export const ALIAS: Record<string, string> = { html: 'html5', vue: 'vuedotjs', vuejs: 'vuedotjs', node: 'nodedotjs', nodejs: 'nodedotjs', next: 'nextdotjs', nextjs: 'nextdotjs', reactjs: 'react', reactnative: 'react', js: 'javascript', ts: 'typescript', k8s: 'kubernetes', golang: 'go', mongo: 'mongodb', postgres: 'postgresql', tailwind: 'tailwindcss', gcp: 'googlecloud', amazonwebservices: 'aws', awscloud: 'aws', twitterx: 'x', devto: 'devdotto', devdotto: 'devdotto', rails: 'rubyonrails', sklearn: 'scikitlearn', threejs: 'threedotjs', d3js: 'd3', d3dotjs: 'd3', materialui: 'mui', shadcn: 'shadcnui', csharp: 'dotnet', net: 'dotnet', aspnet: 'dotnet', expressjs: 'express', nuxtjs: 'nuxt', nuxtdotjs: 'nuxt', bash: 'gnubash', shell: 'gnubash', css3: 'css', scss: 'sass', socketio: 'socketdotio', nestjs: 'nestjs', springboot: 'springboot', mysqldb: 'mysql', tf: 'tensorflow', openjdk: 'openjdk', microsoftazure: 'azure', visualstudiocode: 'vscodium', vscode: 'vscodium', gh: 'github', githubcopilot: 'github', amazon: 'aws', meta: 'meta', facebookmeta: 'meta', cpp: 'cplusplus', 'c++': 'cplusplus', reactquery: 'reactquery', tanstackquery: 'reactquery', framermotion: 'framer', huggingface: 'huggingface', chatgpt: 'openai', ms: 'microsoft', msoffice: 'microsoft', microsoftoffice: 'microsoft', stackoverflow: 'stackoverflow', leetcode: 'leetcode', email: '', website: '' };

export function key(name: string, icons: IconMap): string {
  const k = String(name || '').toLowerCase().trim().replace(/\+/g, 'plus').replace(/#/g, 'sharp').replace(/\./g, 'dot').replace(/[^a-z0-9]/g, '');
  if (icons[k]) return k;
  const k2 = String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (ALIAS[k2] && icons[ALIAS[k2]]) return ALIAS[k2];
  if (icons[k2]) return k2;
  if (k.slice(-6) === 'dotjs' && icons[k.slice(0, -6)]) return k.slice(0, -6);
  if (k.slice(-2) === 'js' && icons[k.slice(0, -2)]) return k.slice(0, -2);
  return '';
}

export function lum(hex: string): number {
  const n = parseInt(hex, 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const f = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Brand colour, or '' when it is too dark or too light to read (falls back to the text colour). */
export function brandColor(k: string, icons: IconMap): string {
  const i = icons[k]; if (!i) return '';
  const L = lum(i.h);
  return (L < 0.05 || L > 0.8) ? '' : '#' + i.h;
}

/** Two-letter monogram for names without an icon. */
export function monogram(name: string): string {
  return String(name || '').replace(/\*/g, '').replace(/[^A-Za-z0-9]/g, '').slice(0, 2) || '•';
}


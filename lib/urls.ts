// URL helpers, ported from app.reference.js.
import type { Social } from "@/types/portfolio";

export function safeUrl(u: string | undefined | null): string {
  u = String(u || '').trim(); if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  if (/^\/(_blob|uploads)\//.test(u)) return u;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(u)) return 'https://' + u;
  return '';
}

export interface PlatformDef { n: string; i?: string; g?: string; base: string }
export const PLATFORMS: Record<string, PlatformDef> = {
  linkedin: { n: 'LinkedIn', i: 'linkedin', base: 'https://www.linkedin.com/in/' }, github: { n: 'GitHub', i: 'github', base: 'https://github.com/' }, medium: { n: 'Medium', i: 'medium', base: 'https://medium.com/@' },
  x: { n: 'X (Twitter)', i: 'x', base: 'https://x.com/' }, discord: { n: 'Discord', i: 'discord', base: '' }, instagram: { n: 'Instagram', i: 'instagram', base: 'https://instagram.com/' },
  youtube: { n: 'YouTube', i: 'youtube', base: 'https://youtube.com/@' }, dribbble: { n: 'Dribbble', i: 'dribbble', base: 'https://dribbble.com/' }, behance: { n: 'Behance', i: 'behance', base: 'https://behance.net/' },
  devto: { n: 'DEV', i: 'devdotto', base: 'https://dev.to/' }, hashnode: { n: 'Hashnode', i: 'hashnode', base: '' }, substack: { n: 'Substack', i: 'substack', base: '' },
  stackoverflow: { n: 'Stack Overflow', i: 'stackoverflow', base: '' }, leetcode: { n: 'LeetCode', i: 'leetcode', base: 'https://leetcode.com/u/' }, hackerrank: { n: 'HackerRank', i: 'hackerrank', base: 'https://www.hackerrank.com/profile/' },
  kaggle: { n: 'Kaggle', i: 'kaggle', base: 'https://kaggle.com/' }, threads: { n: 'Threads', i: 'threads', base: 'https://threads.net/@' }, bluesky: { n: 'Bluesky', i: 'bluesky', base: 'https://bsky.app/profile/' },
  mastodon: { n: 'Mastodon', i: 'mastodon', base: '' }, telegram: { n: 'Telegram', i: 'telegram', base: 'https://t.me/' }, whatsapp: { n: 'WhatsApp', i: 'whatsapp', base: 'https://wa.me/' },
  reddit: { n: 'Reddit', i: 'reddit', base: 'https://reddit.com/u/' }, twitch: { n: 'Twitch', i: 'twitch', base: 'https://twitch.tv/' }, facebook: { n: 'Facebook', i: 'facebook', base: 'https://facebook.com/' },
  producthunt: { n: 'Product Hunt', i: 'producthunt', base: 'https://www.producthunt.com/@' }, geeksforgeeks: { n: 'GeeksforGeeks', i: 'geeksforgeeks', base: '' }, codechef: { n: 'CodeChef', i: 'codechef', base: 'https://www.codechef.com/users/' },
  website: { n: 'Website', g: 'globe', base: '' }, blog: { n: 'Blog', g: 'pen', base: '' }, other: { n: 'Link', g: 'link', base: '' },
};

export function socialUrl(s: Social): string {
  const u = String(s.url || '').trim(); if (!u) return '';
  const p = PLATFORMS[s.platform] || ({} as PlatformDef);
  if (/^https?:\/\//i.test(u)) return u;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(u)) return 'https://' + u;
  if (p.base) return p.base + u.replace(/^@/, '');
  return '';
}

export function socialHandle(s: Social): string {
  if (s.handle) return s.handle;
  const u = String(s.url || '').trim().replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
  if (!u) return '';
  const parts = u.split('/'); const last = parts[parts.length - 1];
  if (parts.length > 1 && last) return (last.charAt(0) === '@' ? '' : '@') + last.replace(/^in$/, parts[parts.length - 2]);
  return u;
}

export function liUrl(u: string): string {
  u = String(u || '').trim(); if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  if (/linkedin\.com/i.test(u)) return 'https://' + u.replace(/^\/+/, '');
  return 'https://www.linkedin.com/in/' + u.replace(/^@/, '');
}

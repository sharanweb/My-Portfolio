// Content defaults and derived values, ported from app.reference.js.
import type { Portfolio, SectionConfig, SectionId, Social } from "@/types/portfolio";
import { socialUrl } from "./urls";
import { key } from "./icons";
import type { IconMap } from "@/types/portfolio";

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'stack', show: true, nav: '', eyebrow: '', title: '', subtitle: '' },
  { id: 'about', show: true, nav: 'About', eyebrow: 'About', title: 'A developer who cares about the *details*.', subtitle: '' },
  { id: 'work', show: true, nav: 'Work', eyebrow: 'Selected work', title: 'Projects I have *built and shipped*.', subtitle: '' },
  { id: 'experience', show: true, nav: 'Experience', eyebrow: 'Experience', title: 'Where I have *worked and learned*.', subtitle: '' },
  { id: 'testimonials', show: true, nav: 'Testimonials', eyebrow: 'Testimonials', title: 'Kind words from *people I’ve worked with*.', subtitle: 'Recommendations from clients, managers and teammates.' },
  { id: 'achievements', show: true, nav: 'Awards', eyebrow: 'Achievements', title: 'Recognition along the *way*.', subtitle: '' },
  { id: 'certifications', show: true, nav: 'Certifications', eyebrow: 'Certifications', title: 'Always *learning*.', subtitle: '' },
  { id: 'socials', show: true, nav: 'Socials', eyebrow: 'Find me online', title: 'Where I am *active*.', subtitle: '' },
  { id: 'contact', show: true, nav: 'Contact', eyebrow: 'Contact', title: 'Let’s build something *together*.', subtitle: '' },
];

export const SECTION_NAMES: Record<SectionId, string> = { stack: 'Tech strip', about: 'About & skills', work: 'Projects', experience: 'Experience', testimonials: 'Testimonials', achievements: 'Achievements', certifications: 'Certifications', socials: 'Socials', contact: 'Contact' };

export const TAB_FOR: Record<SectionId, string> = { stack: 'about', about: 'about', work: 'projects', experience: 'experience', testimonials: 'testimonials', achievements: 'achievements', certifications: 'certifications', socials: 'socials', contact: 'contact' };

const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

/** Fills defaults and migrates older content shapes. Accepts anything; returns a valid Portfolio. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalize(input: any): Portfolio {
  const d = input && typeof input === 'object' ? input : {};
  d.theme = Object.assign({ accent: '#2b59e8', background: 'aurora', animate: true, grain: true, defaultMode: 'auto', serifAccent: true }, d.theme || {});
  d.profile = Object.assign({ name: 'Your Name', initials: '', role: '', company: '', headline: '', rotatePrefix: '', rotating: [], bio: '', location: '', timezone: 'Asia/Kolkata', tzLabel: 'IST', available: false, availabilityText: '', avatar: '', focus: '', yearsLabel: '', resume: '', ctaPrimary: 'View my work', ctaSecondary: 'Get in touch', footer: '' }, d.profile || {});
  if (d.profile.headlineMuted && d.profile.headline.indexOf('*') < 0) { d.profile.headline += ' *' + d.profile.headlineMuted + '*'; delete d.profile.headlineMuted; }
  d.contact = Object.assign({ email: '', phone: '', discord: '', address: '', note: '', form: true }, d.contact || {});
  ['stats', 'skills', 'learning', 'interests', 'projects', 'experience', 'testimonials', 'achievements', 'certifications', 'socials'].forEach((k) => { if (!Array.isArray(d[k])) d[k] = []; });
  if (d.contact.linkedin) { d.socials.push({ platform: 'linkedin', url: d.contact.linkedin, handle: '', description: '', metric: '' }); delete d.contact.linkedin; }
  if (d.contact.github) { d.socials.push({ platform: 'github', url: d.contact.github, handle: '', description: '', metric: '' }); delete d.contact.github; }
  if (!Array.isArray(d.sections)) d.sections = clone(DEFAULT_SECTIONS);
  DEFAULT_SECTIONS.forEach((s) => {
    if (d.sections.some((x: SectionConfig) => x.id === s.id)) return;
    const ci = d.sections.map((x: SectionConfig) => x.id).indexOf(s.id === 'testimonials' ? 'achievements' : 'contact');
    if (ci < 0) d.sections.push(clone(s)); else d.sections.splice(ci, 0, clone(s));
  });
  d.sections = d.sections.filter((s: SectionConfig) => SECTION_NAMES[s.id]);
  d.version = 3;
  return d as Portfolio;
}

export function initials(n: string) { return String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join(''); }

export function sec(d: Portfolio, id: SectionId): Partial<SectionConfig> { return d.sections.filter((s) => s.id === id)[0] || {}; }
export function shown(d: Portfolio, id: SectionId) { return sec(d, id).show !== false; }

export function liveSocials(d: Portfolio): Social[] { return (d.socials || []).filter((s) => socialUrl(s) || (s.platform === 'discord' && (s.handle || s.url))); }

export function allTech(d: Portfolio): string[] {
  const all: string[] = [];
  (d.skills || []).forEach((g) => (g.items || []).forEach((t) => { if (all.indexOf(t) < 0) all.push(t); }));
  (d.projects || []).forEach((p) => (p.tags || []).forEach((t) => { if (all.indexOf(t) < 0) all.push(t); }));
  return all;
}

export function hasContent(d: Portfolio, id: SectionId, isEditor: boolean): boolean {
  switch (id) {
    case 'stack': return allTech(d).length > 0;
    case 'about': return !!(d.about || d.skills.length || d.learning.length || d.interests.length);
    case 'work': return d.projects.length > 0 || isEditor;
    case 'experience': return d.experience.length > 0 || isEditor;
    case 'achievements': return d.achievements.length > 0 || isEditor;
    case 'testimonials': return d.testimonials.length > 0 || isEditor;
    case 'certifications': return d.certifications.length > 0 || isEditor;
    case 'socials': return liveSocials(d).length > 0 || isEditor;
    case 'contact': return true;
  }
  return true;
}

export function navItems(d: Portfolio, isEditor: boolean) { return d.sections.filter((s) => s.show !== false && s.nav && hasContent(d, s.id, isEditor)); }

export function statusClass(s: string) {
  s = String(s || '').toLowerCase();
  if (s.indexOf('live') > -1 || s.indexOf('shipped') > -1 || s.indexOf('launch') > -1) return 'live';
  if (s.indexOf('progress') > -1 || s.indexOf('wip') > -1 || s.indexOf('building') > -1 || s.indexOf('beta') > -1) return 'wip';
  return 'archived';
}

/** Every icon name the public page can show, so the server ships only those icons. */
export function iconNames(d: Portfolio): string[] {
  const n: string[] = ['linkedin', 'github', 'discord'];
  allTech(d).forEach((t) => n.push(t));
  d.learning.forEach((t) => n.push(t));
  d.certifications.forEach((c) => n.push(c.icon || c.issuer));
  return n;
}

export function usedIcons(d: Portfolio, icons: IconMap, platformIcons: string[]): IconMap {
  const out: IconMap = {};
  iconNames(d).concat(platformIcons).forEach((name) => { const k = key(name, icons); if (k) out[k] = icons[k]; });
  return out;
}

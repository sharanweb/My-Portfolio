// List editor configuration (LISTS in app.reference.js).
import { PLATFORMS } from "@/lib/urls";
import type { FieldSpec } from "./fields";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Item = any;
export interface ListCfg { add: string; title: (x: Item) => string; f: FieldSpec[]; tpl: () => Item }

const PLATFORM_OPTS = Object.keys(PLATFORMS).map((k) => [k, PLATFORMS[k].n] as [string, string]);

export const LISTS: Record<string, ListCfg> = {
  stats: { add: 'Add stat', title: (s) => s.value + ' ' + s.label, f: [{ k: 'value', l: 'Value', half: true }, { k: 'label', l: 'Label', half: true }], tpl: () => ({ value: '0', label: 'New stat' }) },
  skills: { add: 'Add skill group', title: (s) => s.group, f: [{ k: 'group', l: 'Group name' }, { k: 'items', l: 'Skills', t: 'icons', hint: 'Separate with commas. Icons are matched by name automatically.' }], tpl: () => ({ group: 'New group', items: [] }) },
  projects: {
    add: 'Add project', title: (p) => p.title, f: [
      { k: 'title', l: 'Title', half: true }, { k: 'status', l: 'Status', half: true, hint: 'Live, In progress, Archived…' },
      { k: 'summary', l: 'Card summary', t: 'area', rows: 2 }, { k: 'details', l: 'Full description', t: 'area', rows: 4 },
      { k: 'highlights', l: 'Highlights', t: 'lines', hint: 'One per line' }, { k: 'tags', l: 'Tech stack', t: 'icons', hint: 'Shown as icons on the card' },
      { k: 'role', l: 'Your role', half: true }, { k: 'year', l: 'Year', half: true }, { k: 'link', l: 'Live link', ph: 'https://', half: true }, { k: 'repo', l: 'Source link', ph: 'https://github.com/…', half: true },
      { k: 'hue', l: 'Cover color', t: 'hue' }, { k: 'image', l: 'Cover image (optional)', t: 'upload', hint: 'Replaces the generated cover' }],
    tpl: () => ({ title: 'New project', summary: '', details: '', highlights: [], tags: [], status: 'In progress', year: String(new Date().getFullYear()), role: '', link: '', repo: '', hue: Math.floor(Math.random() * 360), image: '' }),
  },
  experience: {
    add: 'Add entry', title: (j) => j.role + (j.company ? ' · ' + j.company : ''), f: [
      { k: 'role', l: 'Role or degree', half: true }, { k: 'company', l: 'Company or school', half: true }, { k: 'start', l: 'Start', half: true }, { k: 'end', l: 'End', half: true, hint: 'Write "Present" for a current role' },
      { k: 'type', l: 'Type', half: true, hint: 'Full-time, Internship, Education…' }, { k: 'location', l: 'Location', half: true }, { k: 'summary', l: 'Summary', t: 'area', rows: 2 }, { k: 'points', l: 'Highlights', t: 'lines', hint: 'One per line' }],
    tpl: () => ({ role: 'New role', company: '', type: 'Full-time', start: '', end: 'Present', location: '', summary: '', points: [] }),
  },
  testimonials: {
    add: 'Add testimonial', title: (t) => t.name + (t.company ? ' · ' + t.company : ''), f: [
      { k: 'name', l: 'Their name', half: true }, { k: 'title', l: 'Their role', half: true, ph: 'Engineering Manager' },
      { k: 'company', l: 'Company', half: true }, { k: 'relation', l: 'How you worked together', half: true, ph: 'Client, Manager, Teammate…' },
      { k: 'quote', l: 'What they said', t: 'area', rows: 5, hint: 'Paste their recommendation. Long quotes get a Read more toggle.' },
      { k: 'linkedin', l: 'Their LinkedIn', half: true, ph: 'linkedin.com/in/… or username' }, { k: 'date', l: 'Date', half: true, ph: 'Mar 2026' },
      { k: 'avatar', l: 'Their photo (optional)', t: 'upload', hint: 'Initials are shown when there is no photo' }, { k: 'featured', l: 'Feature this one at the top', t: 'bool' }],
    tpl: () => ({ name: 'New person', title: '', company: '', relation: 'Client', quote: '', linkedin: '', date: '', avatar: '', featured: false }),
  },
  achievements: {
    add: 'Add achievement', title: (a) => a.title, f: [
      { k: 'title', l: 'Title' }, { k: 'org', l: 'Event or organisation', half: true }, { k: 'date', l: 'Date', half: true },
      { k: 'badge', l: 'Badge text', half: true, hint: 'e.g. 1st place, Finalist' }, { k: 'medal', l: 'Icon style', t: 'select', half: true, opts: [['gold', 'Gold trophy'], ['silver', 'Silver medal'], ['bronze', 'Bronze medal'], ['accent', 'Star (accent color)']] },
      { k: 'description', l: 'Description', t: 'area', rows: 2 }, { k: 'link', l: 'Link (optional)', ph: 'https://' }],
    tpl: () => ({ title: 'New achievement', org: '', date: String(new Date().getFullYear()), badge: '', medal: 'gold', description: '', link: '' }),
  },
  certifications: {
    add: 'Add certification', title: (c) => c.name, f: [
      { k: 'name', l: 'Certificate name' }, { k: 'issuer', l: 'Issuer', half: true }, { k: 'icon', l: 'Logo', half: true, hint: 'Brand name for the logo, e.g. aws, google, coursera' },
      { k: 'date', l: 'Issued', half: true }, { k: 'credentialId', l: 'Credential ID', half: true }, { k: 'link', l: 'Verification link', ph: 'https://' }],
    tpl: () => ({ name: 'New certification', issuer: '', icon: '', date: '', credentialId: '', link: '' }),
  },
  socials: {
    add: 'Add profile', title: (s) => (PLATFORMS[s.platform] || PLATFORMS.other).n + (s.handle ? ' · ' + s.handle : ''), f: [
      { k: 'platform', l: 'Platform', t: 'select', opts: PLATFORM_OPTS, half: true }, { k: 'url', l: 'Profile link or username', half: true, ph: 'https://… or yourname' },
      { k: 'handle', l: 'Display handle (optional)', half: true, ph: '@yourname' }, { k: 'metric', l: 'Stat (optional)', half: true, ph: '1.2k followers' }, { k: 'description', l: 'What people find there' }],
    tpl: () => ({ platform: 'website', url: '', handle: '', description: '', metric: '' }),
  },
};

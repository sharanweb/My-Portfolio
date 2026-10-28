// Content model for the portfolio. Mirrors design-source/portfolio.json exactly.
// Every visible string, link, section and appearance option comes from this object.

export type SectionId =
  | "stack" | "about" | "work" | "experience" | "testimonials"
  | "achievements" | "certifications" | "socials" | "contact";

export interface SectionConfig {
  id: SectionId;
  show: boolean;
  /** Menu label. Empty string = not in the nav. */
  nav: string;
  eyebrow: string;
  /** Words wrapped in *asterisks* render as the italic serif accent. */
  title: string;
  subtitle: string;
}

export interface Theme {
  /** Hex colour. Light/dark accent variants are derived from it (see applyAppearance in app.reference.js). */
  accent: string;
  background: "aurora" | "mesh" | "minimal";
  animate: boolean;
  grain: boolean;
  defaultMode: "auto" | "light" | "dark";
  serifAccent: boolean;
}

export interface Profile {
  name: string;
  initials: string;
  role: string;
  company: string;
  /** Supports *accent* markup. */
  headline: string;
  rotatePrefix: string;
  rotating: string[];
  bio: string;
  location: string;
  /** IANA zone, e.g. "Asia/Kolkata". Drives the live clock. */
  timezone: string;
  tzLabel: string;
  available: boolean;
  availabilityText: string;
  /** Image URL, empty = initials. */
  avatar: string;
  focus: string;
  yearsLabel: string;
  resume: string;
  ctaPrimary: string;
  ctaSecondary: string;
  footer: string;
}

export interface Stat { value: string; label: string }
/** Skill names are matched to brand icons by name (see techKey / ALIAS in app.reference.js). */
export interface SkillGroup { group: string; items: string[] }

export interface Project {
  title: string;
  summary: string;
  details: string;
  highlights: string[];
  /** Tech names, rendered as icons. */
  tags: string[];
  /** "Live" | "In progress" | "Archived" | free text (classified by statusClass). */
  status: string;
  year: string;
  role: string;
  link: string;
  repo: string;
  /** 0–360, colour of the generated cover. */
  hue: number;
  /** Optional cover image URL; replaces the generated cover. */
  image: string;
}

export interface Experience {
  role: string;
  company: string;
  type: string;
  start: string;
  /** "Present" marks the current role. */
  end: string;
  location: string;
  summary: string;
  points: string[];
}

export interface Testimonial {
  name: string;
  title: string;
  company: string;
  relation: string;
  quote: string;
  /** Full URL or bare username. */
  linkedin: string;
  date: string;
  avatar: string;
  featured: boolean;
}

export interface Achievement {
  title: string;
  org: string;
  date: string;
  badge: string;
  medal: "gold" | "silver" | "bronze" | "accent";
  description: string;
  link: string;
}

export interface Certification {
  name: string;
  issuer: string;
  /** Brand key for the logo, e.g. "aws", "coursera". Falls back to issuer name. */
  icon: string;
  date: string;
  credentialId: string;
  link: string;
}

export type Platform =
  | "linkedin" | "github" | "medium" | "x" | "discord" | "instagram" | "youtube"
  | "dribbble" | "behance" | "devto" | "hashnode" | "substack" | "stackoverflow"
  | "leetcode" | "hackerrank" | "kaggle" | "threads" | "bluesky" | "mastodon"
  | "telegram" | "whatsapp" | "reddit" | "twitch" | "facebook" | "producthunt"
  | "geeksforgeeks" | "codechef" | "website" | "blog" | "other";

export interface Social {
  platform: Platform;
  /** Full URL or bare username (expanded with the platform's base URL). */
  url: string;
  handle: string;
  description: string;
  metric: string;
}

export interface Contact {
  email: string;
  phone: string;
  discord: string;
  address: string;
  note: string;
  /** Show the message form. */
  form: boolean;
}

export interface Portfolio {
  version: 3;
  /** True while the content is the original sample. Shows an owner-only banner. */
  sample?: boolean;
  theme: Theme;
  profile: Profile;
  stats: Stat[];
  sections: SectionConfig[];
  about: string;
  skills: SkillGroup[];
  learning: string[];
  interests: string[];
  projects: Project[];
  experience: Experience[];
  testimonials: Testimonial[];
  achievements: Achievement[];
  certifications: Certification[];
  socials: Social[];
  contact: Contact;
}

/** One brand icon from design-source/icons.json. */
export interface BrandIcon {
  /** Hex colour without # */
  h: string;
  /** SVG path data */
  p: string;
  /** viewBox, defaults to "0 0 24 24" */
  v?: string;
}
export type IconMap = Record<string, BrandIcon>;

/** Contact form message (stored by the API route). */
export interface ContactMessage {
  name: string;
  email: string;
  topic: string;
  text: string;
  createdAt: string;
}

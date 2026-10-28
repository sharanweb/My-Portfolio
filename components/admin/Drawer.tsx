"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Portfolio, SectionId } from "@/types/portfolio";
import { normalize, SECTION_NAMES } from "@/lib/model";
import { ACCENTS } from "@/lib/accent";
import { plain } from "@/lib/rich";
import { Icon } from "../Icon";
import { useShell } from "../context";
import { useOpenState } from "../useOpenState";
import { Field, Fields, type EditorApi } from "./fields";
import { LISTS } from "./lists";

export interface Message { id: string; name: string; email: string; topic: string; text: string; createdAt: string }

export const TABS: [string, string][] = [['profile', 'Profile'], ['layout', 'Sections'], ['appearance', 'Appearance'], ['about', 'About & skills'], ['projects', 'Projects'], ['experience', 'Experience'], ['testimonials', 'Testimonials'], ['achievements', 'Achievements'], ['certifications', 'Certifications'], ['socials', 'Socials'], ['contact', 'Contact'], ['messages', 'Messages'], ['json', 'JSON']];

export interface DrawerProps {
  open: boolean;
  tab: string;
  setTab: (t: string) => void;
  draft: Portfolio;
  api: EditorApi;
  /** Bumped when the draft changes shape (add, remove, move, discard, JSON), to refresh list text fields. */
  rev: number;
  addItem: (kind: string) => void;
  removeItem: (kind: string, i: number) => void;
  moveItem: (kind: string, i: number, dir: number) => void;
  applyJson: (d: Portfolio) => void;
  dirty: boolean;
  status: string;
  publishing: boolean;
  onPublish: () => void;
  onDiscard: () => void;
  onClose: () => void;
  onSignOut: () => void;
  messages: Message[] | null;
  deleteMessage: (id: string) => void;
}

function ListEditor({ kind, p }: { kind: string; p: DrawerProps }) {
  const cfg = LISTS[kind];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arr: any[] = (p.draft as any)[kind] || [];
  return <>
    {arr.map((item, i) => (
      <div className="ed-item" key={i}><div className="ed-item-head"><b>{plain(cfg.title(item)) || 'Untitled'}</b>
        <button className="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Move up" disabled={i === 0} onClick={() => p.moveItem(kind, i, -1)}><Icon name="up" /></button>
        <button className="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Move down" disabled={i === arr.length - 1} onClick={() => p.moveItem(kind, i, 1)}><Icon name="chev" /></button>
        <button className="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Remove" onClick={() => p.removeItem(kind, i)}><Icon name="trash" /></button></div>
        <Fields base={kind + '.' + i} list={cfg.f} api={p.api} />
      </div>
    ))}
    <button className="btn btn-secondary btn-sm" type="button" style={{ alignSelf: 'flex-start' }} onClick={() => p.addItem(kind)}><Icon name="plus" />{cfg.add}</button>
  </>;
}

function SectionToggle({ id, p }: { id: SectionId; p: DrawerProps }) {
  const i = p.draft.sections.map((s) => s.id).indexOf(id);
  return i < 0 ? null : <Field path={'sections.' + i + '.show'} f={{ k: 'show', l: 'Show this section', t: 'bool' }} api={p.api} />;
}

const Hint = ({ children }: { children: ReactNode }) => <span className="hint" style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>{children}</span>;

function JsonTab({ p }: { p: DrawerProps }) {
  const { copy, toast } = useShell();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [note, setNote] = useState('');
  const apply = () => {
    try {
      const parsed = JSON.parse(ref.current?.value || '');
      if (!parsed || typeof parsed !== 'object' || !parsed.profile) throw new Error('The JSON needs at least a "profile" section.');
      p.applyJson(normalize(parsed)); setNote(''); toast('JSON applied. Review, then publish.');
    } catch (err) { setNote('Could not apply: ' + (err as Error).message); }
  };
  return <>
    <div className="note-box">Everything on the page comes from this JSON. Paste an edited version, choose Apply, then Publish.</div>
    <div className="field"><label htmlFor="ed-json">Portfolio data</label><textarea className="textarea json-area" id="ed-json" spellCheck={false} ref={ref} defaultValue={JSON.stringify(p.draft, null, 2)} /><span className="hint" id="json-note" style={note ? { color: 'var(--danger)' } : undefined}>{note}</span></div>
    <div className="cta-row"><button className="btn btn-secondary btn-sm" type="button" onClick={apply}><Icon name="check" />Apply JSON</button><button className="btn btn-ghost btn-sm" type="button" onClick={() => copy(JSON.stringify(p.draft, null, 2), 'JSON')}><Icon name="copy" />Copy JSON</button></div>
  </>;
}

function TabBody({ p }: { p: DrawerProps }) {
  const d = p.draft, api = p.api;
  switch (p.tab) {
    case 'profile':
      return <>
        <div className="ed-title">Identity</div>
        <Fields base="profile" api={api} list={[{ k: 'avatar', l: 'Profile photo', t: 'upload' }, { k: 'name', l: 'Full name', half: true }, { k: 'initials', l: 'Initials', half: true, hint: 'Shown when there is no photo' }, { k: 'role', l: 'Role', half: true }, { k: 'company', l: 'Company', half: true }]} />
        <div className="ed-title">Hero</div>
        <Fields base="profile" api={api} list={[{ k: 'headline', l: 'Headline', hint: 'Wrap words in *asterisks* to style them as the accent' }, { k: 'rotatePrefix', l: 'Rotating line, prefix', half: true }, { k: 'rotating', l: 'Rotating words', t: 'comma', half: true, hint: 'Separate with commas' }, { k: 'bio', l: 'Short bio', t: 'area', rows: 3 },
          { k: 'available', l: 'Show availability badge', t: 'bool' }, { k: 'availabilityText', l: 'Availability text' }, { k: 'ctaPrimary', l: 'Primary button label', half: true }, { k: 'ctaSecondary', l: 'Secondary button label', half: true }, { k: 'resume', l: 'Resume link', ph: 'https://drive.google.com/…', hint: 'Adds a Resume button' }]} />
        <div className="ed-title">Profile card</div>
        <Fields base="profile" api={api} list={[{ k: 'location', l: 'Location', half: true }, { k: 'yearsLabel', l: 'Experience label', half: true }, { k: 'timezone', l: 'Time zone', half: true, hint: 'e.g. Asia/Kolkata' }, { k: 'tzLabel', l: 'Time zone label', half: true }, { k: 'focus', l: 'Focus' }]} />
        <div className="ed-title">Stats</div>
        <ListEditor kind="stats" p={p} />
        <div className="ed-title">Footer</div>
        <Fields base="profile" api={api} list={[{ k: 'footer', l: 'Footer line' }]} />
      </>;
    case 'layout':
      return <>
        <div className="note-box">Turn sections on or off, rename them, and change their order. Wrap words in *asterisks* in a title to style them as the accent.</div>
        {d.sections.map((s, i) => (
          <div key={s.id} className={'ed-item' + (s.show === false ? ' off' : '')}><div className="ed-item-head"><b>{SECTION_NAMES[s.id]}</b>
            <button className="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Move up" disabled={i === 0} onClick={() => p.moveItem('sections', i, -1)}><Icon name="up" /></button>
            <button className="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Move down" disabled={i === d.sections.length - 1} onClick={() => p.moveItem('sections', i, 1)}><Icon name="chev" /></button></div>
            <Field path={'sections.' + i + '.show'} f={{ k: 'show', l: 'Show on page', t: 'bool' }} api={api} />
            {s.id === 'stack' ? <Hint>A scrolling strip of every skill and project technology, shown under the hero.</Hint>
              : <Fields base={'sections.' + i} api={api} list={[{ k: 'nav', l: 'Menu label', half: true, hint: 'Leave empty to hide from the menu' }, { k: 'eyebrow', l: 'Small label', half: true }, { k: 'title', l: 'Title' }, { k: 'subtitle', l: 'Subtitle', t: 'area', rows: 2 }]} />}
          </div>
        ))}
      </>;
    case 'appearance': {
      const cur = (d.theme.accent || '').toLowerCase();
      return <>
        <div className="ed-title">Accent color</div>
        <div className="swatches">
          {ACCENTS.map((a) => <button key={a[1]} className="swatch" type="button" style={{ '--c': a[1] } as CSSProperties} aria-pressed={cur === a[1]} aria-label={a[0]} data-tip={a[0]} onClick={() => api.set('theme.accent', a[1])}></button>)}
          <input type="color" className="color-in" id="ed-theme-accent" value={/^#[0-9a-f]{6}$/i.test(cur) ? cur : '#2b59e8'} aria-label="Custom color" title="Custom color" onChange={(e) => api.set('theme.accent', e.target.value)} />
        </div>
        <div className="ed-title">Background</div>
        <div className="seg wide" role="group" aria-label="Background style">{[['aurora', 'Aurora'], ['mesh', 'Mesh'], ['minimal', 'Minimal']].map((o) => <button key={o[0]} type="button" aria-pressed={d.theme.background === o[0]} onClick={() => api.set('theme.background', o[0])}>{o[1]}</button>)}</div>
        <Fields base="theme" api={api} list={[{ k: 'animate', l: 'Animate the aurora', t: 'bool' }, { k: 'grain', l: 'Film grain texture', t: 'bool' }, { k: 'serifAccent', l: 'Italic serif accent on highlighted words', t: 'bool' }]} />
        <div className="ed-title">Default theme for visitors</div>
        <div className="seg wide" role="group" aria-label="Default theme">{[['auto', 'Match their system'], ['light', 'Light'], ['dark', 'Dark']].map((o) => <button key={o[0]} type="button" aria-pressed={d.theme.defaultMode === o[0]} onClick={() => api.set('theme.defaultMode', o[0])}>{o[1]}</button>)}</div>
        <Hint>Visitors can still switch themes from the top bar.</Hint>
      </>;
    }
    case 'about':
      return <>
        <Fields base="" api={api} list={[{ k: 'about', l: 'About text', t: 'area', rows: 7, hint: 'Leave a blank line between paragraphs. The first paragraph is shown larger.' }]} />
        <div className="ed-title">Skill groups</div>
        <ListEditor kind="skills" p={p} />
        <Fields base="" api={api} list={[{ k: 'learning', l: 'Currently learning', t: 'icons' }, { k: 'interests', l: 'Interests outside coding', t: 'comma' }]} />
        <div className="ed-title">Tech strip</div>
        <SectionToggle id="stack" p={p} />
      </>;
    case 'projects': case 'experience': case 'testimonials': case 'achievements': case 'certifications': case 'socials':
      return <>
        <SectionToggle id={(p.tab === 'projects' ? 'work' : p.tab) as SectionId} p={p} />
        <ListEditor kind={p.tab} p={p} />
        {p.tab === 'socials' ? <div className="note-box">Profiles without a link are hidden from visitors. Paste a full link, or just your username for LinkedIn, GitHub, Medium, X and most others.</div> : null}
      </>;
    case 'contact':
      return <>
        <SectionToggle id="contact" p={p} />
        <Fields base="contact" api={api} list={[{ k: 'email', l: 'Email', half: true }, { k: 'phone', l: 'Phone', half: true, ph: '+91 …' }, { k: 'discord', l: 'Discord username', half: true }, { k: 'address', l: 'Address', half: true, hint: 'Opens in Google Maps' }, { k: 'note', l: 'Reply note' }, { k: 'form', l: 'Show the message form', t: 'bool' }]} />
        <Hint>Empty channels are hidden from visitors. Form messages are saved here and, when email is set up, sent to you.</Hint>
      </>;
    case 'messages':
      if (!p.messages) return <div className="note-box">Loading messages…</div>;
      if (!p.messages.length) return <div className="empty-state" style={{ padding: '2rem' }}><Icon name="inbox" /><p>No messages yet. When someone uses the contact form, it shows up here.</p></div>;
      return <>{p.messages.map((m) => (
        <div className="msg" key={m.id}><div className="msg-head"><b>{m.name || 'Someone'}</b><span>{new Date(m.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span></div><span className="from">{m.email}</span>
          <p><span style={{ color: 'var(--text-3)', fontSize: '.75rem' }}>{m.topic}</span><br />{m.text}</p>
          <div className="cta-row"><button className="btn btn-ghost btn-sm" type="button" onClick={() => p.deleteMessage(m.id)}><Icon name="trash" />Delete</button></div>
        </div>
      ))}</>;
    case 'json':
      return <JsonTab p={p} />;
  }
  return null;
}

export function Drawer(p: DrawerProps) {
  const st = useOpenState(p.open, 450);
  const body = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  useEffect(() => { if (st.open) (tabs.current?.querySelector('.dr-tab[aria-selected="true"]') as HTMLElement | null)?.focus({ preventScroll: true }); }, [st.open]);
  useEffect(() => {
    if (body.current) body.current.scrollTop = 0;
    tabs.current?.querySelector('.dr-tab[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [p.tab]);
  const count = p.messages?.length || 0;
  return (
    <aside className={'drawer' + (st.open ? ' open' : '')} id="drawer" role="dialog" aria-modal="true" aria-labelledby="dr-title" hidden={st.hidden}>
      <div className="dr-head"><span className="mark"><Icon name="pencil" /></span><div className="grow"><h2 id="dr-title">Edit portfolio</h2><p>Changes preview live behind this panel.</p></div>
        <button className="btn btn-ghost btn-sm" type="button" onClick={p.onSignOut}>Sign out</button>
        <button className="btn btn-ghost btn-icon" type="button" aria-label="Close editor" onClick={p.onClose}><Icon name="x" /></button></div>
      <div className="dr-tabs" role="tablist" ref={tabs}>{TABS.map((t) => <button key={t[0]} className="dr-tab" role="tab" type="button" aria-selected={p.tab === t[0]} onClick={() => p.setTab(t[0])}>{t[1]}{t[0] === 'messages' && count ? <span className="n">{count}</span> : null}</button>)}</div>
      <div className="dr-body" ref={body}><TabBody key={p.tab + ':' + p.rev} p={p} /></div>
      <div className="dr-foot"><span className={'grow' + (p.dirty ? ' dirty' : '')} id="dr-status">{p.status}</span>
        <button className="btn btn-ghost btn-sm" type="button" disabled={!p.dirty || p.publishing} onClick={p.onDiscard}>Discard</button>
        <button className="btn btn-accent btn-sm" type="button" disabled={!p.dirty || p.publishing} onClick={p.onPublish}>{p.publishing ? 'Publishing…' : 'Publish changes'}</button></div>
    </aside>
  );
}

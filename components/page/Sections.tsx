import type { CSSProperties, ReactNode } from "react";
import type { SectionId, Testimonial } from "@/types/portfolio";
import { allTech, initials, liveSocials, navItems, statusClass } from "@/lib/model";
import { liUrl, safeUrl, socialHandle, socialUrl } from "@/lib/urls";
import { brandStyle, PlatformIcon, platformInfo, techIcon, Ti } from "@/lib/ti";
import { Icon } from "../Icon";
import { Cover } from "../Cover";
import { SectionHead, EmptyOwner } from "./SectionHead";
import { StackIcons } from "./StackIcons";
import { ContactForm, Highlights, QuoteText } from "./islands";
import type { RenderCtx } from "./types";

export function StackStrip({ c }: { c: RenderCtx }) {
  const all = allTech(c.d); if (!all.length) return null;
  const items = (k: string) => all.map((t, i) => <span className="tech" key={k + i}><Ti name={t} icons={c.icons} />{t}</span>);
  return <div className="stack-strip" id="stack" aria-label="Technologies"><div className="marquee"><div className="marquee-track">{items('a')}<span aria-hidden="true" style={{ display: 'contents' }}>{items('b')}</span></div></div></div>;
}

export function About({ c }: { c: RenderCtx }) {
  const { d, icons } = c;
  const paras = String(d.about || '').split(/\n\s*\n/).filter(Boolean);
  const n = d.skills.length, span = n === 1 ? 6 : n === 2 ? 3 : n === 4 ? 3 : 2;
  const L = d.learning.length, I = d.interests.length, cls = (L && I) ? 'b-half' : 'b-full';
  return (
    <section className="block" id="about"><div className="container"><SectionHead c={c} id="about" />
      <div className="bento">
        {paras.length ? <div className="card spot b-about"><span className="card-label"><Icon name="user" />Who I am</span><div className="about-text">{paras.map((t, i) => <p key={i}>{t}</p>)}</div></div> : null}
        <div className={'card spot b-loc' + (paras.length ? '' : ' b-full')}><span className="card-label"><Icon name="pin" />{d.profile.location || 'Local time'}</span>
          <div className="clock"><span data-clock="short">--:--</span><small>{d.profile.tzLabel || ''}</small></div>
          <div className="daybar" title="Working hours highlighted"><span id="daydot" style={{ left: '50%' }}></span></div>
          <div className="loc-meta"><span data-clock="date">{' '}</span><span id="work-status">{' '}</span></div>
        </div>
        {d.skills.map((g, gi) => (
          <div key={gi} className={'card spot b-skill' + ((n % 2 === 1 && gi === n - 1) ? ' odd-last' : '')} style={{ '--span': span } as CSSProperties}>
            <div className="skill-title"><h3>{g.group}</h3><span className="count">{(g.items || []).length}</span></div>
            <div className="tools">{(g.items || []).map((s, i) => <span key={i} className="tool" style={brandStyle(techIcon(s, icons).color)}><Ti name={s} icons={icons} /><span>{s}</span></span>)}</div>
          </div>
        ))}
        {L ? <div className={'card spot ' + cls}><div className="learn-row"><h3><Icon name="spark" />Currently learning</h3><div className="pills">{d.learning.map((s, i) => <span key={i} className="pill">{techIcon(s, icons).found ? <Ti name={s} icons={icons} /> : null}{s}</span>)}</div></div></div> : null}
        {I ? <div className={'card spot ' + cls}><div className="learn-row alt"><h3><Icon name="heart" />Outside of code</h3><div className="pills">{d.interests.map((s, i) => <span key={i} className="pill">{s}</span>)}</div></div></div> : null}
      </div>
    </div></section>
  );
}

export function Projects({ c }: { c: RenderCtx }) {
  const d = c.d;
  return (
    <section className="block" id="work"><div className="container"><SectionHead c={c} id="work" />
      <div className="projects">{d.projects.length ? d.projects.map((p, i) => (
        <button key={i} className="card proj spot" type="button" data-open-project={i}><Cover p={p} />
          <div className="proj-body"><div className="proj-top"><h3>{p.title}</h3>{p.status ? <span className={'status ' + statusClass(p.status)}>{p.status}</span> : null}</div>
            <p>{p.summary}</p>
            <div className="proj-foot"><StackIcons tags={p.tags} icons={c.icons} /><span className="proj-year">{p.year || ''}</span></div></div>
        </button>
      )) : <EmptyOwner c={c} tab="projects" label="Add a project" />}</div>
    </div></section>
  );
}

export function Experience({ c }: { c: RenderCtx }) {
  const jobs = c.d.experience;
  return (
    <section className="block" id="experience"><div className="container"><SectionHead c={c} id="experience" />
      {jobs.length ? <div className="timeline">{jobs.map((j, i) => {
        const current = /present|now|current/i.test(j.end || '');
        const pts = j.points || [];
        return (
          <div key={i} className={'job' + (current ? ' current' : '')}>
            <div className="job-when"><b>{j.start}{j.end ? ' – ' + j.end : ''}</b><span>{j.type || ''}</span></div>
            <div className="job-rail"><span className="job-dot"></span></div>
            <div className="card spot job-card"><div className="job-head"><div><h3>{j.role}</h3><div className="co">{j.company}{j.location ? <><span aria-hidden="true">·</span>{j.location}</> : null}</div></div>{current ? <span className="status live">Current</span> : null}</div>
              {j.summary ? <p>{j.summary}</p> : null}
              {pts.length ? <Highlights points={pts} initialOpen={i === 0} /> : null}
            </div>
          </div>
        );
      })}</div> : <EmptyOwner c={c} tab="experience" label="Add experience" />}
    </div></section>
  );
}

const QMARK = <svg className="qmark" viewBox="0 0 32 24" aria-hidden="true"><path d="M0 24V14.4C0 6.4 4.8 1.6 12.8 0l1.6 3.2C9.6 4.8 7.2 8 7.2 12h6.4v12H0zm17.6 0V14.4C17.6 6.4 22.4 1.6 30.4 0L32 3.2c-4.8 1.6-7.2 4.8-7.2 8.8h6.4v12H17.6z" /></svg>;

function QuoteCard({ c, t, featured }: { c: RenderCtx; t: Testimonial; featured: boolean }) {
  const long = String(t.quote || '').length > (featured ? 520 : 300);
  const av = safeUrl(t.avatar), li = liUrl(t.linkedin);
  const who = [t.title, t.company].filter(Boolean).join(' · ');
  return (
    <figure className={'card spot quote-card' + (featured ? ' featured' : '')}>
      {QMARK}
      <QuoteText quote={t.quote || ''} long={long} />
      <figcaption><span className="q-av">{av ? <img src={av} alt="" /> : initials(t.name)}</span>
        <span className="q-who"><b>{t.name}</b>{who ? <span>{who}</span> : null}{(t.relation || t.date) ? <small>{[t.relation, t.date].filter(Boolean).join(' · ')}</small> : null}</span>
        {li ? <a className="soc-btn q-li" style={brandStyle('#0A66C2')} href={li} target="_blank" rel="noopener" aria-label={t.name + ' on LinkedIn'} data-tip="View on LinkedIn">{techIcon('linkedin', c.icons).node}</a> : null}
      </figcaption>
    </figure>
  );
}

export function Testimonials({ c }: { c: RenderCtx }) {
  const d = c.d;
  const list = d.testimonials.map((t, i) => ({ t, i }));
  const feat = list.filter((o) => o.t.featured)[0] || (list.length >= 3 ? list[0] : null);
  const rest = list.filter((o) => o !== feat);
  const mine = (d.socials || []).filter((s) => s.platform === 'linkedin' && socialUrl(s))[0];
  const allLink = mine && /linkedin\.com\/in\//i.test(socialUrl(mine)) ? socialUrl(mine).replace(/\/+$/, '') + '/details/recommendations/' : '';
  const right = allLink ? <a className="btn btn-secondary btn-sm" href={allLink} target="_blank" rel="noopener"><Ti name="linkedin" icons={c.icons} />All recommendations <Icon name="arrow" cls="arrow" /></a> : null;
  let body: ReactNode = null;
  if (!list.length) {
    body = c.isEditor ? (
      <div className="quote-ghost"><figure className="card quote-card">{QMARK}<blockquote>Their recommendation appears here, with their name, role, company and a LinkedIn button visitors can click.</blockquote><figcaption><span className="q-av">AB</span><span className="q-who"><b>Person{'’'}s name</b><span>Role · Company</span><small>Only you can see this preview</small></span><span className="soc-btn q-li" style={brandStyle('#0A66C2')}>{techIcon('linkedin', c.icons).node}</span></figcaption></figure>
        <div className="empty-state"><Icon name="plus" /><span>Paste feedback from clients, managers or teammates.</span><button className="btn btn-secondary btn-sm" type="button" data-edit-tab="testimonials">Add a testimonial</button></div></div>
    ) : null;
  } else {
    body = <>
      {feat ? <QuoteCard c={c} t={feat.t} featured /> : null}
      {rest.length ? <div className={'quotes' + (rest.length < 3 ? ' few' : '')} style={{ '--n': rest.length } as CSSProperties}>{rest.map((o) => <QuoteCard key={o.i} c={c} t={o.t} featured={false} />)}</div> : null}
    </>;
  }
  return <section className="block" id="testimonials"><div className="container"><SectionHead c={c} id="testimonials" right={right} />{body}</div></section>;
}

const MEDAL_ICONS: Record<string, string> = { gold: 'trophy', silver: 'medal', bronze: 'medal', accent: 'star' };

export function Achievements({ c }: { c: RenderCtx }) {
  const d = c.d;
  return (
    <section className="block" id="achievements"><div className="container"><SectionHead c={c} id="achievements" />
      <div className="awards">{d.achievements.length ? d.achievements.map((a, i) => {
        const m = a.medal || 'accent', link = safeUrl(a.link);
        return (
          <div key={i} className="card spot award"><div className="award-top"><span className={'medal ' + m}><Icon name={MEDAL_ICONS[m] || 'award'} /></span>{a.badge ? <span className="award-badge">{a.badge}</span> : null}</div>
            <div><h3>{a.title}</h3><div className="meta">{a.org ? <span>{a.org}</span> : null}{a.org && a.date ? <span aria-hidden="true">·</span> : null}{a.date ? <span>{a.date}</span> : null}</div></div>
            {a.description ? <p>{a.description}</p> : null}
            {link ? <a className="text-link" href={link} target="_blank" rel="noopener">View details <Icon name="arrow" /></a> : null}
          </div>
        );
      }) : <EmptyOwner c={c} tab="achievements" label="Add an achievement" />}</div>
    </div></section>
  );
}

export function Certifications({ c }: { c: RenderCtx }) {
  const d = c.d;
  return (
    <section className="block" id="certifications"><div className="container"><SectionHead c={c} id="certifications" />
      <div className="certs">{d.certifications.length ? d.certifications.map((cert, i) => {
        const link = safeUrl(cert.link), found = techIcon(cert.icon || cert.issuer, c.icons).found;
        return (
          <div key={i} className="card spot cert"><span className="cert-logo">{found ? <Ti name={cert.icon || cert.issuer} icons={c.icons} /> : <span className="ti" style={{ color: 'var(--accent)' }}><Icon name="badge" /></span>}</span>
            <div className="cert-info"><h3>{cert.name}</h3><span className="issuer">{cert.issuer}</span><div className="meta">{cert.date ? <span>Issued {cert.date}</span> : null}
              {cert.credentialId ? <button type="button" data-copy={cert.credentialId} data-copy-label="Credential ID" title="Copy credential ID">ID {cert.credentialId} <Icon name="copy" /></button> : null}{link ? <span className="verified"><Icon name="badge" />Verifiable</span> : null}</div></div>
            {link ? <a className="btn btn-secondary btn-sm cert-act" href={link} target="_blank" rel="noopener">Verify <Icon name="arrow" cls="arrow" /></a> : <span className="cert-act"></span>}
          </div>
        );
      }) : <EmptyOwner c={c} tab="certifications" label="Add a certification" />}</div>
    </div></section>
  );
}

export function Socials({ c }: { c: RenderCtx }) {
  const { d, icons } = c;
  const list = c.isEditor ? d.socials : liveSocials(d);
  return (
    <section className="block" id="socials"><div className="container"><SectionHead c={c} id="socials" />
      <div className="socials">{list.length ? list.map((s, i) => {
        const info = platformInfo(s, icons), url = socialUrl(s), handle = socialHandle(s), empty = !url && !(s.platform === 'discord' && (s.handle || s.url));
        const style = brandStyle(info.color);
        const inner = <>
          <div className="social-top"><span className={'social-ico ti' + (info.mono ? ' mono' : '')}><PlatformIcon info={info} icons={icons} /></span><span className="go">{url ? <Icon name="arrow" /> : <Icon name="copy" />}</span></div>
          <div><h3>{info.name}</h3><div className="handle">{empty ? 'Add your link in Edit' : (handle || url)}</div></div>
          {s.description ? <p>{s.description}</p> : null}
          {s.metric ? <div className="metric"><Icon name="users" /><b>{s.metric}</b></div> : null}
        </>;
        if (empty) return <button key={i} className="card social placeholder" type="button" data-edit-tab="socials" style={style}>{inner}</button>;
        if (url) return <a key={i} className="card spot social" href={url} target="_blank" rel="noopener" style={style}>{inner}</a>;
        return <button key={i} className="card spot social" type="button" data-copy={s.handle || s.url} data-copy-label={info.name + ' username'} style={style}>{inner}</button>;
      }) : <EmptyOwner c={c} tab="socials" label="Add a profile" />}</div>
    </div></section>
  );
}

function Channel({ c, kind, icon, label, value, wide }: { c: RenderCtx; kind: string; icon: string; label: string; value: string; wide: boolean }) {
  if (!value && !c.isEditor) return null;
  const href = kind === 'address' && value ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(value) : '';
  return (
    <div className={'card spot channel' + (wide ? ' wide' : '')}><div className="ch-top"><span className="ch-ico">{icon.charAt(0) === '@' ? <Ti name={icon.slice(1)} icons={c.icons} /> : <Icon name={icon} />}</span>
      <div className="ch-actions">{value ? <>
        <button className="btn btn-ghost btn-icon btn-sm" type="button" data-copy={value} data-copy-label={label} aria-label={'Copy ' + label} data-tip="Copy"><Icon name="copy" /></button>
        {href ? <a className="btn btn-ghost btn-icon btn-sm" href={href} target="_blank" rel="noopener" aria-label="Open in maps" data-tip="Open map"><Icon name="arrow" /></a> : null}
      </> : null}</div></div>
      <div><div className="ch-label">{label}</div><div className={'ch-value' + (value ? '' : ' placeholder')}>{value ? value : 'Add in Edit › Contact'}</div></div>
    </div>
  );
}

export function Contact({ c }: { c: RenderCtx }) {
  const ct = c.d.contact;
  const items = ([['email', 'mail', 'Email', ct.email], ['phone', 'phone', 'Phone', ct.phone], ['discord', '@discord', 'Discord', ct.discord], ['address', 'pin', 'Address', ct.address]] as [string, string, string, string][])
    .filter((x) => x[3] || c.isEditor);
  const hasForm = ct.form !== false;
  return (
    <section className="block" id="contact"><div className="container"><SectionHead c={c} id="contact" />
      <div className="contact-grid" style={hasForm ? undefined : { gridTemplateColumns: 'minmax(0,1fr)' }}>
        <div className="channels">{items.map((x, i) => <Channel key={x[0]} c={c} kind={x[0]} icon={x[1]} label={x[2]} value={x[3]} wide={i === 0 || (items.length % 2 === 0 && i === items.length - 1)} />)}</div>
        {hasForm ? <ContactForm note={ct.note} /> : null}
      </div>
    </div></section>
  );
}

export function Footer({ c }: { c: RenderCtx }) {
  const d = c.d;
  return (
    <footer className="footer"><div className="container footer-inner"><span>© {new Date().getFullYear()} {d.profile.name}{d.profile.footer ? '. ' + d.profile.footer : ''}</span>
      <div className="footer-links">{navItems(d, c.isEditor).slice(0, 5).map((s) => <a key={s.id} href={'#' + s.id}>{s.nav}</a>)}<a href="#top">Back to top ↑</a></div></div></footer>
  );
}

export const RENDER: Record<SectionId, (p: { c: RenderCtx }) => ReactNode> = {
  stack: StackStrip, about: About, work: Projects, experience: Experience, testimonials: Testimonials,
  achievements: Achievements, certifications: Certifications, socials: Socials, contact: Contact,
};

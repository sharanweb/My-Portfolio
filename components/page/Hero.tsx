import { initials, liveSocials, shown, statusClass } from "@/lib/model";
import { rich } from "@/lib/rich";
import { safeUrl, socialUrl } from "@/lib/urls";
import { brandStyle, PlatformIcon, platformInfo, techIcon } from "@/lib/ti";
import { Icon } from "../Icon";
import { StackIcons } from "./StackIcons";
import type { RenderCtx } from "./types";

export function Hero({ c }: { c: RenderCtx }) {
  const { d, icons } = c;
  const p = d.profile;
  const rot = (p.rotating || []).filter(Boolean);
  const workTarget = shown(d, 'work') && d.projects.length ? '#work' : '#contact';
  const resume = safeUrl(p.resume);
  const wipIdx = (d.projects || []).findIndex((x) => statusClass(x.status) === 'wip');
  const wip = wipIdx > -1 ? d.projects[wipIdx] : null;
  const avatarUrl = safeUrl(p.avatar);
  const core: string[] = [];
  (d.skills || []).forEach((g) => (g.items || []).forEach((t) => { if (core.indexOf(t) < 0 && techIcon(t, icons).found) core.push(t); }));

  const socials = liveSocials(d).slice(0, 6).map((s, i) => {
    const info = platformInfo(s, icons), url = socialUrl(s);
    const cls = 'soc-btn' + (info.mono ? ' mono' : '');
    if (!url) return <button key={i} className={cls} style={brandStyle(info.color)} type="button" data-copy={s.handle || s.url} data-copy-label={info.name + ' username'} data-tip={info.name} aria-label={'Copy ' + info.name + ' username'}><PlatformIcon info={info} icons={icons} /></button>;
    return <a key={i} className={cls} style={brandStyle(info.color)} href={url} target="_blank" rel="noopener" data-tip={info.name} aria-label={info.name}><PlatformIcon info={info} icons={icons} /></a>;
  });
  if (d.contact.email) socials.push(<button key="email" className="soc-btn mono" type="button" data-copy={d.contact.email} data-copy-label="Email" data-tip="Copy email" aria-label="Copy email"><Icon name="mail" /></button>);

  return (
    <section className="hero" id="top"><div className="container hero-grid">
      <div className="hero-copy">
        {p.available && p.availabilityText ? <span className="chip"><span className="pulse"></span>{p.availabilityText}</span> : null}
        <h1>{rich(p.headline || p.name, c.serif)}</h1>
        {rot.length ? <p className="rotator">{p.rotatePrefix ? <span>{p.rotatePrefix}</span> : null}<span className="rot" aria-live="polite"><span id="rot-word">{rot[0]}</span></span></p> : null}
        {p.bio ? <p className="lede">{p.bio}</p> : null}
        <div className="cta-row">
          <a className="btn btn-primary" href={workTarget}>{p.ctaPrimary || 'View my work'} <Icon name="right" cls="arrow" /></a>
          {shown(d, 'contact') ? <a className="btn btn-secondary" href="#contact">{p.ctaSecondary || 'Get in touch'}</a> : null}
          {resume ? <a className="btn btn-ghost" href={resume} target="_blank" rel="noopener"><Icon name="file" />Resume</a> : null}
        </div>
        {(d.stats || []).length ? <div className="stats">{d.stats.map((s, i) => <div className="stat" key={i}><b>{s.value}</b><span>{s.label}</span></div>)}</div> : null}
      </div>
      <div className="card-stage"><aside className="profile-card" id="pcard" aria-label="Profile"><span className="glare"></span>
        <div className="pc-banner"><canvas id="banner" aria-hidden="true"></canvas></div>
        <div className="pc-body">
          <div className="pc-id">
            <div className="avatar">{avatarUrl ? <img src={avatarUrl} alt={p.name} /> : (p.initials || initials(p.name))}</div>
            <div className="pc-name"><h3>{p.name}</h3><span>{p.role}{p.company ? ' at ' + p.company : ''}</span></div>
            {core.length ? <div className="pc-core"><span className="pc-label">Core stack</span><StackIcons tags={core} icons={icons} max={8} /></div> : null}
            {socials.length ? <div className="pc-social">{socials}</div> : null}
          </div>
          <div className="pc-meta">
            <dl className="pc-rows">
              {p.location ? <div className="pc-row"><dt><Icon name="pin" />Location</dt><dd>{p.location}</dd></div> : null}
              <div className="pc-row"><dt><Icon name="clock" />Local time</dt><dd><span data-clock="short">--:--</span> {p.tzLabel || ''}</dd></div>
              {p.yearsLabel ? <div className="pc-row"><dt><Icon name="brief" />Experience</dt><dd>{p.yearsLabel}</dd></div> : null}
              {p.focus ? <div className="pc-row"><dt><Icon name="target" />Focus</dt><dd>{p.focus}</dd></div> : null}
            </dl>
            {wip ? <button className="now-card" type="button" data-open-project={wipIdx}><span className="lbl">Now</span><span>Building <b>{wip.title}</b></span></button> : null}
            {p.available && p.availabilityText ? <div className="pc-avail"><span className="pulse"></span><span>{p.availabilityText}</span>{shown(d, 'contact') ? <a className="text-link" href="#contact">Contact <Icon name="arrow" /></a> : null}</div> : null}
          </div>
        </div>
      </aside></div>
    </div></section>
  );
}

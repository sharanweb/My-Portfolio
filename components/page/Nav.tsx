import { initials, navItems } from "@/lib/model";
import { Icon } from "../Icon";
import type { RenderCtx } from "./types";

const THEMES: [string, string, string, string][] = [['light', 'Light theme', 'Light', 'sun'], ['auto', 'Match system', 'Auto', 'monitor'], ['dark', 'Dark theme', 'Dark', 'moon']];

/** Static markup; the Shell adds .scrolled, the active link and the pressed theme button. */
export function Nav({ c, unread }: { c: RenderCtx; unread: number }) {
  const d = c.d;
  return (
    <header className="nav" id="nav"><div className="container nav-inner">
      <a className="brand" href="#top" aria-label="Back to top"><span className="mark">{d.profile.initials || initials(d.profile.name)}</span><span>{d.profile.name}</span></a>
      <nav className="nav-links" aria-label="Sections">
        {navItems(d, c.isEditor).slice(0, 7).map((s) => <a key={s.id} href={'#' + s.id} data-sec={s.id}>{s.nav}</a>)}
      </nav>
      <div className="nav-right">
        <button className="kbd-btn" type="button" data-act="palette" aria-label="Open quick actions"><Icon name="search" /><span className="kbd-label">Search</span><kbd>⌘K</kbd></button>
        <div className="seg" role="group" aria-label="Theme">
          {THEMES.map(([t, label, title, icon]) => <button key={t} type="button" data-theme-set={t} aria-label={label} title={title}><Icon name={icon} /></button>)}
        </div>
        {c.isEditor ? <button className="btn btn-secondary btn-sm edit-btn" type="button" data-act="edit"><Icon name="pencil" /><span className="edit-label">Edit</span>{unread ? <span className="badge-dot">{unread}</span> : null}</button> : null}
      </div>
    </div></header>
  );
}

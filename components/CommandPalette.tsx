"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { liveSocials, navItems } from "@/lib/model";
import { safeUrl, socialUrl } from "@/lib/urls";
import { reduced } from "@/lib/dom";
import { Icon } from "./Icon";
import { PlatformIcon, platformInfo, Ti } from "@/lib/ti";
import { useIcons, useShell } from "./context";
import { useOpenState } from "./useOpenState";

interface Action { g: string; label: string; icon: ReactNode; run?: () => void; href?: string }

function go(id: string) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }); }

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const api = useShell();
  const icons = useIcons();
  const st = useOpenState(open, 200);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) { setQ(''); setSel(0); } }, [open]);
  useEffect(() => { if (st.open) input.current?.focus(); }, [st.open]);

  const d = api.data, c = d.contact;
  const all: Action[] = [];
  all.push({ g: 'Navigate', label: 'Top', icon: <Icon name="up" />, run: () => go('top') });
  navItems(d, api.isEditor).forEach((s) => all.push({ g: 'Navigate', label: s.nav, icon: <Icon name="hash" />, run: () => go(s.id) }));
  d.projects.forEach((p, i) => all.push({ g: 'Projects', label: p.title, icon: <Icon name="code" />, run: () => api.openProject(i) }));
  if (c.email) all.push({ g: 'Contact', label: 'Copy email address', icon: <Icon name="mail" />, run: () => api.copy(c.email, 'Email') });
  if (c.discord) all.push({ g: 'Contact', label: 'Copy Discord username', icon: <Ti name="discord" icons={icons} />, run: () => api.copy(c.discord, 'Discord username') });
  liveSocials(d).forEach((s) => { const info = platformInfo(s, icons), url = socialUrl(s); if (url) all.push({ g: 'Social', label: 'Open ' + info.name, icon: <span className="ti"><PlatformIcon info={info} icons={icons} /></span>, href: url }); });
  if (safeUrl(d.profile.resume)) all.push({ g: 'Contact', label: 'Open resume', icon: <Icon name="file" />, href: safeUrl(d.profile.resume) });
  all.push({ g: 'Theme', label: 'Light theme', icon: <Icon name="sun" />, run: () => api.setTheme('light') });
  all.push({ g: 'Theme', label: 'Dark theme', icon: <Icon name="moon" />, run: () => api.setTheme('dark') });
  all.push({ g: 'Theme', label: 'Match system theme', icon: <Icon name="monitor" />, run: () => api.setTheme('auto') });
  if (api.isEditor) {
    all.push({ g: 'Owner', label: 'Edit portfolio', icon: <Icon name="pencil" />, run: () => api.edit() });
    all.push({ g: 'Owner', label: 'Change colors and background', icon: <Icon name="palette" />, run: () => api.edit('appearance') });
    all.push({ g: 'Owner', label: 'Reorder or hide sections', icon: <Icon name="layout" />, run: () => api.edit('layout') });
    all.push({ g: 'Owner', label: 'View messages', icon: <Icon name="inbox" />, run: () => api.edit('messages') });
  }
  const ql = q.trim().toLowerCase();
  const items = all.filter((a) => !ql || a.label.toLowerCase().indexOf(ql) > -1 || a.g.toLowerCase().indexOf(ql) > -1);
  const cur = Math.min(sel, Math.max(0, items.length - 1));

  useEffect(() => { list.current?.querySelector('.pal-item.sel')?.scrollIntoView({ block: 'nearest' }); }, [cur, q]);

  const run = (i: number) => { const a = items[i]; if (!a) return; onClose(); if (a.run) setTimeout(a.run, 60); };

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(Math.min(items.length - 1, cur + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel(Math.max(0, cur - 1)); }
    if (e.key === 'Enter') { e.preventDefault(); const a = items[cur]; if (a && a.href) (list.current?.querySelector('.pal-item.sel') as HTMLElement | null)?.click(); else run(cur); }
  }

  let g = '';
  const rows: ReactNode[] = [];
  items.forEach((a, i) => {
    if (a.g !== g) { g = a.g; rows.push(<div className="pal-group" key={'g' + g}>{g}</div>); }
    const inner = <>{a.icon}<span>{a.label}</span></>;
    const cls = 'pal-item' + (i === cur ? ' sel' : '');
    rows.push(a.href
      ? <a key={i} className={cls} data-pal={i} href={a.href} target="_blank" rel="noopener" role="option" aria-selected={i === cur} onClick={() => run(i)}>{inner}</a>
      : <button key={i} className={cls} type="button" data-pal={i} role="option" aria-selected={i === cur} onClick={() => run(i)}>{inner}</button>);
  });

  return (
    <div className={'palette' + (st.open ? ' open' : '')} id="palette" role="dialog" aria-modal="true" aria-label="Quick actions" hidden={st.hidden}>
      <div className="pal-input"><Icon name="search" /><input id="pal-q" ref={input} placeholder="Search sections, projects, links…" autoComplete="off" aria-label="Search actions" value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey} /><kbd>esc</kbd></div>
      <div className="pal-list" id="pal-list" role="listbox" ref={list}>{rows.length ? rows : <div className="pal-empty">No matching actions</div>}</div>
    </div>
  );
}

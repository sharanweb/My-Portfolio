"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { IconMap, Portfolio } from "@/types/portfolio";
import { accentInfo } from "@/lib/accent";
import { onThemeChange, reduced, THEME_EVENT } from "@/lib/dom";
import { Icon } from "./Icon";
import { Background } from "./Background";
import { ProjectModal } from "./ProjectModal";
import { CommandPalette } from "./CommandPalette";
import { IconsContext, ShellContext, type ShellApi, type ThemePref } from "./context";
import { useOpenState } from "./useOpenState";

function store(k: string, v?: string | null): string | null {
  try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* storage blocked */ }
  return null;
}

function tickClock(tz: string) {
  const now = new Date(); let short: string, date: string, hour = 12, min = 0;
  try {
    short = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(now);
    date = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz }).format(now);
    const parts = short.split(':'); hour = +parts[0]; min = +parts[1];
  } catch { short = now.toTimeString().slice(0, 5); date = now.toDateString(); }
  document.querySelectorAll('[data-clock="short"]').forEach((el) => { el.textContent = short; });
  document.querySelectorAll('[data-clock="date"]').forEach((el) => { el.textContent = date; });
  const dot = document.getElementById('daydot'); if (dot) dot.style.left = (((hour * 60 + min) / 1440) * 100).toFixed(2) + '%';
  const ws = document.getElementById('work-status');
  if (ws) ws.textContent = (hour >= 9 && hour < 18) ? 'Working hours now, expect a quick reply' : 'Outside working hours, I will reply soon';
}

function paintBanner() {
  const cv = document.getElementById('banner') as HTMLCanvasElement | null; if (!cv) return;
  const r = cv.getBoundingClientRect(); if (!r.width) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = r.width * dpr; cv.height = r.height * dpr;
  const ctx = cv.getContext('2d'); if (!ctx) return;
  ctx.scale(dpr, dpr);
  const cs = getComputedStyle(document.documentElement);
  const a = cs.getPropertyValue('--accent').trim() || '#2b59e8', b = cs.getPropertyValue('--accent-2').trim() || '#6b5cf0';
  const g = ctx.createLinearGradient(0, 0, r.width, r.height); g.addColorStop(0, b); g.addColorStop(1, a);
  ctx.fillStyle = g; ctx.fillRect(0, 0, r.width, r.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1;
  for (let k = 0; k < 16; k++) {
    ctx.beginPath();
    for (let x = 0; x <= r.width; x += 6) {
      const y = r.height * 0.1 + k * 8 + Math.sin(x / 38 + k * 0.6) * 8 + Math.cos(x / 91 + k) * 6;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

export interface ShellProps {
  data: Portfolio;
  icons: IconMap;
  /** The rendered #page (server-rendered on the public site). */
  children: ReactNode;
  isEditor?: boolean;
  /** Owner only: open the editor drawer, optionally on a tab. */
  onEdit?: (tab?: string) => void;
  drawer?: ReactNode;
  drawerOpen?: boolean;
  onCloseDrawer?: () => void;
  /** Lets the owner editor show toasts. */
  toastRef?: React.MutableRefObject<((msg: string) => void) | null>;
}

/**
 * Client behaviour for the page, ported from the reference's event handlers: theme, accent, clock, rotator,
 * banner, nav state, spotlight and tilt, copy buttons, project modal, command palette and keyboard shortcuts.
 * The page markup itself is passed in as children so it can stay a Server Component.
 */
export function Shell({ data: d, icons, children, isEditor = false, onEdit, drawer, drawerOpen = false, onCloseDrawer, toastRef }: ShellProps) {
  const [projIdx, setProjIdx] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [palOpen, setPalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; show: boolean }>({ text: '', show: false });
  const lastFocus = useRef<HTMLElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ---- theme ----
  const applyTheme = useCallback((t: ThemePref, save?: boolean) => {
    if (save) store('pf-theme', t);
    const root = document.documentElement;
    if (t === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t);
    document.querySelectorAll<HTMLElement>('.seg [data-theme-set]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeSet === t)));
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);
  const defaultMode = d.theme.defaultMode || 'auto';
  useEffect(() => { applyTheme((store('pf-theme') as ThemePref) || defaultMode); });

  // ---- accent + body attributes (set on the server too; this keeps the owner preview live) ----
  useEffect(() => {
    const root = document.documentElement.style;
    Object.entries(accentInfo(d.theme.accent).vars).forEach(([k, v]) => root.setProperty(k, v));
    document.body.setAttribute('data-bg', d.theme.background || 'aurora');
    document.body.setAttribute('data-grain', d.theme.grain === false ? 'off' : 'on');
    window.dispatchEvent(new Event(THEME_EVENT));
  }, [d.theme.accent, d.theme.background, d.theme.grain]);

  // ---- clock: ticks every 15s, and after each render so re-rendered nodes never show --:-- for long ----
  const tz = d.profile.timezone || 'Asia/Kolkata';
  useEffect(() => { tickClock(tz); });
  useEffect(() => { const t = setInterval(() => tickClock(tz), 15000); return () => clearInterval(t); }, [tz]);

  // ---- banner ----
  useEffect(() => { paintBanner(); });
  useEffect(() => {
    let rz: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => { clearTimeout(rz); rz = setTimeout(paintBanner, 120); };
    window.addEventListener('resize', onResize);
    const off = onThemeChange(paintBanner);
    return () => { window.removeEventListener('resize', onResize); off(); clearTimeout(rz); };
  }, []);

  // ---- rotator ----
  const words = (d.profile.rotating || []).filter(Boolean);
  const wordsKey = words.join('\u0000');
  useEffect(() => {
    const list = wordsKey ? wordsKey.split('\u0000') : [];
    if (list.length < 2) return;
    let idx = 0, swap: ReturnType<typeof setTimeout> | undefined;
    const timer = setInterval(() => {
      const el = document.getElementById('rot-word'); if (!el) return;
      if (reduced()) { idx = (idx + 1) % list.length; el.textContent = list[idx]; return; }
      el.classList.add('out');
      swap = setTimeout(() => {
        idx = (idx + 1) % list.length; el.textContent = list[idx];
        el.classList.remove('out'); el.classList.add('in'); void el.offsetWidth; el.classList.remove('in');
      }, 420);
    }, 2800);
    return () => { clearInterval(timer); clearTimeout(swap); const el = document.getElementById('rot-word'); if (el) { el.textContent = list[0]; el.classList.remove('out', 'in'); } };
  }, [wordsKey]);

  // ---- nav: .scrolled and the active section link ----
  useEffect(() => {
    const onScroll = () => document.getElementById('nav')?.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const sectionIds = d.sections.map((s) => s.id).join(',');
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) document.querySelectorAll<HTMLElement>('.nav-links a').forEach((a) => a.classList.toggle('active', a.dataset.sec === e.target.id)); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sectionIds.split(',').forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  });

  // ---- toast & copy ----
  const toast = useCallback((msg: string) => {
    setToastMsg({ text: msg, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg((m) => ({ ...m, show: false })), 2200);
  }, []);
  useEffect(() => { if (toastRef) toastRef.current = toast; }, [toast, toastRef]);
  const copy = useCallback((text: string, label?: string) => {
    const fallback = () => {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch { /* unsupported */ }
      document.body.removeChild(ta); toast(ok ? (label || 'Text') + ' copied' : 'Select and copy: ' + text);
    };
    try { navigator.clipboard.writeText(text).then(() => toast((label || 'Text') + ' copied'), fallback); } catch { fallback(); }
  }, [toast]);

  // ---- overlays ----
  const openProject = useCallback((i: number) => { lastFocus.current = document.activeElement as HTMLElement; setProjIdx(i); setModalOpen(true); }, []);
  const closeModal = useCallback(() => { setModalOpen((o) => { if (o) lastFocus.current?.focus(); return false; }); }, []);
  const openPalette = useCallback(() => { lastFocus.current = document.activeElement as HTMLElement; setPalOpen(true); }, []);
  const closePalette = useCallback(() => setPalOpen(false), []);
  const edit = useCallback((tab?: string) => { if (isEditor && onEdit) onEdit(tab); }, [isEditor, onEdit]);
  const overlay = useOpenState(modalOpen || palOpen || drawerOpen, 300);

  // ---- delegated clicks (data-* attributes in the server-rendered markup) ----
  const handlers = useRef({ applyTheme, copy, edit, openProject, openPalette });
  handlers.current = { applyTheme, copy, edit, openProject, openPalette };
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = (e.target as Element)?.closest?.('button, a') as HTMLElement | null; if (!t) return;
      const ds = t.dataset, h = handlers.current;
      if (ds.themeSet) h.applyTheme(ds.themeSet as ThemePref, true);
      else if (ds.copy) h.copy(ds.copy, ds.copyLabel);
      else if (ds.editTab) h.edit(ds.editTab);
      else if (ds.openProject != null) h.openProject(+ds.openProject);
      else if (ds.act === 'palette') h.openPalette();
      else if (ds.act === 'edit') h.edit();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // ---- keyboard ----
  const openState = useRef({ palOpen, modalOpen, drawerOpen });
  openState.current = { palOpen, modalOpen, drawerOpen };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key, s = openState.current;
      if ((e.metaKey || e.ctrlKey) && k.toLowerCase() === 'k') { e.preventDefault(); if (s.palOpen) closePalette(); else openPalette(); return; }
      if (k === 'Escape') { if (s.palOpen) closePalette(); else if (s.modalOpen) closeModal(); else if (s.drawerOpen) onCloseDrawer?.(); return; }
      if (s.palOpen) return;
      const tag = (e.target as HTMLElement)?.tagName || '';
      if (k === '/' && !s.modalOpen && !s.drawerOpen && !/input|textarea|select/i.test(tag)) { e.preventDefault(); openPalette(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openPalette, closePalette, closeModal, onCloseDrawer]);

  // ---- spotlight + tilt ----
  useEffect(() => {
    let fine = true; try { fine = matchMedia('(pointer: fine)').matches; } catch { /* default */ }
    const move = (e: PointerEvent) => {
      const target = e.target as Element | null; if (!target?.closest) return;
      const c = target.closest('.spot') as HTMLElement | null;
      if (c) { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
      const pc = target.closest('#pcard') as HTMLElement | null;
      if (pc && fine && !reduced()) {
        const b = pc.getBoundingClientRect(), px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
        pc.classList.add('tilting');
        pc.style.setProperty('--ry', ((px - 0.5) * 8).toFixed(2) + 'deg'); pc.style.setProperty('--rx', ((0.5 - py) * 8).toFixed(2) + 'deg');
        pc.style.setProperty('--gx', (px * 100) + '%'); pc.style.setProperty('--gy', (py * 100) + '%');
      }
    };
    const out = (e: PointerEvent) => {
      const target = e.target as Element | null; if (!target?.closest) return;
      const pc = target.closest('#pcard') as HTMLElement | null;
      if (pc && !pc.contains(e.relatedTarget as Node | null)) { pc.classList.remove('tilting'); pc.style.setProperty('--rx', '0deg'); pc.style.setProperty('--ry', '0deg'); }
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerout', out);
    return () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerout', out); };
  }, []);

  const api: ShellApi = useMemo(() => ({
    data: d, isEditor, openProject, copy, toast, edit, setTheme: (t: ThemePref) => applyTheme(t, true),
  }), [d, isEditor, openProject, copy, toast, edit, applyTheme]);

  return (
    <IconsContext.Provider value={icons}>
      <ShellContext.Provider value={api}>
        <Background theme={d.theme} />
        <div id="app">
          {children}
          <div className={'overlay' + (overlay.open ? ' open' : '')} id="overlay" hidden={overlay.hidden} onClick={() => { closeModal(); closePalette(); onCloseDrawer?.(); }}></div>
          <ProjectModal project={projIdx != null ? d.projects[projIdx] || null : null} open={modalOpen} onClose={closeModal} />
          <CommandPalette open={palOpen} onClose={closePalette} />
          {drawer}
          <div className={'toast' + (toastMsg.show ? ' show' : '')} id="toast" role="status" aria-live="polite">{toastMsg.text ? <><Icon name="check" /><span>{toastMsg.text}</span></> : null}</div>
        </div>
      </ShellContext.Provider>
    </IconsContext.Provider>
  );
}

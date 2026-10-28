"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IconMap, Portfolio as Data } from "@/types/portfolio";
import { Shell } from "../Shell";
import { PageBody } from "../page/PageBody";
import { Drawer, type Message } from "./Drawer";
import { LISTS } from "./lists";
import type { EditorApi } from "./fields";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obj = any;
const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
function getPath(o: Obj, path: string) { return path.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o); }
function setPath(o: Obj, path: string, v: unknown) { const ks = path.split('.'); let x = o; for (let i = 0; i < ks.length - 1; i++) x = x[ks[i]]; x[ks[ks.length - 1]] = v; }

/** Owner view: the live page plus the editor drawer. Edits preview behind the drawer and save on Publish. */
export function AdminApp({ initial, icons }: { initial: Data; icons: IconMap }) {
  const [published, setPublished] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [view, setView] = useState(initial);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('profile');
  const [rev, setRev] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState('');
  const [messages, setMessages] = useState<Message[] | null>(null);
  const toastRef = useRef<((m: string) => void) | null>(null);
  const toast = (m: string) => toastRef.current?.(m);

  // live preview, debounced like the reference
  useEffect(() => { const t = setTimeout(() => setView(draft), 160); return () => clearTimeout(t); }, [draft]);

  const loadMessages = useCallback(async () => {
    try { const r = await fetch('/api/messages', { cache: 'no-store' }); if (r.ok) setMessages(await r.json()); } catch { /* offline */ }
  }, []);
  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { if (open && tab === 'messages') loadMessages(); }, [open, tab, loadMessages]);

  const change = (fn: (d: Obj) => void, structural = false) => {
    setDraft((d) => { const n = clone(d); fn(n); return n; });
    setDirty(true); setStatus('');
    if (structural) setRev((r) => r + 1);
  };

  const api: EditorApi = useMemo(() => ({
    get: (path) => getPath(draft, path),
    set: (path, v) => change((d) => setPath(d, path, v)),
    upload: async (path, file) => {
      setStatus('Uploading image…');
      const fd = new FormData(); fd.append('file', file);
      try {
        const r = await fetch('/api/upload', { method: 'POST', body: fd });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Upload failed.');
        change((d) => setPath(d, path, j.url)); toast('Image uploaded');
      } catch (e) { setStatus((e as Error).message); }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [draft]);

  const edit = useCallback((t?: string) => { if (t) setTab(t); setOpen(true); }, []);

  async function publish() {
    setPublishing(true); setStatus('');
    try {
      const r = await fetch('/api/content', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(draft) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(r.status === 401 ? 'Your session expired. Reload and sign in again.' : j.error || 'Could not publish. Try again in a moment.');
      const saved = clone(draft); delete saved.sample;
      setPublished(saved); setDraft(saved); setDirty(false); toast('Published');
    } catch (e) { setStatus((e as Error).message); }
    finally { setPublishing(false); }
  }

  function discard() { setDraft(clone(published)); setDirty(false); setStatus(''); setRev((r) => r + 1); toast('Changes discarded'); }

  async function signOut() { await fetch('/api/auth', { method: 'DELETE' }); location.reload(); }

  async function deleteMessage(id: string) {
    if (!confirm('Delete this message?')) return;
    const r = await fetch('/api/messages?id=' + encodeURIComponent(id), { method: 'DELETE' });
    if (r.ok) { setMessages((m) => (m || []).filter((x) => x.id !== id)); toast('Message deleted'); }
  }

  const drawer = <Drawer
    open={open} tab={tab} setTab={setTab} draft={draft} api={api} rev={rev}
    addItem={(k) => change((d) => { d[k] = d[k] || []; d[k].push(LISTS[k].tpl()); }, true)}
    removeItem={(k, i) => change((d) => { d[k].splice(i, 1); }, true)}
    moveItem={(k, i, dir) => change((d) => { const a = d[k], j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; }, true)}
    applyJson={(d) => { setDraft(d); setDirty(true); setRev((r) => r + 1); }}
    dirty={dirty} status={status || (dirty ? 'Unpublished changes' : 'All changes published')} publishing={publishing}
    onPublish={publish} onDiscard={discard} onClose={() => setOpen(false)} onSignOut={signOut}
    messages={messages} deleteMessage={deleteMessage}
  />;

  const c = { d: view, icons, isEditor: true, serif: view.theme.serifAccent !== false };
  return (
    <Shell data={view} icons={icons} isEditor onEdit={edit} drawer={drawer} drawerOpen={open} onCloseDrawer={() => setOpen(false)} toastRef={toastRef}>
      <PageBody c={c} unread={messages?.length || 0} />
    </Shell>
  );
}

"use client";
import { useState, type CSSProperties, type ReactNode } from "react";
import { safeUrl } from "@/lib/urls";
import { Icon } from "../Icon";
import { techIcon, Ti } from "@/lib/ti";
import { useIcons } from "../context";

export interface FieldSpec {
  k: string; l: string;
  t?: 'text' | 'area' | 'lines' | 'comma' | 'icons' | 'hue' | 'upload' | 'select' | 'bool';
  ph?: string; hint?: string; opts?: [string, string][]; half?: boolean; rows?: number;
}

export interface EditorApi {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: (path: string) => any;
  set: (path: string, value: unknown) => void;
  upload: (path: string, file: File) => void;
}

export const fid = (path: string) => 'ed-' + path.replace(/\./g, '-');

export function IconPreview({ list }: { list: string[] }) {
  const icons = useIcons();
  return <>{(list || []).map((s, i) => { const found = techIcon(s, icons).found; return <span key={i} className={'pill' + (found ? '' : ' miss')} title={found ? 'Icon found' : 'No icon found, a monogram is shown'}><Ti name={s} icons={icons} />{s}</span>; })}</>;
}

/** Text field that stores a list: commas or one item per line. Keeps the raw text while typing. */
function ListInput({ path, f, api }: { path: string; f: FieldSpec; api: EditorApi }) {
  const lines = f.t === 'lines';
  const v: string[] = api.get(path) || [];
  const [text, setText] = useState(v.join(lines ? '\n' : ', '));
  const parse = (s: string) => s.split(lines ? '\n' : ',').map((x) => x.trim()).filter(Boolean);
  const id = fid(path);
  const onChange = (s: string) => { setText(s); api.set(path, parse(s)); };
  if (lines) return <textarea className="textarea" id={id} rows={f.rows || 3} placeholder={f.ph || ''} style={{ minHeight: 'auto' }} value={text} onChange={(e) => onChange(e.target.value)} />;
  return <>
    <input className="input" id={id} value={text} placeholder={f.ph || ''} onChange={(e) => onChange(e.target.value)} />
    {f.t === 'icons' ? <div className="icon-prev" id={'prev-' + id}><IconPreview list={parse(text)} /></div> : null}
  </>;
}

export function Field({ path, f, api }: { path: string; f: FieldSpec; api: EditorApi }) {
  const v = api.get(path), id = fid(path), t = f.t || 'text';
  const hint = f.hint ? <span className="hint">{f.hint}</span> : null;
  if (t === 'bool') return <label className="switch"><input type="checkbox" id={id} checked={!!v && v !== false} onChange={(e) => api.set(path, e.target.checked)} />{f.l}</label>;
  if (t === 'upload') {
    const url = safeUrl(v);
    return <div className="field"><label>{f.l}</label><div className="upload-row"><span className="thumb">{url ? <img src={url} alt="" /> : 'None'}</span>
      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}><Icon name="upload" />Upload image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) api.upload(path, file); e.target.value = ''; }} /></label>
      {url ? <button className="btn btn-ghost btn-sm" type="button" onClick={() => api.set(path, '')}>Remove</button> : null}</div>{hint}</div>;
  }
  if (t === 'hue') {
    const h = +v || 0;
    return <div className="field"><label htmlFor={id}>{f.l}</label><div className="hue-row"><span className="hue-dot" id={'dot-' + id} style={{ '--h': h } as CSSProperties}></span><input type="range" min="0" max="360" id={id} value={h} onChange={(e) => api.set(path, Math.max(0, Math.min(360, +e.target.value || 0)))} /></div></div>;
  }
  let input: ReactNode;
  if (t === 'select') input = <select className="input" id={id} value={v ?? ''} onChange={(e) => api.set(path, e.target.value)}>{(f.opts || []).map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>;
  else if (t === 'lines' || t === 'comma' || t === 'icons') input = <ListInput path={path} f={f} api={api} />;
  else if (t === 'area') input = <textarea className="textarea" id={id} rows={f.rows || 3} placeholder={f.ph || ''} style={{ minHeight: 'auto' }} value={v ?? ''} onChange={(e) => api.set(path, e.target.value)} />;
  else input = <input className="input" id={id} value={v ?? ''} placeholder={f.ph || ''} onChange={(e) => api.set(path, e.target.value)} />;
  return <div className="field"><label htmlFor={id}>{f.l}</label>{input}{hint}</div>;
}

/** Renders a field list, pairing `half` fields into two-column rows. */
export function Fields({ base, list, api }: { base: string; list: FieldSpec[]; api: EditorApi }) {
  const out: ReactNode[] = [];
  let buf: ReactNode[] = [];
  const flush = () => { if (buf.length) { out.push(<div className="row-2" key={'r' + out.length}>{buf}{buf.length === 1 ? <div></div> : null}</div>); buf = []; } };
  list.forEach((f) => {
    const path = base ? base + '.' + f.k : f.k;
    const el = <Field key={path} path={path} f={f} api={api} />;
    if (f.half) { buf.push(el); if (buf.length === 2) flush(); } else { flush(); out.push(el); }
  });
  flush();
  return <>{out}</>;
}

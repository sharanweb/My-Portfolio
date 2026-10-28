import { Fragment, type ReactNode } from "react";

/** Renders *accent* words as the italic serif accent (or plain text when serifAccent is off). */
export function rich(s: string, serifAccent: boolean): ReactNode {
  const parts = String(s ?? '').split(/\*([^*]+)\*/g);
  return parts.map((p, i) => i % 2 === 0 ? <Fragment key={i}>{p}</Fragment> : serifAccent ? <em key={i} className="accent-word">{p}</em> : <Fragment key={i}>{p}</Fragment>);
}

export function plain(s: string) { return String(s || '').replace(/\*/g, ''); }

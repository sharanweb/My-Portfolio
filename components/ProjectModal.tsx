"use client";
import { useEffect, useRef } from "react";
import type { Project } from "@/types/portfolio";
import { statusClass } from "@/lib/model";
import { safeUrl } from "@/lib/urls";
import { Icon } from "./Icon";
import { Cover } from "./Cover";
import { Ti } from "@/lib/ti";
import { useIcons } from "./context";
import { useOpenState } from "./useOpenState";

export function ProjectModal({ project, open, onClose }: { project: Project | null; open: boolean; onClose: () => void }) {
  const st = useOpenState(open, 350);
  const icons = useIcons();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (st.open) closeRef.current?.focus(); }, [st.open]);
  const p = project;
  const link = p ? safeUrl(p.link) : '', repo = p ? safeUrl(p.repo) : '';
  return (
    <div className={'modal' + (st.open ? ' open' : '')} id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" hidden={st.hidden}>
      {p ? <>
        <button className="btn btn-icon modal-close" type="button" aria-label="Close" ref={closeRef} onClick={onClose}><Icon name="x" /></button>
        <Cover p={p} />
        <div className="modal-body"><div className="proj-top"><h2 id="modal-title">{p.title}</h2>{p.status ? <span className={'status ' + statusClass(p.status)}>{p.status}</span> : null}</div>
          <p>{p.details || p.summary}</p>
          <div className="modal-meta"><div><span>Role</span><b>{p.role || '—'}</b></div><div><span>Year</span><b>{p.year || '—'}</b></div></div>
          {(p.tags || []).length ? <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}><h4>Built with</h4><div className="pills">{p.tags.map((t, i) => <span key={i} className="pill"><Ti name={t} icons={icons} />{t}</span>)}</div></div> : null}
          {(p.highlights || []).length ? <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}><h4>Highlights</h4><ul className="bullets" style={{ margin: 0 }}>{p.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul></div> : null}
          {(link || repo) ? <div className="cta-row">
            {link ? <a className="btn btn-primary" href={link} target="_blank" rel="noopener">Visit project <Icon name="arrow" cls="arrow" /></a> : null}
            {repo ? <a className="btn btn-secondary" href={repo} target="_blank" rel="noopener"><Ti name="github" icons={icons} />Source code</a> : null}
          </div> : null}
        </div>
      </> : null}
    </div>
  );
}

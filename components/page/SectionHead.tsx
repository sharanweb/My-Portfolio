import type { ReactNode } from "react";
import type { SectionId } from "@/types/portfolio";
import { sec, TAB_FOR } from "@/lib/model";
import { rich } from "@/lib/rich";
import { Icon } from "../Icon";
import type { RenderCtx } from "./types";

export function SectionHead({ c, id, right }: { c: RenderCtx; id: SectionId; right?: ReactNode }) {
  const s = sec(c.d, id);
  return (
    <div className="sec-head">
      <div>
        {s.eyebrow ? <span className="eyebrow">{s.eyebrow}</span> : null}
        {s.title ? <h2>{rich(s.title, c.serif)}</h2> : null}
        {s.subtitle ? <p>{s.subtitle}</p> : null}
      </div>
      {right}
      {c.isEditor ? <button className="btn btn-secondary btn-sm sec-edit" type="button" data-edit-tab={TAB_FOR[id]}><Icon name="pencil" />Edit</button> : null}
    </div>
  );
}

export function EmptyOwner({ c, tab, label }: { c: RenderCtx; tab: string; label: string }) {
  if (!c.isEditor) return null;
  return <div className="empty-state"><Icon name="plus" /><span>Nothing here yet.</span><button className="btn btn-secondary btn-sm" type="button" data-edit-tab={tab}>{label}</button></div>;
}

import type { CSSProperties } from "react";
import type { Project } from "@/types/portfolio";
import { safeUrl } from "@/lib/urls";

export function Cover({ p }: { p: Project }) {
  const img = safeUrl(p.image), h = (+p.hue || 0) % 361;
  const style = { '--h': h } as CSSProperties;
  if (img) return <div className="cover" style={style}><img className="cover-img" src={img} alt="" /></div>;
  return (
    <div className="cover" style={style} aria-hidden="true"><div className="cover-mesh"></div><div className="window"><div className="win-bar"><i></i><i></i><i></i></div>
      <div className="win-body"><div className="win-side"><i></i><i style={{ width: '85%' }}></i><i style={{ width: '60%' }}></i><i style={{ width: '75%' }}></i></div>
        <div className="win-main"><div className="tiles"><b></b><b></b><b></b></div><i style={{ width: '90%' }}></i><i style={{ width: '70%' }}></i><i style={{ width: '80%' }}></i><i style={{ width: '45%' }}></i></div></div></div></div>
  );
}

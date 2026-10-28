import { hasContent, shown } from "@/lib/model";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Footer, RENDER } from "./Sections";
import type { RenderCtx } from "./types";

/** The whole page (#page). Renders as a Server Component on the public site and on the client in the owner preview. */
export function PageBody({ c, unread = 0 }: { c: RenderCtx; unread?: number }) {
  const d = c.d;
  return (
    <div id="page">
      {d.sample && c.isEditor ? <div className="sample-bar">This portfolio is showing sample content. <button type="button" data-act="edit">Replace it with your details</button></div> : null}
      <Nav c={c} unread={unread} />
      <main>
        <Hero c={c} />
        {d.sections.map((s) => {
          if (!shown(d, s.id) || !hasContent(d, s.id, c.isEditor)) return null;
          const Section = RENDER[s.id];
          return <Section key={s.id} c={c} />;
        })}
      </main>
      <Footer c={c} />
    </div>
  );
}

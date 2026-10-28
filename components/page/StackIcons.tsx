import type { IconMap } from "@/types/portfolio";
import { Ti } from "@/lib/ti";

export function StackIcons({ tags, icons, max = 6 }: { tags: string[]; icons: IconMap; max?: number }) {
  tags = tags || [];
  return (
    <div className="stack-icons">
      {tags.slice(0, max).map((t, i) => <span key={i} className="si-tile" data-tip={t} role="img" aria-label={t}><Ti name={t} icons={icons} /></span>)}
      {tags.length > max ? <span className="si-tile si-more" data-tip={tags.slice(max).join(', ')}>+{tags.length - max}</span> : null}
    </div>
  );
}

import { Shell } from "@/components/Shell";
import { PageBody } from "@/components/page/PageBody";
import { iconsFor, loadContent } from "@/lib/content";

export default async function Home() {
  const data = await loadContent();
  const icons = iconsFor(data);
  return (
    <Shell data={data} icons={icons}>
      <PageBody c={{ d: data, icons, isEditor: false, serif: data.theme.serifAccent !== false }} />
    </Shell>
  );
}

import type { IconMap, Portfolio } from "@/types/portfolio";

/** Everything a page section needs to render. Plain data, so sections work as Server or Client Components. */
export interface RenderCtx { d: Portfolio; icons: IconMap; isEditor: boolean; serif: boolean }

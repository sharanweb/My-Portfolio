import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { loadContent, saveContent } from "@/lib/content";
import { normalize } from "@/lib/model";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await loadContent());
}

/** Publish: replaces the portfolio content. Owner only. */
export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.profile) return NextResponse.json({ error: "The content needs at least a profile." }, { status: 400 });
  if (JSON.stringify(body).length > 1_000_000) return NextResponse.json({ error: "The content is too large." }, { status: 413 });
  try {
    await saveContent(normalize(body));
  } catch (e) {
    console.error("saveContent failed", e);
    return NextResponse.json({ error: "Could not save. Check the storage settings." }, { status: 500 });
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

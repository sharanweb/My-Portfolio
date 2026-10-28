import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { store } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json(await store().listMessages());
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  await store().deleteMessage(id);
  return NextResponse.json({ ok: true });
}

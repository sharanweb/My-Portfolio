import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { isAdmin } from "@/lib/auth";
import { store } from "@/lib/storage";

// SVG is excluded on purpose: it can carry scripts.
const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
const MAX = 4 * 1024 * 1024; // Vercel functions accept request bodies up to 4.5 MB

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Use a PNG, JPEG, WebP, GIF or AVIF image." }, { status: 415 });
  if (file.size > MAX) return NextResponse.json({ error: "The image is over 4 MB." }, { status: 413 });
  try {
    const url = await store().upload(`${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`, file.type, await file.arrayBuffer());
    return NextResponse.json({ url });
  } catch (e) {
    console.error("upload failed", e);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/storage";
import { loadContent } from "@/lib/content";
import { notifyOwner } from "@/lib/email";
import { clientIp, rateLimited } from "@/lib/ratelimit";

const Body = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().min(1).max(200),
  topic: z.string().trim().max(60).default(""),
  message: z.string().trim().min(1).max(4000),
  /** Honeypot: real visitors never fill this in. */
  website: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please fill in your name, how to reply, and a message." }, { status: 400 });
  const b = parsed.data;
  if (b.website) return NextResponse.json({ ok: true }); // bot: pretend it worked
  if (rateLimited("contact:" + clientIp(req), 5, 10 * 60_000)) return NextResponse.json({ error: "Too many messages." }, { status: 429 });
  const msg = { name: b.name, email: b.email, topic: b.topic, text: b.message, createdAt: new Date().toISOString() };
  try {
    await store().addMessage(msg);
  } catch (e) {
    console.error("addMessage failed", e);
    return NextResponse.json({ error: "Could not save the message." }, { status: 500 });
  }
  try { await notifyOwner(msg, (await loadContent()).contact.email); } catch (e) { console.error("notifyOwner failed", e); }
  return NextResponse.json({ ok: true });
}

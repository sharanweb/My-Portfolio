import { NextResponse } from "next/server";
import { checkPassword, COOKIE, passwordConfigured, sessionToken } from "@/lib/auth";
import { clientIp, rateLimited } from "@/lib/ratelimit";

/** Sign in: { password } → sets the httpOnly admin cookie. */
export async function POST(req: Request) {
  if (!passwordConfigured()) return NextResponse.json({ error: "ADMIN_PASSWORD is not set on the server." }, { status: 503 });
  if (rateLimited("login:" + clientIp(req), 8, 15 * 60_000)) return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.password !== "string" || !checkPassword(body.password)) return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  const t = sessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, t.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: t.maxAge });
  return res;
}

/** Sign out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

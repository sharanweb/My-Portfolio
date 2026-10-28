import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "pf_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";
  return createHash("sha256").update("pf-admin:" + s).digest();
}
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }
function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function passwordConfigured() { return !!process.env.ADMIN_PASSWORD; }

export function checkPassword(input: string) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const h = (s: string) => createHash("sha256").update(s).digest("hex");
  return same(h(input), h(pw));
}

/** Signed "expires.signature" token for the httpOnly session cookie. */
export function sessionToken() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return { value: exp + "." + sign(exp), maxAge: MAX_AGE };
}

export function validToken(token: string | undefined) {
  if (!token || !passwordConfigured()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !same(sig, sign(exp))) return false;
  return +exp > Date.now() / 1000;
}

export async function isAdmin() {
  return validToken((await cookies()).get(COOKIE)?.value);
}

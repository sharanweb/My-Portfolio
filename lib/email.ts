import "server-only";
import type { ContactMessage } from "@/types/portfolio";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Emails the owner through Resend. Does nothing when RESEND_API_KEY is not set. */
export async function notifyOwner(m: ContactMessage, fallbackTo: string) {
  const key = process.env.RESEND_API_KEY, to = process.env.CONTACT_TO_EMAIL || fallbackTo;
  if (!key || !to) return;
  const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email) ? m.email : undefined;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Portfolio <onboarding@resend.dev>",
      to: [to],
      reply_to: replyTo,
      subject: `New message: ${m.topic} from ${m.name}`.slice(0, 200),
      text: `${m.name} (${m.email})\nTopic: ${m.topic}\n\n${m.text}`,
      html: `<p><b>${esc(m.name)}</b> (${esc(m.email)})<br>Topic: ${esc(m.topic)}</p><p style="white-space:pre-wrap">${esc(m.text)}</p>`,
    }),
  });
  if (!res.ok) console.error("Resend failed", res.status, await res.text().catch(() => ""));
}

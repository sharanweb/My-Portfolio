"use client";
// Small interactive pieces hydrated inside otherwise server-rendered sections.
import { useState, type FormEvent } from "react";
import { Icon } from "../Icon";

/** Experience highlights with the "Show N highlights" toggle. */
export function Highlights({ points, initialOpen }: { points: string[]; initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  return <>
    {open ? <ul className="bullets">{points.map((t, k) => <li key={k}>{t}</li>)}</ul> : null}
    <button className="toggle-more" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Show less' : 'Show ' + points.length + ' highlights'}<Icon name="chev" /></button>
  </>;
}

/** Testimonial quote, clamped with Read more when long. */
export function QuoteText({ quote, long }: { quote: string; long: boolean }) {
  const [open, setOpen] = useState(false);
  return <>
    <blockquote className={long && !open ? 'clamp' : ''}>{quote}</blockquote>
    {long ? <button className="toggle-more" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Show less' : 'Read more'}<Icon name="chev" /></button> : null}
  </>;
}

export function ContactForm({ note }: { note: string }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ text: string; err: boolean } | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget, v = (n: string) => ((f.elements.namedItem(n) as HTMLInputElement | null)?.value || '').trim();
    const body = { name: v('name'), email: v('email'), topic: v('topic'), message: v('message'), website: v('website') };
    if (!body.name || !body.email || !body.message) { setMsg({ text: 'Please fill in your name, how to reply, and a message.', err: true }); return; }
    setSending(true);
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(r.status === 429 ? 'rate' : 'fail');
      setSent(true);
    } catch (err) {
      setMsg({ text: (err as Error).message === 'rate' ? 'Too many messages. Please try again in a few minutes.' : 'Your message could not be sent. Use one of the channels on the left instead.', err: true });
    } finally { setSending(false); }
  }
  if (sent) return <div className="card form-card"><div className="sent"><span className="ok-ico"><Icon name="check" /></span><h3>Message sent</h3><p style={{ color: 'var(--text-2)' }}>Thanks for reaching out. {note || ''}</p><button className="btn btn-secondary btn-sm" type="button" onClick={() => { setSent(false); setMsg(null); }}>Send another message</button></div></div>;
  return (
    <form className="card form-card" id="contact-form" noValidate onSubmit={submit}><h3>Send a message</h3><p>{note || 'I will get back to you soon.'}</p>
      <div className="row-2"><div className="field"><label htmlFor="cf-name">Name</label><input className="input" id="cf-name" name="name" autoComplete="name" placeholder="Your name" required /></div>
        <div className="field"><label htmlFor="cf-email">Email or Discord</label><input className="input" id="cf-email" name="email" autoComplete="email" placeholder="How can I reply?" required /></div></div>
      <div className="field"><label htmlFor="cf-topic">Topic</label><select className="input" id="cf-topic" name="topic"><option>Project inquiry</option><option>Job opportunity</option><option>Collaboration</option><option>Just saying hi</option></select></div>
      <div className="field"><label htmlFor="cf-msg">Message</label><textarea className="textarea" id="cf-msg" name="message" placeholder="Tell me a little about what you have in mind" required></textarea></div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, opacity: 0 }} />
      <div className="form-foot"><span className={'form-note' + (msg?.err ? ' err' : '')} id="cf-note">{msg ? msg.text : 'Your message goes straight to my inbox, or use the channels on the left.'}</span>
        <button className="btn btn-primary" type="submit" disabled={sending}><span>{sending ? 'Sending…' : 'Send message'}</span><Icon name="send" /></button></div>
    </form>
  );
}

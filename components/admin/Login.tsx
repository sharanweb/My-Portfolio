"use client";
import { useState, type FormEvent } from "react";
import { Icon } from "../Icon";

export function Login({ configured }: { configured: boolean }) {
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
    setBusy(true); setErr('');
    const r = await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
    if (r.ok) { location.reload(); return; }
    setErr((await r.json().catch(() => ({}))).error || 'Could not sign in.'); setBusy(false);
  }
  return (
    <div id="page"><main><section className="block"><div className="container" style={{ maxWidth: '28rem' }}>
      <form className="card form-card" onSubmit={submit}>
        <h3>Owner sign in</h3>
        <p>{configured ? 'Enter the admin password to edit the portfolio.' : 'Set ADMIN_PASSWORD in the server environment (or .env.local) to enable editing.'}</p>
        <div className="field"><label htmlFor="pw">Password</label><input className="input" id="pw" name="password" type="password" autoComplete="current-password" required autoFocus disabled={!configured} /></div>
        <div className="form-foot"><span className={'form-note' + (err ? ' err' : '')}>{err || ' '}</span>
          <button className="btn btn-primary" type="submit" disabled={busy || !configured}><span>{busy ? 'Signing in…' : 'Sign in'}</span><Icon name="right" /></button></div>
      </form>
    </div></section></main></div>
  );
}

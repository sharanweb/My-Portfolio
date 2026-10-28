"use client";
import { useEffect, useRef } from "react";
import type { Theme } from "@/types/portfolio";
import { accentInfo } from "@/lib/accent";
import { isDark, onThemeChange, reduced } from "@/lib/dom";

const BLOBS = [
  { x: 0.15, y: 0.1, r: 0.55, ax: 0.12, ay: 0.08, sx: 0.00011, sy: 0.00013, p: 0, dh: 0 },
  { x: 0.85, y: 0.15, r: 0.5, ax: 0.1, ay: 0.12, sx: 0.00009, sy: 0.00012, p: 1.7, dh: 38 },
  { x: 0.6, y: 0.75, r: 0.6, ax: 0.14, ay: 0.1, sx: 0.0001, sy: 0.00008, p: 3.1, dh: -42 },
  { x: 0.1, y: 0.85, r: 0.45, ax: 0.1, ay: 0.1, sx: 0.00012, sy: 0.0001, p: 4.4, dh: 160 },
  { x: 0.45, y: 0.35, r: 0.35, ax: 0.18, ay: 0.14, sx: 0.00014, sy: 0.00009, p: 2.2, dh: 18 },
];

/** Fixed aurora backdrop: a canvas drawn at 1/6 of the viewport, plus grid and grain layers. */
export function Background({ theme }: { theme: Theme }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { accent, background, animate } = theme;

  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const { hue: accentHue, sat: accentSat } = accentInfo(accent);
    const style = background || 'aurora';
    let W = 0, H = 0, running = false, last = 0, raf = 0;

    const size = () => { W = Math.max(2, Math.round(innerWidth / 6)); H = Math.max(2, Math.round(innerHeight / 6)); cv.width = W; cv.height = H; };
    const draw = (now: number) => {
      const dark = isDark();
      const t = (animate === false || reduced() || style !== 'aurora') ? 0 : now;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      const list = style === 'minimal' ? [BLOBS[0], BLOBS[1]] : BLOBS;
      const amp = style === 'minimal' ? 0.6 : 1;
      if (dark) ctx.globalCompositeOperation = 'lighter';
      list.forEach((b, i) => {
        const x = W * (b.x + Math.sin(t * b.sx + b.p) * b.ax), y = H * (b.y + Math.cos(t * b.sy + b.p) * b.ay);
        const r = Math.max(W, H) * b.r * (style === 'minimal' ? 0.8 : 1);
        const h = accentHue + b.dh, s = Math.min(95, accentSat + 10);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const a = (dark ? 0.32 : 0.42) * amp * (i === 4 ? 0.7 : 1);
        g.addColorStop(0, 'hsla(' + h + ',' + s + '%,' + (dark ? 50 : 72) + '%,' + a + ')');
        g.addColorStop(0.55, 'hsla(' + h + ',' + s + '%,' + (dark ? 40 : 78) + '%,' + a * 0.35 + ')');
        g.addColorStop(1, 'hsla(' + h + ',' + s + '%,' + (dark ? 30 : 85) + '%,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      });
    };
    const loop = (now: number) => {
      if (!running) return;
      if (now - last > 50) { last = now; draw(now); }
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      const anim = animate !== false && !reduced() && style === 'aurora' && !document.hidden;
      if (anim && !running) { running = true; raf = requestAnimationFrame(loop); }
      if (!anim) { running = false; draw(0); }
    };
    const redraw = () => { if (!running) draw(performance.now()); };
    let rz: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => { clearTimeout(rz); rz = setTimeout(() => { size(); if (!running) draw(0); }, 120); };
    const onVis = () => { if (document.hidden) running = false; else start(); };

    size(); start();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);
    const off = onThemeChange(redraw);
    return () => { running = false; cancelAnimationFrame(raf); clearTimeout(rz); window.removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', onVis); off(); };
  }, [accent, background, animate]);

  return <div className="bg" aria-hidden="true"><canvas id="bg-canvas" ref={ref}></canvas><div className="bg-grid"></div><div className="bg-grain"></div></div>;
}

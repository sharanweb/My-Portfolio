export function reduced() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } }

export function isDark() {
  const a = document.documentElement.getAttribute('data-theme');
  if (a === 'dark') return true; if (a === 'light') return false;
  try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; }
}

/** Fired on window whenever the effective theme or accent may have changed. */
export const THEME_EVENT = 'pf-theme-change';

/** Subscribe to theme changes from the toggle and from the OS. */
export function onThemeChange(fn: () => void) {
  window.addEventListener(THEME_EVENT, fn);
  let mq: MediaQueryList | null = null;
  try { mq = matchMedia('(prefers-color-scheme: dark)'); mq.addEventListener('change', fn); } catch { /* old browsers */ }
  return () => { window.removeEventListener(THEME_EVENT, fn); mq?.removeEventListener('change', fn); };
}

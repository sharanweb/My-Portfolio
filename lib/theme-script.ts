/** Inline <head> script: applies the saved theme before first paint so there is no flash. */
export function themeScript(defaultMode: string) {
  return `(function(){try{var t=localStorage.getItem('pf-theme')||${JSON.stringify(defaultMode || 'auto')};if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
}

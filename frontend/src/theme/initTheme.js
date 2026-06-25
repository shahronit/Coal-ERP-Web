/** Sync theme mode + gradient CSS variables before React paint */
export function initThemeGradient() {
  const mode = localStorage.getItem('tradecrm_theme') || 'light';
  const root = document.documentElement;
  root.setAttribute('data-theme', mode);
  root.style.colorScheme = mode;
}

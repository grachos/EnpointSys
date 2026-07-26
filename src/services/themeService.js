/**
 * Utility service to apply and manage Dark, Light, and System themes.
 */

export function applyTheme(themeMode) {
  const root = document.documentElement;

  if (themeMode === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else if (themeMode === 'dark') {
    root.classList.remove('light');
    root.classList.add('dark');
  } else {
    // System Theme
    const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isSystemDark) {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }
}

export function listenSystemThemeChange(callback) {
  if (!window.matchMedia) return () => {};
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = (e) => callback(e.matches ? 'dark' : 'light');
  mediaQuery.addEventListener('change', listener);
  return () => mediaQuery.removeEventListener('change', listener);
}

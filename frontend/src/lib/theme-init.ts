/**
 * Theme initialization utility to prevent flash of incorrect theme
 */

export function initThemeSync() {
  // Get stored theme preference
  const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
  
  // Determine system preference
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  
  // Resolve final theme
  const resolvedTheme = storedTheme === 'system' || !storedTheme ? systemTheme : storedTheme;
  
  // Apply theme immediately to prevent flash
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);
  
  // Set data attribute for CSS targeting
  root.setAttribute('data-theme', resolvedTheme);
}
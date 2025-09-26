import { useState, useEffect, useRef, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeToggleHook {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggle: () => void;
  isLoading: boolean;
}

// Performance-optimized theme utilities
const THEME_STORAGE_KEY = 'theme-preference';
const THEME_CLASS = 'dark';
const THEME_ATTRIBUTE = 'data-theme';

// Cache DOM elements for performance
let rootElement: HTMLElement | null = null;
let mediaQuery: MediaQueryList | null = null;

// Get cached root element
const getRootElement = (): HTMLElement => {
  if (!rootElement) {
    rootElement = document.documentElement;
  }
  return rootElement;
};

// Get system theme preference with caching
const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light';

  if (!mediaQuery) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }

  return mediaQuery.matches ? 'dark' : 'light';
};

// Resolve theme mode to actual theme
const resolveTheme = (theme: ThemeMode, systemTheme: ResolvedTheme): ResolvedTheme => {
  return theme === 'system' ? systemTheme : (theme as ResolvedTheme);
};

// Optimized DOM manipulation - synchronous and minimal
const applyThemeToDOM = (resolvedTheme: ResolvedTheme): void => {
  const root = getRootElement();

  // Optimize for performance during theme switch
  const cleanup = optimizeThemeSwitch();

  try {
    // Batch DOM operations for better performance
    if (resolvedTheme === 'dark') {
      if (!root.classList.contains(THEME_CLASS)) {
        root.classList.add(THEME_CLASS);
      }
    } else {
      if (root.classList.contains(THEME_CLASS)) {
        root.classList.remove(THEME_CLASS);
      }
    }

    // Update data attribute for CSS usage
    root.setAttribute(THEME_ATTRIBUTE, resolvedTheme);
  } finally {
    // Re-enable transitions
    cleanup();
  }
};

// Initialize theme without flicker
const initializeTheme = (): { theme: ThemeMode; resolvedTheme: ResolvedTheme } => {
  // Get stored preference
  let storedTheme: ThemeMode = 'system';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      storedTheme = stored as ThemeMode;
    }
  } catch (error) {
    console.warn('Failed to read theme preference from localStorage:', error);
  }

  // Get system preference
  const systemTheme = getSystemTheme();
  const resolvedTheme = resolveTheme(storedTheme, systemTheme);

  // Apply theme immediately to prevent flicker
  applyThemeToDOM(resolvedTheme);

  return { theme: storedTheme, resolvedTheme };
};

// Persist theme preference
const persistTheme = (theme: ThemeMode): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Failed to persist theme preference:', error);
  }
};

// Optimize theme switch to prevent visual artifacts
const optimizeThemeSwitch = () => {
  const root = getRootElement();

  // Disable transitions during theme change to prevent visual artifacts
  const style = document.createElement('style');
  style.innerHTML = `
    *, *::before, *::after {
      transition: none !important;
    }
  `;
  document.head.appendChild(style);

  // Return cleanup function
  return () => {
    // Force a reflow to ensure the style is applied
    root.offsetHeight;

    // Remove the style tag to re-enable transitions
    document.head.removeChild(style);
  };
};

// Setup performance monitoring for development
const setupThemePerformanceMonitoring = (toggleFn: () => void) => {
  if (process.env.NODE_ENV !== 'development') return;

  // Expose performance measurement function globally for debugging
  (window as any).__measureThemeToggle = () => {
    const start = performance.now();
    toggleFn();
    const end = performance.now();
    const duration = end - start;

    console.log(`Theme toggle took ${duration.toFixed(2)}ms`);

    if (duration > 16) {
      console.warn(`Theme toggle exceeded 16ms target: ${duration.toFixed(2)}ms`);
    }

    return duration;
  };
};

/**
 * Optimized theme toggle hook with sub-16ms performance
 * 
 * Features:
 * - Synchronous DOM manipulation for instant visual feedback
 * - Minimal re-renders using refs and callbacks
 * - Cached DOM elements and media queries
 * - Batched DOM operations
 * - System preference detection with change listeners
 * - localStorage persistence with error handling
 */
export const useThemeToggle = (): ThemeToggleHook => {
  // Use refs to avoid unnecessary re-renders
  const themeRef = useRef<ThemeMode>('system');
  const resolvedThemeRef = useRef<ResolvedTheme>('light');
  const systemThemeRef = useRef<ResolvedTheme>('light');

  // Only use state for values that need to trigger re-renders
  const [isLoading, setIsLoading] = useState(true);
  const [, forceUpdate] = useState({});

  // Force component re-render when needed
  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    const { theme, resolvedTheme } = initializeTheme();
    const systemTheme = getSystemTheme();

    themeRef.current = theme;
    resolvedThemeRef.current = resolvedTheme;
    systemThemeRef.current = systemTheme;

    setIsLoading(false);
    triggerUpdate();

    // Set up performance monitoring in development
    if (process.env.NODE_ENV === 'development') {
      setupThemePerformanceMonitoring(() => {
        const currentTheme = themeRef.current;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        const newResolvedTheme = resolveTheme(newTheme, systemThemeRef.current);
        applyThemeToDOM(newResolvedTheme);
      });
    }

    // Set up system theme change listener
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      systemThemeRef.current = newSystemTheme;

      // Only update if current theme is 'system'
      if (themeRef.current === 'system') {
        resolvedThemeRef.current = newSystemTheme;
        applyThemeToDOM(newSystemTheme);
        triggerUpdate();
      }
    };

    if (!mediaQuery) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    }

    // Use modern addEventListener if available
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery?.removeEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
      return () => mediaQuery?.removeListener(handleSystemThemeChange);
    }
  }, [triggerUpdate]);

  // Optimized theme setter
  const setTheme = useCallback((newTheme: ThemeMode) => {
    const systemTheme = systemThemeRef.current;
    const newResolvedTheme = resolveTheme(newTheme, systemTheme);

    // Update refs immediately
    themeRef.current = newTheme;
    resolvedThemeRef.current = newResolvedTheme;

    // Apply to DOM synchronously for instant feedback
    applyThemeToDOM(newResolvedTheme);

    // Persist preference
    persistTheme(newTheme);

    // Trigger re-render
    triggerUpdate();
  }, [triggerUpdate]);

  // Optimized theme toggle
  const toggle = useCallback(() => {
    const currentTheme = themeRef.current;
    let newTheme: ThemeMode;

    // Cycle through themes: light -> dark -> system -> light
    switch (currentTheme) {
      case 'light':
        newTheme = 'dark';
        break;
      case 'dark':
        newTheme = 'system';
        break;
      case 'system':
        newTheme = 'light';
        break;
      default:
        newTheme = 'light';
    }

    setTheme(newTheme);
  }, [setTheme]);

  return {
    theme: themeRef.current,
    resolvedTheme: resolvedThemeRef.current,
    setTheme,
    toggle,
    isLoading,
  };
};

// Theme initialization function to be called before React renders
export const initializeThemeBeforeRender = (): void => {
  if (typeof window === 'undefined') return;

  // Initialize theme immediately to prevent flicker
  initializeTheme();
};

// Performance measurement utility for development
export const measureThemeTogglePerformance = (toggleFn: () => void): number => {
  if (process.env.NODE_ENV !== 'development') {
    toggleFn();
    return 0;
  }

  const start = performance.now();
  toggleFn();
  const end = performance.now();
  const duration = end - start;

  console.log(`Theme toggle took ${duration.toFixed(2)}ms`);

  if (duration > 16) {
    console.warn(`Theme toggle exceeded 16ms target: ${duration.toFixed(2)}ms`);
  }

  return duration;
};
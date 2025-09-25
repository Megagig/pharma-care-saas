/**
 * Theme initialization script to prevent flash of incorrect theme
 * 
 * This script should be executed as early as possible in the app lifecycle
 * to ensure the correct theme is applied before any content is rendered.
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/**
 * Initialize theme synchronously to prevent flicker
 * This function should be called before React renders
 */
export function initializeTheme(): ResolvedTheme {
    if (typeof window === 'undefined') {
        return 'light'; // Default for SSR
    }

    const root = document.documentElement;
    
    // Get stored theme preference
    let storedTheme: ThemeMode = 'system';
    try {
        const stored = localStorage.getItem('theme-preference');
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
            storedTheme = stored as ThemeMode;
        }
    } catch (error) {
        console.warn('Failed to read theme preference from localStorage:', error);
    }

    // Resolve theme based on preference and system setting
    let resolvedTheme: ResolvedTheme;
    
    if (storedTheme === 'system') {
        // Check system preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        resolvedTheme = mediaQuery.matches ? 'dark' : 'light';
    } else {
        resolvedTheme = storedTheme as ResolvedTheme;
    }

    // Apply theme to DOM immediately (synchronous)
    if (resolvedTheme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    // Set data attribute for CSS usage
    root.setAttribute('data-theme', resolvedTheme);

    // Set color-scheme for better browser integration
    root.style.colorScheme = resolvedTheme;

    return resolvedTheme;
}

/**
 * Create a script tag that can be injected into HTML head
 * for even earlier theme initialization
 */
export function createThemeInitScript(): string {
    return `
(function() {
    try {
        var root = document.documentElement;
        var stored = localStorage.getItem('theme-preference') || 'system';
        var resolvedTheme;
        
        if (stored === 'system') {
            var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            resolvedTheme = mediaQuery.matches ? 'dark' : 'light';
        } else {
            resolvedTheme = stored;
        }
        
        if (resolvedTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        
        root.setAttribute('data-theme', resolvedTheme);
        root.style.colorScheme = resolvedTheme;
    } catch (e) {
        console.warn('Theme initialization failed:', e);
    }
})();
`;
}

/**
 * Disable theme transitions temporarily to prevent animation during initialization
 */
export function disableThemeTransitions(): () => void {
    if (typeof window === 'undefined') {
        return () => {}; // No-op for SSR
    }

    const root = document.documentElement;
    root.classList.add('theme-transition-disabled');

    // Re-enable transitions after a short delay
    const timeoutId = setTimeout(() => {
        root.classList.remove('theme-transition-disabled');
    }, 100);

    // Return cleanup function
    return () => {
        clearTimeout(timeoutId);
        root.classList.remove('theme-transition-disabled');
    };
}

/**
 * Performance-optimized theme change function
 * Ensures theme changes happen within 16ms (1 frame)
 */
export function changeThemeOptimized(newTheme: ThemeMode): ResolvedTheme {
    if (typeof window === 'undefined') {
        return 'light';
    }

    const startTime = performance.now();
    const root = document.documentElement;

    // Resolve theme
    let resolvedTheme: ResolvedTheme;
    if (newTheme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        resolvedTheme = mediaQuery.matches ? 'dark' : 'light';
    } else {
        resolvedTheme = newTheme as ResolvedTheme;
    }

    // Apply theme synchronously using batch DOM updates
    if (resolvedTheme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    root.setAttribute('data-theme', resolvedTheme);
    root.style.colorScheme = resolvedTheme;

    // Persist preference asynchronously to avoid blocking
    requestIdleCallback(() => {
        try {
            localStorage.setItem('theme-preference', newTheme);
        } catch (error) {
            console.warn('Failed to persist theme preference:', error);
        }
    });

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (duration > 16) {
            console.warn(`Theme change took ${duration.toFixed(2)}ms (exceeded 16ms target)`);
        } else {
            console.log(`Theme change completed in ${duration.toFixed(2)}ms`);
        }
    }

    return resolvedTheme;
}
import { useCallback } from 'react';
import { useTheme, type ThemeMode } from './useTheme';

/**
 * Optimized theme toggle hook with synchronous DOM manipulation
 * 
 * This hook provides a fast theme toggle implementation that meets
 * the 16ms performance requirement by:
 * - Using synchronous DOM class manipulation
 * - Avoiding unnecessary component re-renders
 * - Implementing efficient localStorage persistence
 * - Supporting system preference detection
 */
export function useThemeToggle() {
    const { theme, resolvedTheme, isDark, setTheme, toggleTheme } = useTheme();

    // Fast toggle between light and dark (ignoring system)
    const toggleLightDark = useCallback(() => {
        const newTheme: ThemeMode = isDark ? 'light' : 'dark';
        setTheme(newTheme);
    }, [isDark, setTheme]);

    // Set specific theme with performance optimization
    const setThemeOptimized = useCallback((newTheme: ThemeMode) => {
        // Only update if theme is actually changing
        if (theme !== newTheme) {
            setTheme(newTheme);
        }
    }, [theme, setTheme]);

    // Initialize theme without flicker
    const initializeTheme = useCallback(() => {
        // This is handled automatically by the ThemeStore constructor
        // but exposed for manual initialization if needed
        const root = document.documentElement;
        const stored = localStorage.getItem('theme-preference') as ThemeMode | null;
        
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
            let resolvedMode: 'light' | 'dark';
            
            if (stored === 'system') {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                resolvedMode = mediaQuery.matches ? 'dark' : 'light';
            } else {
                resolvedMode = stored as 'light' | 'dark';
            }
            
            // Apply theme synchronously to prevent flicker
            if (resolvedMode === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
            
            root.setAttribute('data-theme', resolvedMode);
        }
    }, []);

    return {
        // Current state
        theme,
        resolvedTheme,
        isDark,
        isLight: !isDark,

        // Actions
        toggle: toggleTheme,
        toggleLightDark,
        setTheme: setThemeOptimized,
        
        // Utilities
        initializeTheme,
    };
}

/**
 * Performance monitoring hook for theme toggle speed
 * Used for testing and ensuring 16ms requirement is met
 */
export function useThemeTogglePerformance() {
    const { toggle, setTheme } = useThemeToggle();

    const measureTogglePerformance = useCallback(() => {
        const startTime = performance.now();
        
        toggle();
        
        // Use requestAnimationFrame to measure when DOM update is complete
        requestAnimationFrame(() => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`Theme toggle took ${duration.toFixed(2)}ms`);
            
            if (duration > 16) {
                console.warn(`Theme toggle exceeded 16ms target: ${duration.toFixed(2)}ms`);
            }
            
            return duration;
        });
    }, [toggle]);

    const measureSetThemePerformance = useCallback((newTheme: ThemeMode) => {
        const startTime = performance.now();
        
        setTheme(newTheme);
        
        requestAnimationFrame(() => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`Set theme to ${newTheme} took ${duration.toFixed(2)}ms`);
            
            return duration;
        });
    }, [setTheme]);

    return {
        measureTogglePerformance,
        measureSetThemePerformance,
    };
}

export default useThemeToggle;
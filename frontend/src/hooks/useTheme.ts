import { useEffect, useCallback, useSyncExternalStore } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeConfig {
    mode: ThemeMode;
    resolvedMode: ResolvedTheme;
    systemTheme: ResolvedTheme;
}

// Theme store using external store pattern for optimal performance
class ThemeStore {
    private config: ThemeConfig = {
        mode: 'system',
        resolvedMode: 'light',
        systemTheme: 'light',
    };

    private listeners = new Set<() => void>();
    private mediaQuery: MediaQueryList | null = null;
    private isInitialized = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.initializeStore();
        }
    }

    private initializeStore() {
        // Get stored theme preference
        const stored = localStorage.getItem('theme-preference');
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
            this.config.mode = stored as ThemeMode;
        }

        // Set up system theme detection
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.config.systemTheme = this.mediaQuery.matches ? 'dark' : 'light';

        // Resolve initial theme
        this.config.resolvedMode = this.resolveTheme(this.config.mode, this.config.systemTheme);

        // Apply theme immediately to DOM (synchronous)
        this.applyThemeToDOM(this.config.resolvedMode);

        // Listen for system theme changes
        const handleSystemChange = (e: MediaQueryListEvent) => {
            this.config.systemTheme = e.matches ? 'dark' : 'light';

            // Only update resolved theme if current mode is 'system'
            if (this.config.mode === 'system') {
                this.config.resolvedMode = this.config.systemTheme;
                this.applyThemeToDOM(this.config.resolvedMode);
            }

            this.notifyListeners();
        };

        if (this.mediaQuery.addEventListener) {
            this.mediaQuery.addEventListener('change', handleSystemChange);
        } else {
            // Fallback for older browsers
            this.mediaQuery.addListener(handleSystemChange);
        }

        this.isInitialized = true;
    }

    private resolveTheme(mode: ThemeMode, systemTheme: ResolvedTheme): ResolvedTheme {
        return mode === 'system' ? systemTheme : (mode as ResolvedTheme);
    }

    private applyThemeToDOM(theme: ResolvedTheme) {
        const root = document.documentElement;

        // Apply theme class synchronously
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Set data attribute for CSS usage
        root.setAttribute('data-theme', theme);
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener());
    }

    private persistTheme(mode: ThemeMode) {
        try {
            localStorage.setItem('theme-preference', mode);
        } catch (error) {
            console.warn('Failed to persist theme preference:', error);
        }
    }

    // Public API
    getSnapshot = (): ThemeConfig => {
        return { ...this.config };
    };

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    setTheme = (mode: ThemeMode): void => {
        this.config.mode = mode;
        this.config.resolvedMode = this.resolveTheme(mode, this.config.systemTheme);

        // Apply theme synchronously to DOM
        this.applyThemeToDOM(this.config.resolvedMode);

        // Persist preference
        this.persistTheme(mode);

        // Sync with backend for authenticated users
        this.syncWithBackend(mode);

        // Notify listeners
        this.notifyListeners();
    };

    toggleTheme = (): void => {
        const { mode } = this.config;
        let newMode: ThemeMode;

        // Cycle through: light -> dark -> system -> light
        if (mode === 'light') {
            newMode = 'dark';
        } else if (mode === 'dark') {
            newMode = 'system';
        } else {
            newMode = 'light';
        }

        this.setTheme(newMode);
    };

    private async syncWithBackend(mode: ThemeMode): Promise<void> {
        try {
            // Get current user from auth context/localStorage
            const authData = localStorage.getItem('auth-storage');
            if (!authData) return;

            const { state } = JSON.parse(authData);
            if (!state?.user?.id || !state?.token) return;

            // Make API call to update user theme preference
            const response = await fetch('/api/auth/theme', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${state.token}`,
                },
                body: JSON.stringify({ themePreference: mode }),
            });

            if (!response.ok) {
                console.warn('Failed to sync theme preference with backend');
            }
        } catch (error) {
            console.warn('Error syncing theme preference:', error);
        }
    }

    getServerSnapshot = (): ThemeConfig => {
        // Return default theme for SSR
        return {
            mode: 'system',
            resolvedMode: 'light',
            systemTheme: 'light',
        };
    };
}

// Create singleton instance
const themeStore = new ThemeStore();

/**
 * Optimized theme hook using useSyncExternalStore for performance
 * 
 * Features:
 * - Synchronous theme switching without re-renders
 * - Automatic system theme detection and monitoring
 * - localStorage persistence
 * - Backend synchronization for authenticated users
 * - SSR-safe implementation
 */
export function useTheme() {
    const config = useSyncExternalStore(
        themeStore.subscribe,
        themeStore.getSnapshot,
        themeStore.getServerSnapshot
    );

    // Memoized setters to prevent unnecessary re-renders
    const setTheme = useCallback((mode: ThemeMode) => {
        themeStore.setTheme(mode);
    }, []);

    const toggleTheme = useCallback(() => {
        themeStore.toggleTheme();
    }, []);

    return {
        // Current theme state
        theme: config.mode,
        resolvedTheme: config.resolvedMode,
        systemTheme: config.systemTheme,

        // Convenience flags
        isDark: config.resolvedMode === 'dark',
        isLight: config.resolvedMode === 'light',
        isSystem: config.mode === 'system',

        // Actions
        setTheme,
        toggleTheme,
    };
}

/**
 * Hook for components that only need to know the resolved theme
 * without subscribing to mode changes (performance optimization)
 */
export function useResolvedTheme(): ResolvedTheme {
    const config = useSyncExternalStore(
        themeStore.subscribe,
        themeStore.getSnapshot,
        themeStore.getServerSnapshot
    );

    return config.resolvedMode;
}

/**
 * Hook for getting theme-aware CSS classes
 */
export function useThemeClasses() {
    const { resolvedTheme } = useTheme();

    return {
        theme: resolvedTheme,
        isDark: resolvedTheme === 'dark',
        isLight: resolvedTheme === 'light',
        // Common theme-aware class combinations
        bg: resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white',
        text: resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900',
        border: resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200',
        card: resolvedTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    };
}

// Export the store instance for advanced usage
export { themeStore };
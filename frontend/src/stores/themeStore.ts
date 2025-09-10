import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeMode, ResolvedTheme } from './types';

interface ThemeStore {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  isInitialized: boolean;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
  updateSystemTheme: (systemTheme: ResolvedTheme) => void;

  // Sync with backend for authenticated users
  syncThemeWithBackend: () => Promise<void>;
  updateUserThemePreference: (theme: ThemeMode) => Promise<void>;
}

// Helper function to get system theme preference
const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

// Helper function to apply theme to DOM
const applyThemeToDOM = (theme: ResolvedTheme) => {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Add transition class for smooth theme changes
  root.style.transition = 'background-color 0.3s ease, color 0.3s ease';

  // Store resolved theme in data attribute for CSS usage
  root.setAttribute('data-theme', theme);
};

// Helper function to resolve theme based on current settings
const resolveTheme = (
  theme: ThemeMode,
  systemTheme: ResolvedTheme
): ResolvedTheme => {
  if (theme === 'system') {
    return systemTheme;
  }
  return theme as ResolvedTheme;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',
      systemTheme: 'light',
      isInitialized: false,

      setTheme: (theme: ThemeMode) => {
        const { systemTheme } = get();
        const resolvedTheme = resolveTheme(theme, systemTheme);

        set({ theme, resolvedTheme });
        applyThemeToDOM(resolvedTheme);

        // Sync with backend if user is authenticated
        get().updateUserThemePreference(theme);
      },

      toggleTheme: () => {
        const { theme } = get();
        let newTheme: ThemeMode;

        if (theme === 'light') {
          newTheme = 'dark';
        } else if (theme === 'dark') {
          newTheme = 'system';
        } else {
          newTheme = 'light';
        }

        get().setTheme(newTheme);
      },

      initializeTheme: () => {
        const { theme } = get();
        const systemTheme = getSystemTheme();
        const resolvedTheme = resolveTheme(theme, systemTheme);

        set({
          systemTheme,
          resolvedTheme,
          isInitialized: true,
        });

        applyThemeToDOM(resolvedTheme);

        // Listen for system theme changes
        if (typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

          const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            const newSystemTheme = e.matches ? 'dark' : 'light';
            get().updateSystemTheme(newSystemTheme);
          };

          // Use addEventListener for modern browsers
          if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleSystemThemeChange);
          } else {
            // Fallback for older browsers
            mediaQuery.addListener(handleSystemThemeChange);
          }
        }
      },

      updateSystemTheme: (systemTheme: ResolvedTheme) => {
        const { theme } = get();
        const resolvedTheme = resolveTheme(theme, systemTheme);

        set({ systemTheme, resolvedTheme });

        // Only apply to DOM if current theme is 'system'
        if (theme === 'system') {
          applyThemeToDOM(resolvedTheme);
        }
      },

      syncThemeWithBackend: async () => {
        // This will be implemented when we add the API endpoint
        // For now, just return a resolved promise
        return Promise.resolve();
      },

      updateUserThemePreference: async (theme: ThemeMode) => {
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
            body: JSON.stringify({ themePreference: theme }),
          });

          if (!response.ok) {
            console.warn('Failed to sync theme preference with backend');
          }
        } catch (error) {
          console.warn('Error syncing theme preference:', error);
        }
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);

// Custom hook for easier theme access
export const useTheme = () => {
  const store = useThemeStore();

  return {
    theme: store.theme,
    resolvedTheme: store.resolvedTheme,
    systemTheme: store.systemTheme,
    isInitialized: store.isInitialized,
    setTheme: store.setTheme,
    toggleTheme: store.toggleTheme,
    initializeTheme: store.initializeTheme,
    isDark: store.resolvedTheme === 'dark',
    isLight: store.resolvedTheme === 'light',
    isSystem: store.theme === 'system',
  };
};

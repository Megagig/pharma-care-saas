interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
}

/**
 * Lightweight theme provider that replaces MUI ThemeProvider
 *
 * Features:
 * - No heavy theme object propagation
 * - Synchronous theme switching
 * - CSS variable-based theming
 * - Minimal re-renders
 * - SSR-safe
 */
export function ThemeProvider({ 
  children,
  defaultTheme = 'system',
  storageKey = 'theme-preference'}
}: ThemeProviderProps) {
  const themeHook = useThemeHook();

  // Initialize theme on mount
  useEffect(() => {
    // The theme hook handles initialization automatically
    // This effect is just for any additional setup if needed
  }, []);

  const contextValue: ThemeContextValue = {
    theme: themeHook.theme,
    resolvedTheme: themeHook.resolvedTheme,
    systemTheme: themeHook.systemTheme,
    isDark: themeHook.isDark,
    isLight: themeHook.isLight,
    isSystem: themeHook.isSystem,
    setTheme: themeHook.setTheme,
    toggleTheme: themeHook.toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 *
 * @throws Error if used outside ThemeProvider
 */
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }

  return context;
}

/**
 * Alternative hook that provides the same interface as the direct useTheme hook
 * Use this when you want to ensure the component is within a ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  return useThemeContext();
}

/**
 * HOC for components that need theme context
 */
export function withTheme<P extends object>(
) {
  const WrappedComponent = (props: P) => {
    const theme = useThemeContext();
    return <Component {...props} theme={theme} />;
  };

    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

/**
 * Theme toggle button component for easy integration
 */
export function ThemeToggle({ 
  className = '',
  showLabel = false}
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { theme, toggleTheme, isDark } = useThemeContext();

  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center justify-center rounded-md text-sm font-medium 
        transition-colors focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 
        disabled:pointer-events-none ring-offset-background
        hover:bg-accent hover:text-accent-foreground
        h-10 w-10}
        ${className}
      `}
      title={`Switch to ${
        theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'}
      } mode`}
    >
      {isDark ? (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
      {showLabel && (
        <span className="ml-2 capitalize">
          {theme === 'system' ? 'auto' : theme}
        </span>
      )}
    </button>
  );
}

export default ThemeProvider;

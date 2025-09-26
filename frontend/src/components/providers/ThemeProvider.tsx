interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggle: () => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Optimized ThemeProvider component with sub-16ms theme switching
 * Uses the new useThemeToggle hook for maximum performance
 */
const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, resolvedTheme, setTheme, toggle, isLoading } = useThemeToggle();

  // Create context value with derived properties
  const contextValue: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    toggle,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system',
  };

  // Show minimal loading state only if theme is still initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 * Provides the same interface as the old useTheme hook for compatibility
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;

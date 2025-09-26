import React, { useEffect } from 'react';
import { useTheme } from '../../stores/themeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * ThemeProvider component that initializes the theme system
 * and provides theme context to the entire application
 */
const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { initializeTheme, isInitialized, resolvedTheme } = useTheme();

  useEffect(() => {
    // Always initialize the theme on mount
    initializeTheme();
  }, [initializeTheme]);

  // Force apply theme on resolvedTheme changes
  useEffect(() => {
    if (isInitialized) {
      const root = document.documentElement;
      if (resolvedTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      root.setAttribute('data-theme', resolvedTheme);
    }
  }, [resolvedTheme, isInitialized]);

  // Add base classes to prevent FOUC (Flash of Unstyled Content)
  useEffect(() => {
    const root = document.documentElement;
    root.style.transition =
      'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease';
  }, []);

  return <>{children}</>;
};

export default ThemeProvider;

import React, { createContext, useEffect } from 'react';
import {
   ThemeProvider as MuiThemeProvider,
   createTheme,
   Theme,
} from '@mui/material';
import { useTheme as useZustandTheme } from '../../stores/themeStore';

// Create a context for the theme
export const ModernThemeContext = createContext<{
   theme: Theme;
   toggleTheme: () => void;
   isDark: boolean;
}>({
   theme: createTheme(),
   toggleTheme: () => {},
   isDark: false,
});

// Theme configuration
const getDesignTokens = (mode: 'light' | 'dark') => ({
   palette: {
      mode,
      primary: {
         main: '#0ea5e9',
         light: '#38bdf8',
         dark: '#0369a1',
         contrastText: '#ffffff',
      },
      secondary: {
         main: '#8b5cf6',
         light: '#a78bfa',
         dark: '#6d28d9',
         contrastText: '#ffffff',
      },
      success: {
         main: '#22c55e',
         light: '#4ade80',
         dark: '#16a34a',
      },
      warning: {
         main: '#f59e0b',
         light: '#fbbf24',
         dark: '#d97706',
      },
      error: {
         main: '#ef4444',
         light: '#f87171',
         dark: '#dc2626',
      },
      grey: {
         50: '#f8fafc',
         100: '#f1f5f9',
         200: '#e2e8f0',
         300: '#cbd5e1',
         400: '#94a3b8',
         500: '#64748b',
         600: '#475569',
         700: '#334155',
         800: '#1e293b',
         900: '#0f172a',
      },
      ...(mode === 'dark'
         ? {
              background: {
                 default: '#0f172a',
                 paper: '#1e293b',
              },
              text: {
                 primary: '#f1f5f9',
                 secondary: '#94a3b8',
              },
           }
         : {
              background: {
                 default: '#f1f5f9',
                 paper: '#ffffff',
              },
              text: {
                 primary: '#0f172a',
                 secondary: '#475569',
              },
           }),
   },
   shape: {
      borderRadius: 8,
   },
   typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
         fontWeight: 700,
      },
      h2: {
         fontWeight: 700,
      },
      h3: {
         fontWeight: 700,
      },
      h4: {
         fontWeight: 600,
      },
      h5: {
         fontWeight: 600,
      },
      h6: {
         fontWeight: 600,
      },
      subtitle1: {
         fontWeight: 500,
      },
      subtitle2: {
         fontWeight: 500,
      },
   },
   components: {
      MuiButton: {
         styleOverrides: {
            root: {
               textTransform: 'none',
               borderRadius: 8,
               fontWeight: 600,
               boxShadow: 'none',
            },
         },
      },
      MuiCard: {
         styleOverrides: {
            root: {
               borderRadius: 12,
            },
         },
      },
      MuiChip: {
         styleOverrides: {
            root: {
               fontWeight: 500,
            },
         },
      },
   },
});

interface ModernThemeProviderProps {
   children: React.ReactNode;
}

const ModernThemeProvider: React.FC<ModernThemeProviderProps> = ({
   children,
}) => {
   const { resolvedTheme, toggleTheme } = useZustandTheme();
   const mode = resolvedTheme === 'dark' ? 'dark' : 'light';

   // Create theme based on the current mode
   const theme = React.useMemo(
      () => createTheme(getDesignTokens(mode as 'light' | 'dark')),
      [mode]
   );

   // Apply CSS variables to the root element
   useEffect(() => {
      document.documentElement.dataset.theme = mode;
   }, [mode]);

   return (
      <ModernThemeContext.Provider
         value={{ theme, toggleTheme, isDark: mode === 'dark' }}
      >
         <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
      </ModernThemeContext.Provider>
   );
};

export default ModernThemeProvider;

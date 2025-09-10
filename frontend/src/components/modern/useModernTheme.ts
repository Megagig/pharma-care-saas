import { useContext } from 'react';
import type { Theme } from '@mui/material';
import { ModernThemeContext } from './ModernThemeProvider';

// Define the context type
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

// Hook to access the theme context
export const useModernTheme = (): ThemeContextType =>
  useContext(ModernThemeContext);

# Theme System Guide

## Overview

The PharmaCare SaaS application uses a modern theme system built on CSS variables and Tailwind CSS. This system provides fast theme switching, system preference detection, and consistent theming across all components.

## Architecture

### CSS Variables Foundation
The theme system is built on CSS variables defined in `src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 84% 4.9%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 94.1%;
}
```

### Tailwind Configuration
The theme variables are integrated with Tailwind CSS in `tailwind.config.js`:

```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

## Theme Provider

### ThemeProvider Component
The `ThemeProvider` manages theme state and provides context to the application:

```tsx
// src/components/providers/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
```

## Theme Toggle Hook

### useThemeToggle Hook
A performance-optimized hook for fast theme switching:

```tsx
// src/hooks/useThemeToggle.ts
import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeToggleHook {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggle: () => void;
  isLoading: boolean;
}

export function useThemeToggle(): ThemeToggleHook {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme;
    const initialTheme = stored || 'system';
    
    setThemeState(initialTheme);
    updateResolvedTheme(initialTheme);
    setIsLoading(false);
  }, []);

  // Update resolved theme based on current theme and system preference
  const updateResolvedTheme = useCallback((currentTheme: Theme) => {
    let resolved: 'light' | 'dark';
    
    if (currentTheme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
    } else {
      resolved = currentTheme;
    }
    
    setResolvedTheme(resolved);
    
    // Apply theme to DOM immediately for fast switching
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
  }, []);

  // Set theme with persistence and immediate DOM update
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    updateResolvedTheme(newTheme);
    
    // Dispatch custom event for components that need to react to theme changes
    window.dispatchEvent(new CustomEvent('theme-change', { 
      detail: { theme: newTheme, resolvedTheme: resolvedTheme } 
    }));
  }, [resolvedTheme]);

  // Toggle between light and dark (ignores system)
  const toggle = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => updateResolvedTheme('system');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, updateResolvedTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggle,
    isLoading,
  };
}
```

## Theme Toggle Component

### ThemeToggle Component
A reusable component for theme switching:

```tsx
// src/components/common/ThemeToggle.tsx
import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThemeToggle } from '@/hooks/useThemeToggle';

interface ThemeToggleProps {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function ThemeToggle({ size = 'default', variant = 'ghost' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useThemeToggle();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          {resolvedTheme === 'dark' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple toggle button (light/dark only)
export function SimpleThemeToggle({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const { resolvedTheme, toggle } = useThemeToggle();

  return (
    <Button variant="ghost" size={size} onClick={toggle}>
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

## Theme Initialization

### Preventing Flash of Incorrect Theme
To prevent the flash of incorrect theme on page load, add this script to your HTML head:

```html
<!-- In public/index.html or your HTML template -->
<script>
  (function() {
    const theme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const resolvedTheme = theme === 'system' || !theme ? systemTheme : theme;
    
    document.documentElement.classList.add(resolvedTheme);
  })();
</script>
```

Or use the theme initialization utility:

```tsx
// src/lib/theme-init.ts
export function initializeTheme() {
  const theme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const resolvedTheme = theme === 'system' || !theme ? systemTheme : theme;
  
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(resolvedTheme);
}

// Call this as early as possible in your app
initializeTheme();
```

## Color Palette

### Available Colors
The theme system provides these semantic color tokens:

#### Background Colors
- `bg-background` - Main background color
- `bg-card` - Card/surface background
- `bg-popover` - Popover/dropdown background
- `bg-muted` - Muted/disabled background
- `bg-accent` - Accent background

#### Text Colors
- `text-foreground` - Primary text color
- `text-card-foreground` - Text on card backgrounds
- `text-popover-foreground` - Text on popover backgrounds
- `text-muted-foreground` - Muted/secondary text
- `text-accent-foreground` - Text on accent backgrounds

#### Interactive Colors
- `bg-primary` / `text-primary-foreground` - Primary actions
- `bg-secondary` / `text-secondary-foreground` - Secondary actions
- `bg-destructive` / `text-destructive-foreground` - Destructive actions

#### Border and Ring Colors
- `border-border` - Default border color
- `border-input` - Input border color
- `ring-ring` - Focus ring color

### Custom Colors
You can extend the color palette by adding custom CSS variables:

```css
:root {
  /* Custom colors */
  --success: 142 76% 36%;
  --success-foreground: 355 7% 97%;
  --warning: 38 92% 50%;
  --warning-foreground: 48 96% 89%;
  --info: 199 89% 48%;
  --info-foreground: 210 20% 98%;
}

.dark {
  --success: 142 71% 45%;
  --success-foreground: 144 61% 20%;
  --warning: 38 92% 50%;
  --warning-foreground: 48 96% 89%;
  --info: 199 89% 48%;
  --info-foreground: 210 20% 98%;
}
```

Then extend your Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },
    },
  },
};
```

## Performance Optimizations

### Fast Theme Switching
The theme system is optimized for sub-16ms theme switching:

1. **Direct DOM Manipulation**: Updates classes directly on `document.documentElement`
2. **CSS Variables**: Instant color updates without re-rendering components
3. **Minimal JavaScript**: Lightweight theme logic with no heavy computations
4. **Cached Preferences**: Stores theme preference in localStorage

### Performance Monitoring
Monitor theme toggle performance:

```tsx
// src/lib/theme-performance.ts
export function measureThemeTogglePerformance() {
  const startTime = performance.now();
  
  // Theme toggle logic here
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`Theme toggle took ${duration.toFixed(2)}ms`);
  
  // Log warning if toggle takes longer than 16ms
  if (duration > 16) {
    console.warn(`Theme toggle performance issue: ${duration.toFixed(2)}ms (target: <16ms)`);
  }
  
  return duration;
}
```

## Responsive Design

### Breakpoint-Aware Theming
The theme system works seamlessly with Tailwind's responsive utilities:

```tsx
// Different themes for different screen sizes
<div className="bg-background md:bg-card lg:bg-muted">
  Content with responsive background
</div>

// Theme-aware responsive text
<h1 className="text-foreground text-lg md:text-xl lg:text-2xl">
  Responsive themed heading
</h1>
```

### Print Styles
Ensure proper theming for print media:

```css
@media print {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 0%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 0%;
    /* Override other colors for print */
  }
}
```

## Accessibility

### Color Contrast
All theme colors meet WCAG 2.1 AA contrast requirements:

- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- Interactive elements: 3:1 contrast ratio

### High Contrast Mode
Support for high contrast preferences:

```css
@media (prefers-contrast: high) {
  :root {
    --border: 0 0% 0%;
    --ring: 0 0% 0%;
    /* Increase contrast for better accessibility */
  }
}
```

### Reduced Motion
Respect user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Testing

### Theme Testing Utilities
Test theme functionality:

```tsx
// src/test/theme-utils.tsx
import { render } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export function renderWithTheme(
  ui: React.ReactElement,
  { theme = 'light' }: { theme?: 'light' | 'dark' | 'system' } = {}
) {
  return render(
    <ThemeProvider defaultTheme={theme}>
      {ui}
    </ThemeProvider>
  );
}

// Test both themes
export function renderWithBothThemes(ui: React.ReactElement) {
  const lightResult = renderWithTheme(ui, { theme: 'light' });
  const darkResult = renderWithTheme(ui, { theme: 'dark' });
  
  return { light: lightResult, dark: darkResult };
}
```

### Visual Regression Testing
Test theme consistency across components:

```typescript
// e2e/theme-visual-regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Theme Visual Regression', () => {
  test('should render correctly in light theme', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    
    await expect(page).toHaveScreenshot('dashboard-light.png');
  });

  test('should render correctly in dark theme', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate(() => {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
    
    await expect(page).toHaveScreenshot('dashboard-dark.png');
  });
});
```

## Troubleshooting

### Common Issues

#### Theme not applying on initial load
**Solution**: Ensure theme initialization script runs before React renders.

#### Flash of incorrect theme
**Solution**: Add theme initialization script to HTML head or use SSR.

#### Theme toggle not working
**Solution**: Check that ThemeProvider wraps your app and localStorage is available.

#### Colors not updating
**Solution**: Verify CSS variables are properly defined and Tailwind config is correct.

#### Performance issues
**Solution**: Avoid triggering React re-renders during theme changes, use direct DOM manipulation.

### Debug Mode
Enable theme debugging:

```tsx
// Add to your app for debugging
if (process.env.NODE_ENV === 'development') {
  window.debugTheme = {
    getCurrentTheme: () => localStorage.getItem('theme'),
    getResolvedTheme: () => document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    toggleTheme: () => {
      const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.remove(current);
      document.documentElement.classList.add(next);
      localStorage.setItem('theme', next);
    },
  };
}
```

This comprehensive theme system provides a solid foundation for consistent, performant, and accessible theming across your application.
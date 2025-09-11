# Dark/Light Mode Implementation Guide

## Overview

This document describes the comprehensive dark/light mode system implemented in the PharmaCare SaaS application. The system provides seamless theme switching with persistence across sessions and real-time system preference detection.

## Architecture

### Frontend Implementation

#### 1. Theme Store (Zustand)

- **Location**: `frontend/src/stores/themeStore.ts`
- **Features**:
   - Three-state theme system: `light`, `dark`, `system`
   - Real-time system preference detection
   - Local storage persistence
   - Backend synchronization for authenticated users
   - Smooth DOM transitions

#### 2. Theme Types

- **Location**: `frontend/src/stores/types.ts`
- **Types**:
   ```typescript
   type ThemeMode = 'light' | 'dark' | 'system';
   type ResolvedTheme = 'light' | 'dark';
   ```

#### 3. Components

- **ThemeToggle**: `frontend/src/components/common/ThemeToggle.tsx`
   - Button and dropdown variants
   - Size options (sm, md, lg)
   - Visual indicators for system mode
- **ThemeProvider**: `frontend/src/components/providers/ThemeProvider.tsx`
   - Initializes theme system on app load
   - Prevents FOUC (Flash of Unstyled Content)

### Backend Implementation

#### 1. User Model Extension

- **Location**: `backend/src/models/User.ts`
- **Field Added**:
   ```typescript
   themePreference?: 'light' | 'dark' | 'system';
   ```
- **Default**: `'system'`

#### 2. API Endpoints

- **Route**: `PATCH /api/auth/theme`
- **Controller**: `backend/src/controllers/authController.ts`
- **Function**: `updateThemePreference`
- **Returns**: Updated theme preference

#### 3. Database Migration

- **Script**: `backend/src/scripts/themePreferenceMigration.ts`
- **Commands**:
   ```bash
   npm run migrate:theme-preference        # Apply migration
   npm run migrate:theme-preference:status # Check status
   npm run migrate:theme-preference:down   # Rollback
   ```

## Styling System

### Tailwind Configuration

- **File**: `frontend/tailwind.config.js`
- **Features**:
   - Dark mode enabled with `class` strategy
   - Custom color palettes for both themes
   - Smooth transition animations
   - Professional purple-blue dark theme

### CSS Classes

- **File**: `frontend/src/styles/theme.css`
- **Utilities**:
   - `.text-theme-primary` - Primary text color
   - `.bg-theme-primary` - Primary background
   - `.border-theme` - Theme-aware borders
   - `.btn-primary` - Themed primary button
   - `.input-theme` - Themed form inputs

### Color Scheme

#### Light Theme

- Primary: Blue palette (#2563eb)
- Secondary: Green palette (#10b981)
- Background: White/Gray-50
- Text: Gray-900/Gray-600

#### Dark Theme

- Primary: Purple-accent palette (#a855f7)
- Secondary: Purple-blue gradient
- Background: Dark-900/Dark-800 (custom)
- Text: Gray-100/Gray-300

## Usage Examples

### 1. Using Theme Hook

```typescript
import { useTheme } from '../stores/themeStore';

const MyComponent = () => {
  const { theme, setTheme, resolvedTheme, isDark } = useTheme();

  return (
    <div className={`p-4 ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
      <button onClick={() => setTheme('dark')}>Switch to Dark</button>
    </div>
  );
};
```

### 2. Theme Toggle Component

```typescript
import ThemeToggle from '../components/common/ThemeToggle';

// Simple toggle button
<ThemeToggle />

// Dropdown with label
<ThemeToggle variant="dropdown" showLabel />

// Large size
<ThemeToggle size="lg" />
```

### 3. Tailwind Classes

```tsx
// Text that adapts to theme
<p className="text-gray-900 dark:text-gray-100">
  This text is readable in both themes
</p>

// Background that adapts
<div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700">
  Themed container
</div>

// Using utility classes
<div className="bg-theme-primary text-theme-primary border-theme">
  Automatically themed content
</div>
```

## Installation & Setup

### 1. Frontend Setup

```bash
# Install dependencies (already included)
npm install zustand lucide-react

# Import theme styles in main CSS
# Already done in App.tsx
```

### 2. Backend Setup

```bash
# Run migration to add theme field to existing users
npm run migrate:theme-preference

# Check migration status
npm run migrate:theme-preference:status
```

### 3. Component Integration

```typescript
// Add ThemeToggle to your navbar/header
import ThemeToggle from './components/common/ThemeToggle';

<nav>
  {/* Other nav items */}
  <ThemeToggle />
</nav>;
```

## Customization

### Adding New Colors

1. Update `tailwind.config.js` with new color definitions
2. Add corresponding dark mode variants
3. Update CSS utilities in `theme.css`

### Custom Theme Logic

```typescript
// Extend the theme store for custom behavior
const useCustomTheme = () => {
   const theme = useTheme();

   const isHighContrast = theme.resolvedTheme === 'dark';
   const primaryColor = isHighContrast ? 'accent' : 'primary';

   return { ...theme, isHighContrast, primaryColor };
};
```

### Adding Theme to New Components

1. Use the `useTheme` hook for programmatic access
2. Apply Tailwind dark: classes for styling
3. Use utility classes from `theme.css` for consistency

## Best Practices

### 1. Performance

- Theme changes are optimized with CSS transitions
- DOM updates are batched for smooth animations
- Local storage prevents unnecessary re-renders

### 2. Accessibility

- High contrast ratios maintained in both themes
- ARIA labels provided for theme controls
- Keyboard navigation supported
- Focus indicators theme-aware

### 3. UX Guidelines

- Theme preference persists across sessions
- System preference detection is real-time
- Smooth transitions prevent jarring changes
- Visual feedback for current theme state

### 4. Development

- Use semantic Tailwind classes (`text-gray-900 dark:text-gray-100`)
- Test components in both light and dark modes
- Verify color contrast ratios
- Test system preference switching

## Troubleshooting

### Common Issues

1. **FOUC (Flash of Unstyled Content)**
   - Ensure ThemeProvider is wrapped around app
   - Check that theme initialization runs before render

2. **Theme Not Persisting**
   - Verify localStorage is available
   - Check backend API for authenticated users
   - Ensure migration has been run

3. **Colors Not Switching**
   - Verify `dark` class is being applied to `<html>`
   - Check Tailwind purging isn't removing dark: classes
   - Ensure CSS transitions aren't interfering

4. **System Preference Not Working**
   - Check browser support for `prefers-color-scheme`
   - Verify event listeners are properly attached
   - Test with actual system theme changes

### Debug Tools

```typescript
// Check current theme state
console.log(useThemeStore.getState());

// Force theme change
useThemeStore.getState().setTheme('dark');

// Check DOM classes
console.log(document.documentElement.classList);
```

## Migration Guide

### From Existing Theme System

1. Remove old theme logic from components
2. Replace theme state with new `useTheme` hook
3. Update CSS classes to use Tailwind dark: variants
4. Run database migration for user preferences

### Breaking Changes

- Old `useTheme` from `uiStore` is deprecated
- MUI theme system will be gradually phased out
- CSS-in-JS themes should be replaced with Tailwind

## Future Enhancements

### Planned Features

1. **Multiple Theme Variants**
   - High contrast mode
   - Reduced motion support
   - Custom color themes

2. **Advanced Preferences**
   - Per-page theme settings
   - Scheduled theme switching
   - Theme templates

3. **Performance Optimizations**
   - CSS custom properties for faster switching
   - Preload theme resources
   - Server-side rendering support

### API Extensions

```typescript
// Future theme hook features
const {
   theme,
   setTheme,
   scheduleThemeChange,
   getThemeHistory,
   applyCustomTheme,
} = useAdvancedTheme();
```

## Testing

### Unit Tests

```typescript
// Test theme store
import { useThemeStore } from '../stores/themeStore';

test('theme toggle cycles through options', () => {
   const store = useThemeStore.getState();
   store.setTheme('light');
   store.toggleTheme();
   expect(store.theme).toBe('dark');
});
```

### E2E Tests

```typescript
// Test theme persistence
test('theme persists across page reload', async () => {
   await page.click('[data-testid="theme-toggle"]');
   await page.reload();
   const theme = await page.getAttribute('html', 'class');
   expect(theme).toContain('dark');
});
```

## Support

For questions or issues with the theme system:

1. Check this documentation first
2. Review the troubleshooting section
3. Test in both development and production environments
4. Check browser console for any errors

The theme system is designed to be robust and maintainable. Follow the established patterns and conventions for the best experience.

# Migration Troubleshooting Guide

## Overview

This guide addresses common issues encountered during the MUI to shadcn/ui migration and provides solutions for troubleshooting problems that may arise.

## Common Migration Issues

### 1. Build Errors

#### Issue: "Cannot resolve import '@mui/material'"
**Symptoms:**
```
[vite]: Rollup failed to resolve import "@mui/material" from "src/components/MyComponent.tsx"
```

**Cause:** MUI imports still exist in the codebase after dependency removal.

**Solution:**
1. Search for remaining MUI imports:
   ```bash
   grep -r "@mui" src/ --include="*.tsx" --include="*.ts"
   ```

2. Replace MUI imports with shadcn/ui equivalents:
   ```tsx
   // Before
   import { Button, TextField } from '@mui/material';
   
   // After
   import { Button } from '@/components/ui/button';
   import { Input } from '@/components/ui/input';
   ```

3. Use the cleanup script:
   ```bash
   node scripts/cleanup-mui-imports.js
   ```

#### Issue: "Cannot resolve import '@/components/ui/component'"
**Symptoms:**
```
[vite]: Rollup failed to resolve import "@/components/ui/button"
```

**Cause:** Path alias not configured or component doesn't exist.

**Solution:**
1. Verify Vite configuration includes path aliases:
   ```typescript
   // vite.config.ts
   export default defineConfig({
     resolve: {
       alias: {
         "@": path.resolve(__dirname, "./src"),
       },
     },
   });
   ```

2. Check if the component exists:
   ```bash
   ls src/components/ui/button.tsx
   ```

3. Install missing shadcn/ui components:
   ```bash
   npx shadcn-ui@latest add button
   ```

#### Issue: TypeScript errors after migration
**Symptoms:**
```
Property 'sx' does not exist on type 'IntrinsicAttributes'
```

**Cause:** MUI-specific props still being used.

**Solution:**
1. Replace `sx` props with Tailwind classes:
   ```tsx
   // Before
   <div sx={{ display: 'flex', gap: 2 }}>
   
   // After
   <div className="flex gap-4">
   ```

2. Update component props:
   ```tsx
   // Before
   <Button variant="contained" color="primary">
   
   // After
   <Button variant="default">
   ```

### 2. Styling Issues

#### Issue: Components look unstyled or broken
**Symptoms:** Components appear without proper styling or layout.

**Cause:** Missing Tailwind CSS imports or configuration.

**Solution:**
1. Ensure Tailwind CSS is imported in your main CSS file:
   ```css
   /* src/index.css */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

2. Verify Tailwind configuration:
   ```javascript
   // tailwind.config.js
   module.exports = {
     content: ["./src/**/*.{js,jsx,ts,tsx}"],
     // ... rest of config
   };
   ```

3. Check that CSS variables are defined:
   ```css
   :root {
     --background: 0 0% 100%;
     --foreground: 222.2 84% 4.9%;
     /* ... other variables */
   }
   ```

#### Issue: Theme not applying correctly
**Symptoms:** Dark/light theme toggle not working or colors incorrect.

**Cause:** Theme provider not configured or CSS variables missing.

**Solution:**
1. Wrap your app with ThemeProvider:
   ```tsx
   import { ThemeProvider } from '@/components/providers/ThemeProvider';
   
   function App() {
     return (
       <ThemeProvider>
         <YourApp />
       </ThemeProvider>
     );
   }
   ```

2. Add theme initialization script to prevent flash:
   ```html
   <script>
     (function() {
       const theme = localStorage.getItem('theme');
       const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
       const resolvedTheme = theme === 'system' || !theme ? systemTheme : theme;
       document.documentElement.classList.add(resolvedTheme);
     })();
   </script>
   ```

#### Issue: Inconsistent spacing or sizing
**Symptoms:** Components have different spacing than before migration.

**Cause:** MUI spacing units (1 = 8px) vs Tailwind spacing (1 = 0.25rem).

**Solution:**
1. Update spacing values:
   ```tsx
   // Before (MUI): gap: 2 = 16px
   <Box sx={{ gap: 2 }}>
   
   // After (Tailwind): gap-4 = 16px (1rem)
   <div className="gap-4">
   ```

2. Use the spacing conversion table:
   | MUI | Tailwind | Pixels |
   |-----|----------|--------|
   | 1   | 2        | 8px    |
   | 2   | 4        | 16px   |
   | 3   | 6        | 24px   |
   | 4   | 8        | 32px   |

### 3. Component Functionality Issues

#### Issue: Form validation not working
**Symptoms:** Form validation errors not displaying or validation logic broken.

**Cause:** Form structure changed with new components.

**Solution:**
1. Update form error handling:
   ```tsx
   // Before
   <TextField
     error={!!errors.email}
     helperText={errors.email?.message}
   />
   
   // After
   <div className="space-y-2">
     <Input className={errors.email ? 'border-destructive' : ''} />
     {errors.email && (
       <p className="text-sm text-destructive">{errors.email.message}</p>
     )}
   </div>
   ```

2. Ensure react-hook-form integration:
   ```tsx
   const { register, formState: { errors } } = useForm();
   
   <Input {...register('email')} />
   ```

#### Issue: Data table functionality missing
**Symptoms:** Sorting, filtering, or pagination not working.

**Cause:** MUI DataGrid replaced with TanStack Table.

**Solution:**
1. Implement TanStack Table features:
   ```tsx
   import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';
   
   const table = useReactTable({
     data,
     columns,
     getCoreRowModel: getCoreRowModel(),
     getSortedRowModel: getSortedRowModel(),
   });
   ```

2. Add sorting functionality:
   ```tsx
   <TableHead onClick={() => column.toggleSorting()}>
     {header}
     {column.getIsSorted() && (
       <span>{column.getIsSorted() === 'desc' ? ' ↓' : ' ↑'}</span>
     )}
   </TableHead>
   ```

#### Issue: Date picker not working
**Symptoms:** Date picker not opening or dates not being selected.

**Cause:** MUI DatePicker replaced with react-day-picker.

**Solution:**
1. Use the new DatePicker component:
   ```tsx
   import { DatePicker } from '@/components/ui/date-picker';
   
   <DatePicker
     date={date}
     onDateChange={setDate}
     placeholder="Select date"
   />
   ```

2. Handle date formatting:
   ```tsx
   import { format } from 'date-fns';
   
   const formattedDate = date ? format(date, 'PPP') : 'Pick a date';
   ```

### 4. Icon Issues

#### Issue: Icons not displaying
**Symptoms:** Icons appear as empty spaces or broken.

**Cause:** MUI icons not replaced with Lucide equivalents.

**Solution:**
1. Replace MUI icon imports:
   ```tsx
   // Before
   import AddIcon from '@mui/icons-material/Add';
   
   // After
   import { Plus } from 'lucide-react';
   ```

2. Update icon usage:
   ```tsx
   // Before
   <AddIcon />
   
   // After
   <Plus className="h-4 w-4" />
   ```

3. Use the icon mapping guide:
   | MUI Icon | Lucide Equivalent |
   |----------|------------------|
   | AddIcon | Plus |
   | DeleteIcon | Trash2 |
   | EditIcon | Edit |
   | VisibilityIcon | Eye |

#### Issue: Icon sizes inconsistent
**Symptoms:** Icons appear too large or too small.

**Cause:** Different sizing systems between MUI and Lucide.

**Solution:**
1. Use consistent sizing classes:
   ```tsx
   // Small icons
   <Icon className="h-4 w-4" />
   
   // Medium icons
   <Icon className="h-5 w-5" />
   
   // Large icons
   <Icon className="h-6 w-6" />
   ```

2. Match original sizes:
   ```tsx
   // MUI small
   <Icon fontSize="small" /> → <Icon className="h-4 w-4" />
   
   // MUI default
   <Icon /> → <Icon className="h-5 w-5" />
   
   // MUI large
   <Icon fontSize="large" /> → <Icon className="h-6 w-6" />
   ```

### 5. Performance Issues

#### Issue: Slow theme switching
**Symptoms:** Theme toggle takes longer than expected.

**Cause:** React re-renders during theme changes.

**Solution:**
1. Use direct DOM manipulation:
   ```tsx
   const toggleTheme = () => {
     const root = document.documentElement;
     const isDark = root.classList.contains('dark');
     root.classList.toggle('dark', !isDark);
     root.classList.toggle('light', isDark);
   };
   ```

2. Avoid triggering React re-renders:
   ```tsx
   // Don't do this
   const [theme, setTheme] = useState('light');
   
   // Do this instead
   const { toggle } = useThemeToggle();
   ```

#### Issue: Large bundle size
**Symptoms:** Application loads slowly due to large JavaScript bundle.

**Cause:** Unused dependencies or components not tree-shaken.

**Solution:**
1. Remove unused dependencies:
   ```bash
   npm uninstall @mui/material @mui/icons-material @emotion/react
   ```

2. Use dynamic imports for large components:
   ```tsx
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   ```

3. Analyze bundle size:
   ```bash
   npm run build
   npm run analyze
   ```

### 6. Accessibility Issues

#### Issue: Screen reader compatibility broken
**Symptoms:** Screen readers not announcing content correctly.

**Cause:** Missing ARIA attributes or semantic HTML.

**Solution:**
1. Ensure proper semantic HTML:
   ```tsx
   // Before
   <div onClick={handleClick}>Button</div>
   
   // After
   <button onClick={handleClick}>Button</button>
   ```

2. Add ARIA attributes:
   ```tsx
   <Button aria-label="Close dialog">
     <X className="h-4 w-4" />
   </Button>
   ```

3. Use Radix UI primitives for complex components:
   ```tsx
   import { Dialog, DialogContent } from '@/components/ui/dialog';
   ```

#### Issue: Keyboard navigation not working
**Symptoms:** Cannot navigate using keyboard.

**Cause:** Focus management not properly implemented.

**Solution:**
1. Ensure focusable elements:
   ```tsx
   <Button tabIndex={0}>Focusable Button</Button>
   ```

2. Implement focus trapping in dialogs:
   ```tsx
   <Dialog>
     <DialogContent>
       {/* Focus is automatically trapped */}
     </DialogContent>
   </Dialog>
   ```

## Debugging Tools

### 1. Development Tools

#### Theme Debugger
Add to your development environment:
```tsx
if (process.env.NODE_ENV === 'development') {
  window.debugTheme = {
    getCurrentTheme: () => localStorage.getItem('theme'),
    getResolvedTheme: () => document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    toggleTheme: () => {
      const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.remove(current);
      document.documentElement.classList.add(next);
    },
  };
}
```

#### Component Inspector
```tsx
// Add to components for debugging
const ComponentDebugger = ({ componentName, props }) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs">
      <strong>{componentName}</strong>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
};
```

### 2. Browser DevTools

#### CSS Variable Inspector
```javascript
// Run in browser console to inspect CSS variables
const root = document.documentElement;
const styles = getComputedStyle(root);
const cssVars = {};

for (let i = 0; i < styles.length; i++) {
  const name = styles[i];
  if (name.startsWith('--')) {
    cssVars[name] = styles.getPropertyValue(name);
  }
}

console.table(cssVars);
```

#### Theme Class Inspector
```javascript
// Check current theme classes
console.log('Theme classes:', document.documentElement.classList.toString());
console.log('Dark mode active:', document.documentElement.classList.contains('dark'));
```

### 3. Testing Utilities

#### Component Testing
```tsx
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

function renderWithTheme(ui, { theme = 'light' } = {}) {
  return render(
    <ThemeProvider defaultTheme={theme}>
      {ui}
    </ThemeProvider>
  );
}

// Test both themes
test('component renders in both themes', () => {
  const { rerender } = renderWithTheme(<MyComponent />);
  expect(screen.getByRole('button')).toBeInTheDocument();
  
  rerender(
    <ThemeProvider defaultTheme="dark">
      <MyComponent />
    </ThemeProvider>
  );
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

#### Visual Regression Testing
```typescript
// playwright test
test('visual regression test', async ({ page }) => {
  await page.goto('/component');
  
  // Test light theme
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });
  await expect(page).toHaveScreenshot('component-light.png');
  
  // Test dark theme
  await page.evaluate(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await expect(page).toHaveScreenshot('component-dark.png');
});
```

## Migration Validation Checklist

### Pre-Migration Validation
- [ ] All MUI components identified and mapped
- [ ] Custom theme configurations documented
- [ ] Test coverage for critical components
- [ ] Performance baseline established

### During Migration Validation
- [ ] No MUI imports remain in codebase
- [ ] All components render correctly
- [ ] Theme switching works properly
- [ ] Forms and validation function correctly
- [ ] Icons display properly
- [ ] Accessibility standards maintained

### Post-Migration Validation
- [ ] Build completes without errors
- [ ] All tests pass
- [ ] Visual regression tests pass
- [ ] Performance meets or exceeds baseline
- [ ] Accessibility audit passes
- [ ] Cross-browser compatibility verified

## Emergency Rollback Procedures

### Immediate Rollback (< 1 hour)
1. **Git Rollback:**
   ```bash
   git revert HEAD~n  # n = number of migration commits
   git push origin main
   ```

2. **Dependency Restoration:**
   ```bash
   npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
   ```

3. **Build Verification:**
   ```bash
   npm run build
   npm run test
   ```

### Partial Rollback
1. **Component-Level Rollback:**
   ```bash
   git checkout HEAD~n -- src/components/SpecificComponent.tsx
   ```

2. **Feature Flag Rollback:**
   ```tsx
   const USE_SHADCN = process.env.REACT_APP_USE_SHADCN === 'true';
   
   return USE_SHADCN ? <ShadcnComponent /> : <MuiComponent />;
   ```

### Gradual Rollback
1. **Restore individual files as needed**
2. **Update imports incrementally**
3. **Test each rollback step**
4. **Document issues for future reference**

## Getting Help

### Resources
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)
- [TanStack Table Documentation](https://tanstack.com/table/v8)

### Community Support
- [shadcn/ui GitHub Issues](https://github.com/shadcn-ui/ui/issues)
- [Tailwind CSS Discord](https://discord.gg/7NF8GNe)
- [Radix UI Discord](https://discord.gg/7Xb99uG)

### Internal Support
- Check project documentation in `/docs`
- Review migration guide and component usage examples
- Create GitHub issues for project-specific problems
- Consult with team members who completed similar migrations

Remember: Most migration issues are common and have established solutions. Always check documentation and existing issues before implementing custom fixes.
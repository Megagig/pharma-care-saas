import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { ThemeToggle } from '../../context/ThemeContext';
import { Card } from './card';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';

/**
 * Theme test component to verify the new theme system works correctly
 * This component demonstrates all theme features and can be used for testing
 */
export function ThemeTest() {
  const { theme, resolvedTheme, systemTheme, isDark, isLight, isSystem } =
    useTheme();

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Theme System Test</h1>
        <p className="text-muted-foreground">
          Testing the new optimized theme system with shadcn/ui components
        </p>
      </div>

      {/* Theme Status */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Theme Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Current Mode:</span>
            <Badge variant="outline" className="ml-2 capitalize">
              {theme}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Resolved Theme:</span>
            <Badge
              variant={isDark ? 'default' : 'secondary'}
              className="ml-2 capitalize"
            >
              {resolvedTheme}
            </Badge>
          </div>
          <div>
            <span className="font-medium">System Theme:</span>
            <Badge variant="outline" className="ml-2 capitalize">
              {systemTheme}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Toggle:</span>
            <ThemeToggle />
          </div>
        </div>
      </Card>

      {/* Color Palette Test */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Primary Colors */}
          <div className="space-y-2">
            <h3 className="font-medium">Primary</h3>
            <div className="bg-primary text-primary-foreground p-3 rounded text-sm">
              Primary
            </div>
            <div className="bg-secondary text-secondary-foreground p-3 rounded text-sm">
              Secondary
            </div>
          </div>

          {/* Status Colors */}
          <div className="space-y-2">
            <h3 className="font-medium">Status</h3>
            <div className="bg-success text-success-foreground p-3 rounded text-sm">
              Success
            </div>
            <div className="bg-warning text-warning-foreground p-3 rounded text-sm">
              Warning
            </div>
            <div className="bg-destructive text-destructive-foreground p-3 rounded text-sm">
              Error
            </div>
          </div>

          {/* Healthcare Colors */}
          <div className="space-y-2">
            <h3 className="font-medium">Healthcare</h3>
            <div className="bg-medical text-medical-foreground p-3 rounded text-sm">
              Medical
            </div>
            <div className="bg-clinical text-clinical-foreground p-3 rounded text-sm">
              Clinical
            </div>
            <div className="bg-pharmacy text-pharmacy-foreground p-3 rounded text-sm">
              Pharmacy
            </div>
          </div>

          {/* Surface Colors */}
          <div className="space-y-2">
            <h3 className="font-medium">Surfaces</h3>
            <div className="bg-card text-card-foreground border p-3 rounded text-sm">
              Card
            </div>
            <div className="bg-muted text-muted-foreground p-3 rounded text-sm">
              Muted
            </div>
            <div className="bg-accent text-accent-foreground p-3 rounded text-sm">
              Accent
            </div>
          </div>
        </div>
      </Card>

      {/* Component Test */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Component Test</h2>
        <div className="space-y-4">
          {/* Buttons */}
          <div className="space-y-2">
            <h3 className="font-medium">Buttons</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-2">
            <h3 className="font-medium">Inputs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Default input" />
              <Input placeholder="Disabled input" disabled />
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-2">
            <h3 className="font-medium">Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Theme Transition Test */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Theme Transition Test</h2>
        <p className="text-muted-foreground mb-4">
          Click the theme toggle above to test smooth transitions between light
          and dark modes. All elements should transition smoothly without
          flicker or lag.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="theme-card p-4">
            <h4 className="font-medium mb-2">Card with Transition</h4>
            <p className="text-sm text-muted-foreground">
              This card uses the theme-card utility class for consistent
              theming.
            </p>
          </div>
          <div className="bg-sidebar text-sidebar-foreground p-4 rounded border">
            <h4 className="font-medium mb-2">Sidebar Colors</h4>
            <p className="text-sm opacity-80">
              Testing sidebar-specific color variables.
            </p>
          </div>
          <div className="bg-popover text-popover-foreground border p-4 rounded">
            <h4 className="font-medium mb-2">Popover Colors</h4>
            <p className="text-sm opacity-80">
              Testing popover-specific color variables.
            </p>
          </div>
        </div>
      </Card>

      {/* Accessibility Test */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Accessibility Test</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Focus Indicators</h3>
            <div className="flex gap-2">
              <Button className="focus-ring">Focusable Button</Button>
              <Input
                placeholder="Focusable Input"
                className="focus-ring max-w-xs"
              />
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Color Contrast</h3>
            <p className="text-sm text-muted-foreground">
              All color combinations should meet WCAG 2.1 AA contrast
              requirements. Test with a color contrast analyzer to verify
              accessibility compliance.
            </p>
          </div>
        </div>
      </Card>

      {/* Performance Info */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Performance Features</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-success rounded-full"></span>
            Synchronous theme switching without component re-renders
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-success rounded-full"></span>
            CSS variable-based theming for optimal performance
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-success rounded-full"></span>
            Automatic system theme detection and monitoring
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-success rounded-full"></span>
            localStorage persistence for theme preferences
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-success rounded-full"></span>
            Smooth transitions with reduced motion support
          </li>
        </ul>
      </Card>
    </div>
  );
}

export default ThemeTest;

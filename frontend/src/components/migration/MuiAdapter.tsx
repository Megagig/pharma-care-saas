import React from 'react';
import { PropMapper, IconMapper } from '../../lib/migration-utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

/**
 * MuiAdapter - Temporary wrapper component for backward compatibility
 * 
 * This component provides a bridge between MUI components and shadcn/ui components
 * during the migration process. It allows gradual migration by accepting MUI-style
 * props and converting them to shadcn/ui equivalents.
 */

interface MuiAdapterProps {
  component: 'Button' | 'TextField' | 'Card' | 'Chip' | 'Typography';
  muiProps?: any;
  children?: React.ReactNode;
  className?: string;
}

export function MuiAdapter({ 
  component, 
  muiProps = {}, 
  children, 
  className 
}: MuiAdapterProps) {
  
  switch (component) {
    case 'Button': {
      const mappedProps = PropMapper.mapButtonProps(muiProps);
      return (
        <Button 
          {...mappedProps} 
          className={cn(mappedProps.className, className)}
        >
          {children || mappedProps.children}
        </Button>
      );
    }
    
    case 'TextField': {
      const mappedProps = PropMapper.mapInputProps(muiProps);
      return (
        <div className="space-y-2">
          {muiProps.label && (
            <label 
              htmlFor={muiProps.id} 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {muiProps.label}
            </label>
          )}
          <Input 
            {...mappedProps} 
            className={cn(mappedProps.className, className)}
          />
          {muiProps.helperText && (
            <p 
              id={`${muiProps.id}-helper`}
              className={cn(
                "text-sm",
                muiProps.error ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {muiProps.helperText}
            </p>
          )}
        </div>
      );
    }
    
    case 'Card': {
      const mappedProps = PropMapper.mapCardProps(muiProps);
      return (
        <Card className={cn(mappedProps.className, className)}>
          {children}
        </Card>
      );
    }
    
    case 'Chip': {
      const mappedProps = PropMapper.mapBadgeProps(muiProps);
      return (
        <Badge 
          {...mappedProps} 
          className={cn(mappedProps.className, className)}
        >
          {children || mappedProps.children}
        </Badge>
      );
    }
    
    case 'Typography': {
      const mappedProps = PropMapper.mapTypographyProps(muiProps);
      const Component = getTypographyComponent(muiProps.variant);
      
      return (
        <Component 
          className={cn(mappedProps.className, className)}
          {...mappedProps}
        >
          {children}
        </Component>
      );
    }
    
    default:
      console.warn(`MuiAdapter: Unsupported component type "${component}"`);
      return <div className={className}>{children}</div>;
  }
}

/**
 * Get the appropriate HTML element for Typography variants
 */
function getTypographyComponent(variant?: string): keyof JSX.IntrinsicElements {
  const componentMap: Record<string, keyof JSX.IntrinsicElements> = {
    'h1': 'h1',
    'h2': 'h2',
    'h3': 'h3',
    'h4': 'h4',
    'h5': 'h5',
    'h6': 'h6',
    'subtitle1': 'h6',
    'subtitle2': 'h6',
    'body1': 'p',
    'body2': 'p',
    'caption': 'span',
    'overline': 'span',
  };
  
  return componentMap[variant || 'body1'] || 'p';
}

/**
 * MuiIconAdapter - Adapter for MUI icons to Lucide icons
 */
interface MuiIconAdapterProps {
  iconName: string;
  className?: string;
  size?: number | string;
  color?: string;
}

export function MuiIconAdapter({ 
  iconName, 
  className, 
  size = 24, 
  color 
}: MuiIconAdapterProps) {
  const LucideIcon = IconMapper.getLucideIcon(iconName);
  
  if (!LucideIcon) {
    console.warn(`MuiIconAdapter: No Lucide equivalent found for "${iconName}"`);
    const suggestions = IconMapper.suggestAlternatives(iconName);
    if (suggestions.length > 0) {
      console.warn(`Suggestions: ${suggestions.join(', ')}`);
    }
    
    // Return a placeholder or fallback icon
    return (
      <div 
        className={cn("inline-flex items-center justify-center", className)}
        style={{ 
          width: typeof size === 'number' ? `${size}px` : size,
          height: typeof size === 'number' ? `${size}px` : size,
          color 
        }}
        title={`Missing icon: ${iconName}`}
      >
        ?
      </div>
    );
  }
  
  return (
    <LucideIcon 
      className={className}
      size={typeof size === 'string' ? undefined : size}
      color={color}
      style={typeof size === 'string' ? { width: size, height: size } : undefined}
    />
  );
}

/**
 * MuiThemeAdapter - Provides MUI-like theme values for gradual migration
 */
export const MuiThemeAdapter = {
  palette: {
    primary: {
      main: 'hsl(var(--primary))',
      contrastText: 'hsl(var(--primary-foreground))',
    },
    secondary: {
      main: 'hsl(var(--secondary))',
      contrastText: 'hsl(var(--secondary-foreground))',
    },
    error: {
      main: 'hsl(var(--destructive))',
      contrastText: 'hsl(var(--destructive-foreground))',
    },
    warning: {
      main: 'hsl(var(--warning))',
      contrastText: 'hsl(var(--warning-foreground))',
    },
    info: {
      main: 'hsl(var(--info))',
      contrastText: 'hsl(var(--info-foreground))',
    },
    success: {
      main: 'hsl(var(--success))',
      contrastText: 'hsl(var(--success-foreground))',
    },
    background: {
      default: 'hsl(var(--background))',
      paper: 'hsl(var(--card))',
    },
    text: {
      primary: 'hsl(var(--foreground))',
      secondary: 'hsl(var(--muted-foreground))',
    },
  },
  spacing: (factor: number) => `${factor * 0.25}rem`, // 4px base unit like MUI
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
  typography: {
    h1: 'text-4xl font-bold',
    h2: 'text-3xl font-bold',
    h3: 'text-2xl font-bold',
    h4: 'text-xl font-bold',
    h5: 'text-lg font-bold',
    h6: 'text-base font-bold',
    subtitle1: 'text-lg font-medium',
    subtitle2: 'text-base font-medium',
    body1: 'text-base',
    body2: 'text-sm',
    caption: 'text-xs',
    overline: 'text-xs uppercase tracking-wide',
  },
};

/**
 * Hook for accessing MUI-like theme values during migration
 */
export function useMuiTheme() {
  return MuiThemeAdapter;
}

/**
 * Utility component for gradual migration warnings
 */
interface MigrationWarningProps {
  componentName: string;
  muiProps?: string[];
  suggestedShadcnProps?: string[];
  children?: React.ReactNode;
}

export function MigrationWarning({ 
  componentName, 
  muiProps = [], 
  suggestedShadcnProps = [],
  children 
}: MigrationWarningProps) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔄 Migration Warning: ${componentName}`);
      console.warn(`Component "${componentName}" is using MuiAdapter for backward compatibility.`);
      
      if (muiProps.length > 0) {
        console.warn('MUI props detected:', muiProps);
      }
      
      if (suggestedShadcnProps.length > 0) {
        console.info('Suggested shadcn/ui props:', suggestedShadcnProps);
      }
      
      console.warn('Consider migrating to native shadcn/ui components for better performance.');
      console.groupEnd();
    }
  }, [componentName, muiProps, suggestedShadcnProps]);
  
  return <>{children}</>;
}

/**
 * Higher-order component for wrapping components during migration
 */
export function withMigrationSupport<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function MigrationSupportedComponent(props: P) {
    return (
      <MigrationWarning componentName={componentName}>
        <WrappedComponent {...props} />
      </MigrationWarning>
    );
  };
}

export default MuiAdapter;
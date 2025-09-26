import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeToggle, ThemeMode } from '@/hooks/useThemeToggle';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'dropdown';
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  size = 'md',
  variant = 'button',
  className = ''
}) => {
  const { theme, setTheme, toggle, resolvedTheme } = useThemeToggle();

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const getThemeIcon = (themeMode: ThemeMode) => {
    const iconSize = iconSizes[size];
    switch (themeMode) {
      case 'light':
        return <Sun size={iconSize} />;
      case 'dark':
        return <Moon size={iconSize} />;
      case 'system':
        return <Monitor size={iconSize} />;
      default:
        return <Sun size={iconSize} />;
    }
  };

  const getThemeLabel = (themeMode: ThemeMode) => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Light';
    }
  };

  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block ${className}`}>
        <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {(['light', 'dark', 'system'] as ThemeMode[]).map((themeMode) => (
            <button
              key={themeMode}
              onClick={() => setTheme(themeMode)}
              className={`
                ${sizeClasses[size]}
                flex items-center justify-center rounded-md transition-all duration-200
                ${theme === themeMode
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }
                hover:bg-white/50 dark:hover:bg-gray-700/50
              `}
              title={`Switch to ${getThemeLabel(themeMode)} mode`}
              aria-label={`Switch to ${getThemeLabel(themeMode)} mode`}
            >
              {getThemeIcon(themeMode)}
            </button>
          ))}
        </div>
        {showLabel && (
          <span className="mt-1 text-xs text-center block text-gray-600 dark:text-gray-300">
            {getThemeLabel(theme)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <button
        onClick={() => {
          if (process.env.NODE_ENV === 'development') {
            const { measureThemeTogglePerformance } = require('@/hooks/useThemeToggle');
            measureThemeTogglePerformance(toggle);
          } else {
            toggle();
          }
        }}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center rounded-lg transition-all duration-200
          bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
          text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white
          border border-gray-200 dark:border-gray-600
          focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
          focus:ring-offset-2 dark:focus:ring-offset-gray-900
          shadow-sm hover:shadow-md
        `}
        title={`Current: ${getThemeLabel(theme)} (click to toggle)`}
        aria-label={`Current theme: ${getThemeLabel(
          theme
        )}. Click to cycle through themes.`}
      >
        <span className="relative">
          {getThemeIcon(theme)}
          {/* Small indicator dot for resolved theme when in system mode */}
          {theme === 'system' && (
            <span
              className={`
                absolute -bottom-1 -right-1 w-2 h-2 rounded-full
                ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-yellow-400'}
                border border-white dark:border-gray-800
              `}
              title={`System preference: ${resolvedTheme}`}
            />
          )}
        </span>
      </button>
      {showLabel && (
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          {getThemeLabel(theme)}
          {theme === 'system' && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              ({resolvedTheme})
            </span>
          )}
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;

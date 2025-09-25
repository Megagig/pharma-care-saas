/**
 * Migration utilities and components for MUI to shadcn/ui transition
 * 
 * This module provides utilities and components to help with the gradual
 * migration from Material-UI to shadcn/ui components.
 */

export { 
  MuiAdapter, 
  MuiIconAdapter, 
  MuiThemeAdapter, 
  useMuiTheme,
  MigrationWarning,
  withMigrationSupport 
} from './MuiAdapter';

export {
  IconMapper,
  PropMapper,
  MigrationTracker,
  MigrationUtils,
  MUI_TO_LUCIDE_ICON_MAP
} from '../../lib/migration-utils';

// Re-export commonly used migration functions
export const {
  getLucideIcon,
  hasMapping: hasIconMapping,
  suggestAlternatives: suggestIconAlternatives
} = IconMapper;

export const {
  mapButtonProps,
  mapInputProps,
  mapCardProps,
  mapBadgeProps,
  mapTypographyProps
} = PropMapper;

export const {
  trackComponent,
  getProgress: getMigrationProgress,
  getStats: getMigrationStats,
  clearProgress: clearMigrationProgress
} = MigrationTracker;

export const {
  sxToTailwind,
  generateComponentReport,
  validateMigration
} = MigrationUtils;
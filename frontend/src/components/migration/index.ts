/**
 * Migration utilities and components for MUI to shadcn/ui transition
 * 
 * This module provides utilities and components to help with the gradual
 * migration from Material-UI to shadcn/ui components.
 */

// Removed broken export
  useMuiTheme,
  withMigrationSupport 

// Removed broken export
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
import { useTheme, useMediaQuery } from '@mui/material';
import { Breakpoint } from '@mui/material/styles';

/**
 * Hook for responsive design utilities
 */
export const useResponsive = () => {
  const theme = useTheme();

  // Breakpoint queries
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeMobile = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Pre-computed breakpoint queries to avoid hooks in helper functions
  const breakpointQueries = {
    xs: useMediaQuery(theme.breakpoints.up('xs')),
    sm: useMediaQuery(theme.breakpoints.up('sm')),
    md: useMediaQuery(theme.breakpoints.up('md')),
    lg: useMediaQuery(theme.breakpoints.up('lg')),
    xl: useMediaQuery(theme.breakpoints.up('xl')),
    down_xs: useMediaQuery(theme.breakpoints.down('xs')),
    down_sm: useMediaQuery(theme.breakpoints.down('sm')),
    down_md: useMediaQuery(theme.breakpoints.down('md')),
    down_lg: useMediaQuery(theme.breakpoints.down('lg')),
    down_xl: useMediaQuery(theme.breakpoints.down('xl')),
  };

  // Helper functions that use pre-computed queries
  const isUp = (breakpoint: Breakpoint) => {
    return breakpointQueries[breakpoint] || false;
  };

  const isDown = (breakpoint: Breakpoint) => {
    return breakpointQueries[`down_${breakpoint}` as keyof typeof breakpointQueries] || false;
  };

  const isBetween = (start: Breakpoint, end: Breakpoint) => {
    return isUp(start) && isDown(end);
  };

  // Screen size categories
  const screenSize = (() => {
    if (isSmallMobile) return 'xs';
    if (isLargeMobile) return 'sm';
    if (isTablet) return 'md';
    if (isDesktop) return 'lg';
    return 'xl';
  })();

  // Responsive column counts
  const getColumns = (xs = 1, sm = 2, md = 3, lg = 4, xl = 5) => {
    if (isSmallMobile) return xs;
    if (isLargeMobile) return sm;
    if (isTablet) return md;
    if (isDesktop) return lg;
    return xl;
  };

  // Responsive spacing
  const getSpacing = (mobile = 1, tablet = 2, desktop = 3) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  // Responsive font sizes
  const getFontSize = (
    mobile = '0.875rem',
    tablet = '1rem',
    desktop = '1.125rem'
  ) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  // Dialog size based on screen
  const getDialogMaxWidth = (
    mobile: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false = 'sm',
    tablet: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false = 'md',
    desktop: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false = 'lg'
  ) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  // Table display mode
  const shouldUseCardLayout = isMobile;
  const shouldCollapseSidebar = isMobile;
  const shouldShowCompactHeader = isMobile;

  return {
    // Breakpoint booleans
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    isLargeMobile,

    // Breakpoint functions
    isUp,
    isDown,
    isBetween,

    // Screen size
    screenSize,

    // Responsive helpers
    getColumns,
    getSpacing,
    getFontSize,
    getDialogMaxWidth,

    // Layout decisions
    shouldUseCardLayout,
    shouldCollapseSidebar,
    shouldShowCompactHeader,

    // Theme reference
    theme,
  };
};

/**
 * Hook for responsive table/list switching
 */
export const useResponsiveList = () => {
  const { isMobile } = useResponsive();

  return {
    useCardLayout: isMobile,
    useTableLayout: !isMobile,
  };
};

/**
 * Hook for responsive dialog sizing
 */
export const useResponsiveDialog = () => {
  const { getDialogMaxWidth, isMobile } = useResponsive();

  return {
    maxWidth: getDialogMaxWidth('xs', 'sm', 'md'),
    fullScreen: isMobile,
    PaperProps: {
      sx: {
        ...(isMobile && {
          margin: 0,
          width: '100%',
          maxHeight: '100%',
          borderRadius: 0,
        }),
      },
    },
  };
};

/**
 * Hook for responsive grid layouts
 */
export const useResponsiveGrid = () => {
  const { getColumns, getSpacing } = useResponsive();

  const getGridProps = (
    cols = { xs: 1, sm: 2, md: 3, lg: 4 },
    spacing = { mobile: 1, tablet: 2, desktop: 3 }
  ) => ({
    container: true,
    spacing: getSpacing(spacing.mobile, spacing.tablet, spacing.desktop),
    columns: {
      xs: cols.xs,
      sm: cols.sm,
      md: cols.md,
      lg: cols.lg,
    },
  });

  return {
    getGridProps,
    getColumns,
    spacing: getSpacing(),
  };
};

export default useResponsive;

import { useState, useEffect } from 'react';

interface ThemeBreakpoints {
  down: (breakpoint: string) => boolean;
  up: (breakpoint: string) => boolean;
  between: (start: string, end: string) => boolean;
}

interface UseThemeReturn {
  breakpoints: ThemeBreakpoints;
}

const breakpointValues = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const useTheme = (): UseThemeReturn => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const breakpoints: ThemeBreakpoints = {
    down: (breakpoint: string) => {
      const value = breakpointValues[breakpoint as keyof typeof breakpointValues];
      return windowWidth < value;
    },
    up: (breakpoint: string) => {
      const value = breakpointValues[breakpoint as keyof typeof breakpointValues];
      return windowWidth >= value;
    },
    between: (start: string, end: string) => {
      const startValue = breakpointValues[start as keyof typeof breakpointValues];
      const endValue = breakpointValues[end as keyof typeof breakpointValues];
      return windowWidth >= startValue && windowWidth < endValue;
    },
  };

  return { breakpoints };
};

export const useMediaQuery = (query: boolean): boolean => {
  return query;
};

export default useTheme;
/**
 * Theme performance testing and optimization utilities
 */

interface PerformanceMetrics {
  toggleTime: number;
  renderTime: number;
  domUpdateTime: number;
  totalTime: number;
  frameDrops: number;
}

interface ThemePerformanceTest {
  run: () => Promise<PerformanceMetrics>;
  validate: (metrics: PerformanceMetrics) => boolean;
  report: (metrics: PerformanceMetrics) => void;
}

/**
 * Measure theme toggle performance with high precision
 */
export const createThemePerformanceTest = (
  toggleFunction: () => void
): ThemePerformanceTest => {
  return {
    async run(): Promise<PerformanceMetrics> {
      const metrics: PerformanceMetrics = {
        toggleTime: 0,
        renderTime: 0,
        domUpdateTime: 0,
        totalTime: 0,
        frameDrops: 0,
      };

      // Measure DOM update time
      const domStart = performance.now();
      
      // Use requestAnimationFrame to measure actual render time
      let frameCount = 0;
      let lastFrameTime = performance.now();
      const frameDropThreshold = 16.67; // 60fps threshold
      
      const measureFrame = () => {
        const currentTime = performance.now();
        const frameDuration = currentTime - lastFrameTime;
        
        if (frameDuration > frameDropThreshold) {
          metrics.frameDrops++;
        }
        
        frameCount++;
        lastFrameTime = currentTime;
        
        if (frameCount < 5) {
          requestAnimationFrame(measureFrame);
        } else {
          metrics.renderTime = currentTime - domStart;
        }
      };

      // Start measuring
      const totalStart = performance.now();
      
      // Execute the toggle function
      const toggleStart = performance.now();
      toggleFunction();
      const toggleEnd = performance.now();
      
      metrics.toggleTime = toggleEnd - toggleStart;
      metrics.domUpdateTime = toggleEnd - domStart;
      
      // Measure render time
      requestAnimationFrame(measureFrame);
      
      // Wait for render measurement to complete
      await new Promise(resolve => {
        const checkComplete = () => {
          if (frameCount >= 5) {
            metrics.totalTime = performance.now() - totalStart;
            resolve(void 0);
          } else {
            setTimeout(checkComplete, 1);
          }
        };
        checkComplete();
      });

      return metrics;
    },

    validate(metrics: PerformanceMetrics): boolean {
      const requirements = {
        maxToggleTime: 16, // 1 frame at 60fps
        maxTotalTime: 50, // Reasonable total time
        maxFrameDrops: 1, // Allow minimal frame drops
      };

      return (
        metrics.toggleTime <= requirements.maxToggleTime &&
        metrics.totalTime <= requirements.maxTotalTime &&
        metrics.frameDrops <= requirements.maxFrameDrops
      );
    },

    report(metrics: PerformanceMetrics): void {
      const passed = this.validate(metrics);
      
      console.group(`🎨 Theme Toggle Performance Report`);
      console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`Toggle Time: ${metrics.toggleTime.toFixed(2)}ms`);
      console.log(`DOM Update Time: ${metrics.domUpdateTime.toFixed(2)}ms`);
      console.log(`Render Time: ${metrics.renderTime.toFixed(2)}ms`);
      console.log(`Total Time: ${metrics.totalTime.toFixed(2)}ms`);
      console.log(`Frame Drops: ${metrics.frameDrops}`);
      
      if (!passed) {
        console.warn('⚠️ Performance requirements not met:');
        if (metrics.toggleTime > 16) {
          console.warn(`  - Toggle time (${metrics.toggleTime.toFixed(2)}ms) exceeds 16ms target`);
        }
        if (metrics.totalTime > 50) {
          console.warn(`  - Total time (${metrics.totalTime.toFixed(2)}ms) exceeds 50ms target`);
        }
        if (metrics.frameDrops > 1) {
          console.warn(`  - Frame drops (${metrics.frameDrops}) exceed 1 frame target`);
        }
      }
      
      console.groupEnd();
    },
  };
};

/**
 * Optimize DOM for theme switching performance
 */
export const optimizeThemeSwitch = (): (() => void) => {
  const root = document.documentElement;
  
  // Temporarily disable transitions for instant switching
  root.classList.add('theme-switching');
  
  // Return cleanup function
  return () => {
    // Re-enable transitions after a frame
    requestAnimationFrame(() => {
      root.classList.remove('theme-switching');
    });
  };
};

/**
 * Batch DOM operations for better performance
 */
export const batchDOMUpdates = (operations: (() => void)[]): void => {
  // Use requestAnimationFrame to batch DOM updates
  requestAnimationFrame(() => {
    operations.forEach(op => op());
  });
};

/**
 * Monitor theme performance in development
 */
export const setupThemePerformanceMonitoring = (
  toggleFunction: () => void
): void => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const test = createThemePerformanceTest(toggleFunction);
  
  // Add global function for manual testing
  (window as any).__testThemePerformance = async () => {
    const metrics = await test.run();
    test.report(metrics);
    return metrics;
  };

  console.log('🎨 Theme performance monitoring enabled');
  console.log('Run __testThemePerformance() in console to test performance');
};

/**
 * CSS-in-JS performance optimization
 * Precompute common theme-dependent styles
 */
export const precomputeThemeStyles = () => {
  const styles = {
    light: {
      background: 'hsl(0 0% 100%)',
      foreground: 'hsl(222.2 84% 4.9%)',
      card: 'hsl(0 0% 100%)',
      cardForeground: 'hsl(222.2 84% 4.9%)',
      primary: 'hsl(221.2 83.2% 53.3%)',
      primaryForeground: 'hsl(210 40% 98%)',
    },
    dark: {
      background: 'hsl(222.2 84% 4.9%)',
      foreground: 'hsl(210 40% 98%)',
      card: 'hsl(222.2 84% 4.9%)',
      cardForeground: 'hsl(210 40% 98%)',
      primary: 'hsl(217.2 91.2% 59.8%)',
      primaryForeground: 'hsl(222.2 84% 4.9%)',
    },
  };

  // Cache styles for quick access
  (window as any).__themeStyles = styles;
  
  return styles;
};

// Initialize precomputed styles
precomputeThemeStyles();
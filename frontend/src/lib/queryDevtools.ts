/**
 * React Query DevTools configuration and performance monitoring
 */

import { QueryClient } from '@tanstack/react-query';
import { QueryPerformanceMonitor } from './queryConfig';

// ===============================
// DEVTOOLS CONFIGURATION
// ===============================

export const devtoolsConfig = {
  initialIsOpen: false,
  position: 'bottom-right' as const,
  panelProps: {
    style: {
      zIndex: 99999,
    },
  },
  closeButtonProps: {
    style: {
      color: '#fff',
    },
  },
  toggleButtonProps: {
    style: {
      backgroundColor: '#0066cc',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 12px',
      fontSize: '12px',
      fontWeight: 'bold',
    },
  },
};

// ===============================
// QUERY PERFORMANCE TRACKING
// ===============================

/**
 * Enhanced query client with performance monitoring
 */
export function createMonitoredQueryClient(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Performance monitoring wrapper
        queryFn: async (context) => {
          const startTime = performance.now();
          const queryKey = JSON.stringify(context.queryKey);
          
          try {
            // Execute the original query function
            const result = await (context as any).originalQueryFn(context);
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Record performance metrics
            QueryPerformanceMonitor.recordQueryTime(queryKey, duration);
            
            // Log slow queries in development
            if (process.env.NODE_ENV === 'development' && duration > 1000) {
              console.warn(`Slow query detected (${duration.toFixed(2)}ms):`, context.queryKey);
            }
            
            return result;
          } catch (error) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Record failed query metrics
            QueryPerformanceMonitor.recordQueryTime(`${queryKey}_error`, duration);
            
            throw error;
          }
        },
        
        // Other default options...
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
        keepPreviousData: true,
        networkMode: 'offlineFirst',
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
        networkMode: 'online',
      },
    },
  });

  // Add global error handler
  queryClient.setMutationDefaults(['mutation'], {
    onError: (error, variables, context) => {
      console.error('Mutation error:', error, { variables, context });
    },
  });

  return queryClient;
}

// ===============================
// DEVELOPMENT UTILITIES
// ===============================

/**
 * Development utilities for query debugging
 */
export class QueryDebugger {
  private static queryClient: QueryClient;

  static init(client: QueryClient): void {
    this.queryClient = client;
    
    if (process.env.NODE_ENV === 'development') {
      // Add global query debugging
      (window as any).queryDebugger = this;
      
      // Log query cache changes
      this.setupCacheLogging();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
    }
  }

  /**
   * Get all cached queries
   */
  static getCachedQueries(): any[] {
    return this.queryClient.getQueryCache().getAll();
  }

  /**
   * Get query by key
   */
  static getQuery(queryKey: any[]): any {
    return this.queryClient.getQueryCache().find(queryKey);
  }

  /**
   * Clear specific query
   */
  static clearQuery(queryKey: any[]): void {
    this.queryClient.removeQueries(queryKey);
  }

  /**
   * Clear all queries
   */
  static clearAllQueries(): void {
    this.queryClient.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    totalQueries: number;
    activeQueries: number;
    staleQueries: number;
    errorQueries: number;
    cacheSize: number;
  } {
    const queries = this.getCachedQueries();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.state.status === 'success' && !q.isStale()).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      cacheSize: this.estimateCacheSize(queries),
    };
  }

  /**
   * Get performance statistics
   */
  static getPerformanceStats(): Record<string, any> {
    return QueryPerformanceMonitor.getAllStats();
  }

  /**
   * Log slow queries
   */
  static getSlowQueries(threshold: number = 1000): any[] {
    const stats = this.getPerformanceStats();
    
    return Object.entries(stats)
      .filter(([_, stat]) => stat && stat.average > threshold)
      .map(([queryKey, stat]) => ({ queryKey, ...stat }))
      .sort((a, b) => b.average - a.average);
  }

  /**
   * Setup cache logging for development
   */
  private static setupCacheLogging(): void {
    const cache = this.queryClient.getQueryCache();
    
    cache.subscribe((event) => {
      if (event.type === 'added') {
        console.log('Query added to cache:', event.query.queryKey);
      } else if (event.type === 'removed') {
        console.log('Query removed from cache:', event.query.queryKey);
      } else if (event.type === 'updated') {
        const query = event.query;
        if (query.state.status === 'error') {
          console.error('Query error:', query.queryKey, query.state.error);
        }
      }
    });
  }

  /**
   * Setup performance monitoring
   */
  private static setupPerformanceMonitoring(): void {
    // Monitor query performance every 30 seconds
    setInterval(() => {
      const slowQueries = this.getSlowQueries(500); // 500ms threshold
      
      if (slowQueries.length > 0) {
        console.group('Slow Queries Detected');
        slowQueries.forEach(query => {
          console.warn(`${query.queryKey}: avg ${query.average.toFixed(2)}ms, max ${query.max.toFixed(2)}ms`);
        });
        console.groupEnd();
      }
    }, 30000);

    // Monitor cache size
    setInterval(() => {
      const stats = this.getCacheStats();
      
      if (stats.totalQueries > 100) {
        console.warn('Large query cache detected:', stats);
      }
    }, 60000);
  }

  /**
   * Estimate cache size in bytes
   */
  private static estimateCacheSize(queries: any[]): number {
    let totalSize = 0;
    
    queries.forEach(query => {
      try {
        const dataString = JSON.stringify(query.state.data);
        totalSize += dataString.length * 2; // Rough estimate (UTF-16)
      } catch (error) {
        // Skip queries with non-serializable data
      }
    });
    
    return totalSize;
  }
}

// ===============================
// QUERY INSPECTOR COMPONENT
// ===============================

/**
 * Custom query inspector for development
 */
export const QueryInspector = {
  /**
   * Create a query inspector panel
   */
  createPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'query-inspector';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      max-height: 400px;
      background: #1a1a1a;
      color: #fff;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 16px;
      font-family: monospace;
      font-size: 12px;
      z-index: 99999;
      overflow-y: auto;
      display: none;
    `;

    this.updatePanel(panel);
    
    // Update panel every 5 seconds
    setInterval(() => this.updatePanel(panel), 5000);
    
    return panel;
  },

  /**
   * Update inspector panel content
   */
  updatePanel(panel: HTMLElement): void {
    const stats = QueryDebugger.getCacheStats();
    const perfStats = QueryDebugger.getPerformanceStats();
    const slowQueries = QueryDebugger.getSlowQueries(500);

    panel.innerHTML = `
      <h3 style="margin: 0 0 12px 0; color: #0066cc;">Query Inspector</h3>
      
      <div style="margin-bottom: 12px;">
        <strong>Cache Stats:</strong><br>
        Total: ${stats.totalQueries}<br>
        Active: ${stats.activeQueries}<br>
        Stale: ${stats.staleQueries}<br>
        Errors: ${stats.errorQueries}<br>
        Size: ${(stats.cacheSize / 1024).toFixed(1)}KB
      </div>

      <div style="margin-bottom: 12px;">
        <strong>Performance:</strong><br>
        Tracked Queries: ${Object.keys(perfStats).length}<br>
        Slow Queries: ${slowQueries.length}
      </div>

      ${slowQueries.length > 0 ? `
        <div>
          <strong>Slow Queries:</strong><br>
          ${slowQueries.slice(0, 3).map(q => 
            `${q.queryKey.substring(0, 30)}...: ${q.average.toFixed(0)}ms`
          ).join('<br>')}
        </div>
      ` : ''}
    `;
  },

  /**
   * Toggle inspector visibility
   */
  toggle(): void {
    const panel = document.getElementById('query-inspector');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  },
};

// ===============================
// INITIALIZATION
// ===============================

/**
 * Initialize development tools
 */
export function initializeQueryDevtools(queryClient: QueryClient): void {
  if (process.env.NODE_ENV === 'development') {
    // Initialize debugger
    QueryDebugger.init(queryClient);
    
    // Create inspector panel
    const panel = QueryInspector.createPanel();
    document.body.appendChild(panel);
    
    // Add keyboard shortcut to toggle inspector
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'Q') {
        QueryInspector.toggle();
      }
    });

    console.log('Query DevTools initialized. Press Ctrl+Shift+Q to toggle inspector.');
  }
}
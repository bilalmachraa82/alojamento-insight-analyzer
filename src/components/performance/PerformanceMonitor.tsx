import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useWebVitals, type Metric } from '@/hooks/useWebVitals';

/**
 * PerformanceMonitor Component
 *
 * A non-visual component that monitors Core Web Vitals and route changes.
 * This component:
 * - Tracks all Core Web Vitals metrics (LCP, INP, CLS, FCP, TTFB)
 * - Monitors route changes and performance per route
 * - Logs performance data in development
 * - Sends metrics to Google Analytics and Sentry in production
 * - Provides console warnings for poor metrics in development
 *
 * Usage:
 * ```tsx
 * <PerformanceMonitor />
 * ```
 */

interface RoutePerformance {
  path: string;
  timestamp: number;
  metrics: Partial<Record<string, number>>;
}

const PerformanceMonitor: React.FC = () => {
  const location = useLocation();
  const previousPath = useRef<string>('');
  const routeStartTime = useRef<number>(Date.now());
  const routeMetrics = useRef<RoutePerformance[]>([]);
  const isDevelopment = import.meta.env.MODE === 'development';

  // Track Web Vitals with custom callback for route-specific metrics
  useWebVitals({
    debug: isDevelopment,
    onMetric: (metric: Metric) => {
      // Store metric for current route
      const currentRoute = routeMetrics.current[routeMetrics.current.length - 1];
      if (currentRoute) {
        currentRoute.metrics[metric.name] = metric.value;
      }

      // Log to console in development
      if (isDevelopment) {
        const timeOnRoute = Date.now() - routeStartTime.current;
        console.log(
          `[Performance] ${metric.name} on ${location.pathname}: ${metric.value} (${timeOnRoute}ms since route change)`
        );
      }
    },
  });

  // Track route changes
  useEffect(() => {
    const currentPath = location.pathname;

    // Skip if same route (e.g., query param changes)
    if (previousPath.current === currentPath) {
      return;
    }

    const now = Date.now();
    const timeOnPreviousRoute = previousPath.current
      ? now - routeStartTime.current
      : 0;

    // Log previous route performance in development
    if (isDevelopment && previousPath.current) {
      console.log(
        `[Performance] Route change: ${previousPath.current} -> ${currentPath}`
      );
      console.log(
        `[Performance] Time on previous route: ${timeOnPreviousRoute}ms`
      );

      // Log collected metrics for previous route
      const previousRoute = routeMetrics.current[routeMetrics.current.length - 1];
      if (previousRoute && Object.keys(previousRoute.metrics).length > 0) {
        console.log(`[Performance] Metrics for ${previousPath.current}:`, previousRoute.metrics);
      }
    }

    // Record new route
    routeMetrics.current.push({
      path: currentPath,
      timestamp: now,
      metrics: {},
    });

    // Keep only last 10 routes in memory
    if (routeMetrics.current.length > 10) {
      routeMetrics.current.shift();
    }

    // Update refs
    previousPath.current = currentPath;
    routeStartTime.current = now;

    // Track route change in analytics
    if (typeof window !== 'undefined') {
      try {
        // Send route timing to analytics
        import('@/config/analytics').then(({ trackPageView }) => {
          trackPageView(currentPath, document.title);
        });
      } catch (error) {
        console.error('[Performance] Failed to track route change:', error);
      }
    }
  }, [location.pathname, isDevelopment]);

  // Report performance data on page unload (production only)
  useEffect(() => {
    if (isDevelopment) {
      return;
    }

    const handleBeforeUnload = () => {
      // Send any remaining metrics
      if (routeMetrics.current.length > 0) {
        const metrics = routeMetrics.current[routeMetrics.current.length - 1];
        if (Object.keys(metrics.metrics).length > 0) {
          // Use sendBeacon for reliable delivery during unload
          navigator.sendBeacon?.(
            '/api/performance',
            JSON.stringify({
              path: metrics.path,
              metrics: metrics.metrics,
              timestamp: metrics.timestamp,
            })
          );
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDevelopment]);

  // Log performance API data in development
  useEffect(() => {
    if (!isDevelopment) {
      return;
    }

    // Wait for performance data to be available
    const timer = setTimeout(() => {
      if (typeof window === 'undefined' || !window.performance) {
        return;
      }

      try {
        const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        if (perfData) {
          console.group('[Performance] Navigation Timing');
          console.log('DNS:', Math.round(perfData.domainLookupEnd - perfData.domainLookupStart), 'ms');
          console.log('TCP:', Math.round(perfData.connectEnd - perfData.connectStart), 'ms');
          console.log('Request:', Math.round(perfData.responseStart - perfData.requestStart), 'ms');
          console.log('Response:', Math.round(perfData.responseEnd - perfData.responseStart), 'ms');
          console.log('DOM Processing:', Math.round(perfData.domComplete - perfData.domInteractive), 'ms');
          console.log('Load Complete:', Math.round(perfData.loadEventEnd - perfData.loadEventStart), 'ms');
          console.log('Total:', Math.round(perfData.loadEventEnd - perfData.fetchStart), 'ms');
          console.groupEnd();
        }

        // Log resource timing
        const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const slowResources = resources
          .filter((r) => r.duration > 1000) // Resources taking > 1s
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5);

        if (slowResources.length > 0) {
          console.group('[Performance] Slow Resources (>1s)');
          slowResources.forEach((resource) => {
            console.log(
              `${resource.name.split('/').pop()}: ${Math.round(resource.duration)}ms`
            );
          });
          console.groupEnd();
        }

        // Log memory usage (if available)
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          console.log('[Performance] Memory Usage:', {
            used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
            total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
            limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB',
          });
        }
      } catch (error) {
        console.error('[Performance] Failed to log performance data:', error);
      }
    }, 3000); // Wait 3s for metrics to stabilize

    return () => clearTimeout(timer);
  }, [location.pathname, isDevelopment]);

  // This component doesn't render anything
  return null;
};

export default PerformanceMonitor;

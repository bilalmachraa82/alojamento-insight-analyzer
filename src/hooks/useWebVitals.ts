import { useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Web Vitals Hook - 2025 Best Practices
 *
 * This hook tracks all Core Web Vitals metrics following 2025 standards:
 * - LCP (Largest Contentful Paint): Measures loading performance
 * - INP (Interaction to Next Paint): Replaced FID, measures interactivity
 * - CLS (Cumulative Layout Shift): Measures visual stability
 * - FCP (First Contentful Paint): Measures perceived loading speed
 * - TTFB (Time to First Byte): Measures server response time
 *
 * Features:
 * - Attribution data for debugging
 * - Sends to Google Analytics 4
 * - Sends to Sentry for performance monitoring
 * - Only runs in production for performance
 * - Privacy-compliant (no PII)
 */

export interface WebVitalsConfig {
  /** Enable console logging (default: true in development, false in production) */
  debug?: boolean;
  /** Custom callback for metrics */
  onMetric?: (metric: Metric) => void;
  /** Enable Google Analytics tracking (default: true) */
  enableAnalytics?: boolean;
  /** Enable Sentry tracking (default: true) */
  enableSentry?: boolean;
}

export interface WebVitalsMetric extends Metric {
  /** Rating based on Google's thresholds */
  rating: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Get metric rating based on Google's 2025 thresholds
 */
export const getMetricRating = (metric: Metric): 'good' | 'needs-improvement' | 'poor' => {
  const { name, value } = metric;

  const thresholds: Record<string, { good: number; needsImprovement: number }> = {
    LCP: { good: 2500, needsImprovement: 4000 }, // <2.5s good, >4s poor
    INP: { good: 200, needsImprovement: 500 }, // <200ms good, >500ms poor
    CLS: { good: 0.1, needsImprovement: 0.25 }, // <0.1 good, >0.25 poor
    FCP: { good: 1800, needsImprovement: 3000 }, // <1.8s good, >3s poor
    TTFB: { good: 800, needsImprovement: 1800 }, // <800ms good, >1.8s poor
  };

  const threshold = thresholds[name];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
};

/**
 * Format metric value for display
 */
export const formatMetricValue = (metric: Metric): string => {
  const { name, value } = metric;

  if (name === 'CLS') {
    return value.toFixed(3);
  }

  return `${Math.round(value)}ms`;
};

/**
 * Log metric to console with color coding
 */
const logMetric = (metric: WebVitalsMetric, isDevelopment: boolean) => {
  if (!isDevelopment) return;

  const colors = {
    good: 'color: #0CCE6B',
    'needs-improvement': 'color: #FFA400',
    poor: 'color: #FF4E42',
  };

  const color = colors[metric.rating];
  const formattedValue = formatMetricValue(metric);

  console.log(
    `%c[Web Vitals] ${metric.name}: ${formattedValue} (${metric.rating})`,
    color
  );

  // Log attribution data if available
  if ('attribution' in metric && metric.attribution) {
    console.log(`  Attribution:`, (metric as any).attribution);
  }
};

/**
 * Send metric to Google Analytics 4
 */
const sendToAnalytics = async (metric: WebVitalsMetric) => {
  try {
    // Dynamically import to avoid circular dependencies
    const { trackWebVital } = await import('@/config/analytics');
    trackWebVital(metric);
  } catch (error) {
    console.error('[Web Vitals] Failed to send metric to Analytics:', error);
  }
};

/**
 * Send metric to Sentry
 */
const sendToSentry = async (metric: WebVitalsMetric) => {
  try {
    // Dynamically import to avoid circular dependencies
    const { trackWebVitalToSentry } = await import('@/config/sentry');
    trackWebVitalToSentry(metric);
  } catch (error) {
    console.error('[Web Vitals] Failed to send metric to Sentry:', error);
  }
};

/**
 * Handle Web Vital metric
 */
const handleMetric = async (
  metric: Metric,
  config: WebVitalsConfig,
  isDevelopment: boolean
) => {
  const rating = getMetricRating(metric);
  const enhancedMetric: WebVitalsMetric = { ...metric, rating };

  // Log to console in development or if debug is enabled
  if (config.debug ?? isDevelopment) {
    logMetric(enhancedMetric, true);
  }

  // Custom callback
  if (config.onMetric) {
    config.onMetric(enhancedMetric);
  }

  // Send to analytics (production only by default)
  if (config.enableAnalytics !== false) {
    await sendToAnalytics(enhancedMetric);
  }

  // Send to Sentry (production only by default)
  if (config.enableSentry !== false) {
    await sendToSentry(enhancedMetric);
  }

  // Warn in development if metric is poor
  if (isDevelopment && rating === 'poor') {
    console.warn(
      `[Web Vitals] Poor ${metric.name} detected: ${formatMetricValue(metric)}. ` +
      `This may impact user experience.`
    );
  }
};

/**
 * useWebVitals Hook
 *
 * Automatically tracks all Core Web Vitals metrics when component mounts.
 * Only tracks once per page load to avoid duplicate metrics.
 *
 * @param config - Optional configuration
 *
 * @example
 * ```tsx
 * function App() {
 *   useWebVitals({ debug: true });
 *   return <div>My App</div>;
 * }
 * ```
 */
export const useWebVitals = (config: WebVitalsConfig = {}) => {
  useEffect(() => {
    const environment = import.meta.env.MODE || 'development';
    const isDevelopment = environment === 'development';

    // Skip in test environment
    if (environment === 'test') {
      return;
    }

    // Initialize metric handlers with attribution for debugging
    const metricHandler = (metric: Metric) => handleMetric(metric, config, isDevelopment);

    try {
      // Track all Core Web Vitals
      // LCP - Largest Contentful Paint
      onLCP(metricHandler, { reportAllChanges: isDevelopment });

      // INP - Interaction to Next Paint (replaced FID in 2024)
      onINP(metricHandler, { reportAllChanges: isDevelopment });

      // CLS - Cumulative Layout Shift
      onCLS(metricHandler, { reportAllChanges: isDevelopment });

      // FCP - First Contentful Paint
      onFCP(metricHandler, { reportAllChanges: isDevelopment });

      // TTFB - Time to First Byte
      onTTFB(metricHandler, { reportAllChanges: isDevelopment });
    } catch (error) {
      console.error('[Web Vitals] Failed to initialize:', error);
    }

    // Cleanup not needed - web-vitals observers handle their own lifecycle
  }, []); // Empty deps - only run once on mount
};

/**
 * Export types for external use
 */
export type { Metric };

import * as Sentry from '@sentry/react';

/**
 * Sentry Configuration
 *
 * This file configures Sentry for error tracking, performance monitoring,
 * and user session recording. It includes breadcrumbs, custom tags, and
 * proper sample rates for production and development environments.
 */

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE || 'development';
  const isProduction = environment === 'production';

  // Don't initialize Sentry if DSN is not configured
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment,

    // Integrations
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration({
        // Trace all navigation and interactions
        tracePropagationTargets: [
          'localhost',
          /^\//,
          /^https:\/\/[^/]*\.vercel\.app/,
        ],
      }),

      // Session replay for debugging
      Sentry.replayIntegration({
        // Only record sessions with errors in production
        maskAllText: true,
        blockAllMedia: true,
        // Sample rate for sessions with errors
        replaysSessionSampleRate: isProduction ? 0.1 : 1.0,
        // Sample rate for sessions with errors
        replaysOnErrorSampleRate: 1.0,
      }),

      // Breadcrumbs for tracking user actions
      Sentry.breadcrumbsIntegration({
        console: true,
        dom: true,
        fetch: true,
        history: true,
        xhr: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in production, 100% in development

    // Set sample rate for profiling
    profilesSampleRate: isProduction ? 0.1 : 1.0,

    // Enable performance measurements for Web Vitals
    _experiments: {
      // Enable custom measurements
      measurementLimit: 100,
    },

    // Capture breadcrumbs for better debugging
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter out sensitive data from breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null; // Don't send console.log breadcrumbs
      }

      // Sanitize URLs to remove sensitive query parameters
      if (breadcrumb.data && breadcrumb.data.url) {
        breadcrumb.data.url = sanitizeUrl(breadcrumb.data.url);
      }

      return breadcrumb;
    },

    // Before sending events, add custom tags and filter sensitive data
    beforeSend(event, hint) {
      // Filter out errors in development if needed
      if (!isProduction && event.level === 'info') {
        return null;
      }

      // Add custom tags
      event.tags = {
        ...event.tags,
        'app.version': import.meta.env.VITE_APP_VERSION || '0.0.0',
        'app.build': import.meta.env.VITE_APP_BUILD || 'unknown',
      };

      // Sanitize request data
      if (event.request) {
        event.request.url = sanitizeUrl(event.request.url || '');
        event.request.headers = sanitizeHeaders(event.request.headers || {});
      }

      return event;
    },

    // Ignore specific errors
    ignoreErrors: [
      // Browser extension errors
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'http://tt.epicplay.com',
      "Can't find variable: ZiteReader",
      'jigsaw is not defined',
      'ComboSearch is not defined',
      'atomicFindClose',
      'fb_xd_fragment',
      'bmi_SafeAddOnload',
      'EBCallBackMessageReceived',
      'conduitPage',
      // Network errors
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      // ResizeObserver errors (safe to ignore)
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],

    // Deny URLs to ignore (e.g., browser extensions)
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],
  });

  // Set initial user context (can be updated when user logs in)
  Sentry.setContext('device', {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
    },
  });
};

/**
 * Set user context in Sentry
 */
export const setSentryUser = (user: {
  id: string;
  email?: string;
  username?: string;
}) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

/**
 * Clear user context (on logout)
 */
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

/**
 * Add custom breadcrumb
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data: data ? sanitizeData(data) : undefined,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Capture exception manually
 */
export const captureException = (
  error: Error,
  context?: Record<string, any>
) => {
  if (context) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setExtra(key, context[key]);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

/**
 * Capture message manually
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) => {
  if (context) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setExtra(key, context[key]);
      });
      Sentry.captureMessage(message, level);
    });
  } else {
    Sentry.captureMessage(message, level);
  }
};

/**
 * Set custom tag
 */
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

/**
 * Set custom context
 */
export const setContext = (name: string, context: Record<string, any>) => {
  Sentry.setContext(name, sanitizeData(context));
};

// Utility functions

/**
 * Sanitize URL to remove sensitive parameters
 */
function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    const sensitiveParams = ['token', 'api_key', 'apikey', 'key', 'secret', 'password', 'auth'];

    sensitiveParams.forEach((param) => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '[REDACTED]');
      }
    });

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Sanitize headers to remove sensitive information
 */
function sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

  sensitiveHeaders.forEach((header) => {
    const lowerHeader = header.toLowerCase();
    Object.keys(sanitized).forEach((key) => {
      if (key.toLowerCase() === lowerHeader) {
        sanitized[key] = '[REDACTED]';
      }
    });
  });

  return sanitized;
}

/**
 * Sanitize data object to remove sensitive information
 */
function sanitizeData(data: Record<string, any>): Record<string, any> {
  const sanitized = { ...data };
  const sensitiveKeys = ['password', 'token', 'api_key', 'apikey', 'secret', 'credit_card', 'ssn'];

  Object.keys(sanitized).forEach((key) => {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Track Web Vital metric to Sentry
 */
export interface WebVitalMetric {
  id: string;
  name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  navigationType?: string;
  attribution?: any;
}

export const trackWebVitalToSentry = (metric: WebVitalMetric) => {
  const isProduction = import.meta.env.MODE === 'production';

  try {
    // Set measurements globally (Sentry automatically attaches to active span)
    Sentry.setMeasurement(
      metric.name,
      metric.value,
      metric.name === 'CLS' ? '' : 'millisecond'
    );

    // Add breadcrumb for Web Vital
    Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: `${metric.name}: ${metric.value} (${metric.rating})`,
      level: metric.rating === 'poor' ? 'warning' : 'info',
      data: {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        navigationType: metric.navigationType,
        id: metric.id,
      },
    });

    // Set context with Web Vitals data
    Sentry.setContext('web-vitals', {
      [metric.name]: {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      },
    });

    // If metric is poor, capture as a performance issue (only in production)
    if (isProduction && metric.rating === 'poor') {
      Sentry.captureMessage(
        `Poor Web Vital detected: ${metric.name}`,
        {
          level: 'warning',
          tags: {
            'web-vital': metric.name,
            'web-vital.rating': metric.rating,
          },
          contexts: {
            'web-vital': {
              name: metric.name,
              value: metric.value,
              rating: metric.rating,
              delta: metric.delta,
              navigationType: metric.navigationType,
            },
            attribution: metric.attribution ? sanitizeData(metric.attribution) : undefined,
          },
        }
      );
    }

    // Add attribution data if available (for debugging)
    if (metric.attribution) {
      Sentry.setContext(`web-vitals-attribution-${metric.name.toLowerCase()}`,
        sanitizeData(metric.attribution)
      );
    }
  } catch (error) {
    console.error(`[Sentry] Failed to track Web Vital "${metric.name}":`, error);
  }
};

/**
 * Create a custom Sentry span for performance monitoring
 * Note: In Sentry v8+, use startSpan() for manual instrumentation
 */
export const startPerformanceSpan = (
  name: string,
  operation: string = 'pageload'
) => {
  try {
    // Start a new span with the given name and operation
    return Sentry.startSpan(
      {
        name,
        op: operation,
      },
      (span) => {
        return span;
      }
    );
  } catch (error) {
    console.error('[Sentry] Failed to start performance span:', error);
    return null;
  }
};

/**
 * Track a custom performance measurement
 */
export const trackPerformanceMeasurement = (
  name: string,
  value: number,
  unit: string = 'millisecond'
) => {
  try {
    Sentry.setMeasurement(name, value, unit);
  } catch (error) {
    console.error('[Sentry] Failed to track performance measurement:', error);
  }
};

export default Sentry;

import ReactGA from 'react-ga4';

/**
 * Google Analytics 4 Configuration
 *
 * This file configures Google Analytics 4 for user analytics, custom event tracking,
 * conversion tracking, and user properties. It includes privacy-compliant settings
 * with IP anonymization and cookie consent checking.
 */

// Custom event names
export const GA4_EVENTS = {
  // User actions
  DIAGNOSTIC_SUBMISSION: 'diagnostic_submission',
  REPORT_DOWNLOAD: 'report_download',
  PDF_GENERATION: 'pdf_generation',
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',

  // Page views
  PRICING_VIEW: 'pricing_view',
  RESULTS_VIEW: 'results_view',
  ADMIN_VIEW: 'admin_view',

  // Interactions
  FORM_START: 'form_start',
  FORM_COMPLETE: 'form_complete',
  FORM_ERROR: 'form_error',
  BUTTON_CLICK: 'button_click',

  // E-commerce (if applicable)
  PURCHASE: 'purchase',
  ADD_TO_CART: 'add_to_cart',
  VIEW_ITEM: 'view_item',

  // Engagement
  VIDEO_PLAY: 'video_play',
  FILE_DOWNLOAD: 'file_download',
  OUTBOUND_LINK: 'outbound_link',
  SEARCH: 'search',

  // Performance - Core Web Vitals
  WEB_VITAL: 'web_vital',
  WEB_VITAL_LCP: 'web_vital_lcp',
  WEB_VITAL_INP: 'web_vital_inp',
  WEB_VITAL_CLS: 'web_vital_cls',
  WEB_VITAL_FCP: 'web_vital_fcp',
  WEB_VITAL_TTFB: 'web_vital_ttfb',
} as const;

export type GA4EventName = typeof GA4_EVENTS[keyof typeof GA4_EVENTS];

// Check if cookie consent has been given
let cookieConsentGiven = false;

/**
 * Set cookie consent status
 */
export const setAnalyticsCookieConsent = (consent: boolean) => {
  cookieConsentGiven = consent;

  // Store consent in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('analytics_consent', consent ? 'granted' : 'denied');
  }

  // If consent is revoked, disable GA
  if (!consent && ReactGA.isInitialized) {
    // Analytics consent revoked, tracking disabled
  }
};

/**
 * Get cookie consent status from localStorage
 */
export const getAnalyticsCookieConsent = (): boolean => {
  if (typeof window === 'undefined') return false;

  const stored = localStorage.getItem('analytics_consent');
  if (stored) {
    cookieConsentGiven = stored === 'granted';
  }
  return cookieConsentGiven;
};

/**
 * Initialize Google Analytics 4
 */
export const initGA4 = () => {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
  const environment = import.meta.env.MODE || 'development';
  const isProduction = environment === 'production';

  // Don't initialize GA4 if measurement ID is not configured
  if (!measurementId) {
    return;
  }

  // Check for cookie consent
  const hasConsent = getAnalyticsCookieConsent();
  if (!hasConsent && isProduction) {
    return;
  }

  try {
    ReactGA.initialize(measurementId, {
      testMode: !isProduction,
      gaOptions: {
        // Privacy-compliant settings
        anonymizeIp: true,
        cookieFlags: 'SameSite=None;Secure',
        // Set cookie expiration to 13 months (GDPR compliant)
        cookieExpires: 60 * 60 * 24 * 365 + 60 * 60 * 24 * 30, // 13 months in seconds
      },
      gtagOptions: {
        // Additional privacy settings
        send_page_view: false, // We'll handle page views manually
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure',
        // Data retention
        allow_google_signals: false, // Disable Google Signals for privacy
        allow_ad_personalization_signals: false, // Disable ad personalization
      },
    });
  } catch (error) {
    console.error('Failed to initialize Google Analytics 4:', error);
  }
};

/**
 * Track page view
 */
export const trackPageView = (path: string, title?: string) => {
  if (!ReactGA.isInitialized || (!cookieConsentGiven && import.meta.env.MODE === 'production')) {
    return;
  }

  try {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title,
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
};

/**
 * Track custom event
 */
export const trackEvent = (
  eventName: GA4EventName | string,
  parameters?: Record<string, any>
) => {
  if (!ReactGA.isInitialized || (!cookieConsentGiven && import.meta.env.MODE === 'production')) {
    return;
  }

  try {
    ReactGA.event(eventName, sanitizeEventData(parameters));
  } catch (error) {
    console.error(`Failed to track event "${eventName}":`, error);
  }
};

/**
 * Track diagnostic submission
 */
export const trackDiagnosticSubmission = (data: {
  property_type?: string;
  has_reviews?: boolean;
  review_count?: number;
}) => {
  trackEvent(GA4_EVENTS.DIAGNOSTIC_SUBMISSION, {
    property_type: data.property_type,
    has_reviews: data.has_reviews,
    review_count: data.review_count,
  });
};

/**
 * Track report download
 */
export const trackReportDownload = (data: {
  report_type: 'basic' | 'premium';
  property_id: string;
  format?: 'pdf' | 'json';
}) => {
  trackEvent(GA4_EVENTS.REPORT_DOWNLOAD, {
    report_type: data.report_type,
    property_id: data.property_id,
    format: data.format || 'pdf',
  });
};

/**
 * Track PDF generation
 */
export const trackPDFGeneration = (data: {
  report_type: 'basic' | 'premium';
  property_id: string;
  generation_time_ms?: number;
}) => {
  trackEvent(GA4_EVENTS.PDF_GENERATION, {
    report_type: data.report_type,
    property_id: data.property_id,
    generation_time_ms: data.generation_time_ms,
  });
};

/**
 * Track user signup
 */
export const trackUserSignup = (data: {
  method: 'email' | 'google' | 'facebook' | 'other';
  user_type?: 'free' | 'premium';
}) => {
  trackEvent(GA4_EVENTS.USER_SIGNUP, {
    method: data.method,
    user_type: data.user_type,
  });
};

/**
 * Track user login
 */
export const trackUserLogin = (data: {
  method: 'email' | 'google' | 'facebook' | 'other';
}) => {
  trackEvent(GA4_EVENTS.USER_LOGIN, {
    method: data.method,
  });
};

/**
 * Track pricing page view
 */
export const trackPricingView = () => {
  trackEvent(GA4_EVENTS.PRICING_VIEW);
};

/**
 * Track conversion (purchase/subscription)
 */
export const trackConversion = (data: {
  transaction_id: string;
  value: number;
  currency?: string;
  items?: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity?: number;
  }>;
}) => {
  trackEvent(GA4_EVENTS.PURCHASE, {
    transaction_id: data.transaction_id,
    value: data.value,
    currency: data.currency || 'EUR',
    items: data.items || [],
  });
};

/**
 * Track form interactions
 */
export const trackFormStart = (formName: string) => {
  trackEvent(GA4_EVENTS.FORM_START, {
    form_name: formName,
  });
};

export const trackFormComplete = (formName: string, timeToComplete?: number) => {
  trackEvent(GA4_EVENTS.FORM_COMPLETE, {
    form_name: formName,
    time_to_complete: timeToComplete,
  });
};

export const trackFormError = (formName: string, errorField: string, errorMessage: string) => {
  trackEvent(GA4_EVENTS.FORM_ERROR, {
    form_name: formName,
    error_field: errorField,
    error_message: errorMessage,
  });
};

/**
 * Track button clicks
 */
export const trackButtonClick = (buttonName: string, location?: string) => {
  trackEvent(GA4_EVENTS.BUTTON_CLICK, {
    button_name: buttonName,
    location: location || window.location.pathname,
  });
};

/**
 * Track outbound links
 */
export const trackOutboundLink = (url: string) => {
  trackEvent(GA4_EVENTS.OUTBOUND_LINK, {
    url,
    destination: new URL(url).hostname,
  });
};

/**
 * Track search
 */
export const trackSearch = (searchTerm: string, resultsCount?: number) => {
  trackEvent(GA4_EVENTS.SEARCH, {
    search_term: searchTerm,
    results_count: resultsCount,
  });
};

/**
 * Set user properties
 */
export const setUserProperties = (properties: {
  user_id?: string;
  user_type?: 'free' | 'premium' | 'admin';
  account_age_days?: number;
  total_reports?: number;
  [key: string]: any;
}) => {
  if (!ReactGA.isInitialized || (!cookieConsentGiven && import.meta.env.MODE === 'production')) {
    return;
  }

  try {
    ReactGA.set(sanitizeEventData(properties));
  } catch (error) {
    console.error('Failed to set user properties:', error);
  }
};

/**
 * Set user ID (for cross-device tracking)
 */
export const setUserId = (userId: string) => {
  if (!ReactGA.isInitialized || (!cookieConsentGiven && import.meta.env.MODE === 'production')) {
    return;
  }

  try {
    ReactGA.set({ userId });
  } catch (error) {
    console.error('Failed to set user ID:', error);
  }
};

/**
 * Clear user ID (on logout)
 */
export const clearUserId = () => {
  if (!ReactGA.isInitialized) {
    return;
  }

  try {
    ReactGA.set({ userId: undefined });
  } catch (error) {
    console.error('Failed to clear user ID:', error);
  }
};

// Utility functions

/**
 * Sanitize event data to remove sensitive information
 */
function sanitizeEventData(data?: Record<string, any>): Record<string, any> | undefined {
  if (!data) return undefined;

  const sanitized = { ...data };
  const sensitiveKeys = ['password', 'token', 'api_key', 'apikey', 'secret', 'credit_card', 'ssn', 'email'];

  Object.keys(sanitized).forEach((key) => {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      delete sanitized[key];
    }
  });

  return sanitized;
}

/**
 * Track timing (for performance metrics)
 */
export const trackTiming = (
  category: string,
  variable: string,
  value: number,
  label?: string
) => {
  if (!ReactGA.isInitialized || (!cookieConsentGiven && import.meta.env.MODE === 'production')) {
    return;
  }

  try {
    ReactGA.event('timing_complete', {
      name: variable,
      value,
      event_category: category,
      event_label: label,
    });
  } catch (error) {
    console.error('Failed to track timing:', error);
  }
};

/**
 * Track Web Vital metric - 2025 Core Web Vitals
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

export const trackWebVital = (metric: WebVitalMetric) => {
  if (!ReactGA.isInitialized || (!cookieConsentGiven && import.meta.env.MODE === 'production')) {
    return;
  }

  try {
    // Track generic web vital event
    trackEvent(GA4_EVENTS.WEB_VITAL, {
      metric_name: metric.name,
      metric_value: Math.round(metric.value),
      metric_rating: metric.rating,
      metric_delta: metric.delta ? Math.round(metric.delta) : undefined,
      navigation_type: metric.navigationType,
      metric_id: metric.id,
    });

    // Track specific metric event for easier filtering in GA4
    const specificEventMap: Record<string, string> = {
      LCP: GA4_EVENTS.WEB_VITAL_LCP,
      INP: GA4_EVENTS.WEB_VITAL_INP,
      CLS: GA4_EVENTS.WEB_VITAL_CLS,
      FCP: GA4_EVENTS.WEB_VITAL_FCP,
      TTFB: GA4_EVENTS.WEB_VITAL_TTFB,
    };

    const specificEvent = specificEventMap[metric.name];
    if (specificEvent) {
      trackEvent(specificEvent, {
        value: metric.name === 'CLS' ? metric.value : Math.round(metric.value),
        rating: metric.rating,
        delta: metric.delta ? (metric.name === 'CLS' ? metric.delta : Math.round(metric.delta)) : undefined,
        navigation_type: metric.navigationType,
      });
    }

    // Track as custom measurement for GA4 reporting
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.value),
        metric_rating: metric.rating,
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true, // Don't affect bounce rate
      });
    }
  } catch (error) {
    console.error(`Failed to track Web Vital "${metric.name}":`, error);
  }
};

/**
 * Get Web Vitals thresholds for categorization
 */
export const getWebVitalsThresholds = () => ({
  LCP: { good: 2500, needsImprovement: 4000 }, // milliseconds
  INP: { good: 200, needsImprovement: 500 }, // milliseconds
  CLS: { good: 0.1, needsImprovement: 0.25 }, // score
  FCP: { good: 1800, needsImprovement: 3000 }, // milliseconds
  TTFB: { good: 800, needsImprovement: 1800 }, // milliseconds
});

/**
 * Test if GA4 is properly initialized
 */
export const testGA4 = () => {
  if (ReactGA.isInitialized) {
    trackEvent('test_event', {
      test: true,
      timestamp: new Date().toISOString(),
    });
  }
};

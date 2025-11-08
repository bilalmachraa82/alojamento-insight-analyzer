import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  trackPageView,
  trackEvent,
  trackDiagnosticSubmission,
  trackReportDownload,
  trackPDFGeneration,
  trackUserSignup,
  trackUserLogin,
  trackPricingView,
  trackConversion,
  trackFormStart,
  trackFormComplete,
  trackFormError,
  trackButtonClick,
  trackOutboundLink,
  trackSearch,
  setUserProperties,
  setUserId,
  clearUserId,
  GA4EventName,
} from '@/config/analytics';

/**
 * Hook to automatically track page views on route changes
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
};

/**
 * Hook to get analytics tracking functions
 * This provides a convenient API for tracking events throughout the app
 */
export const useAnalytics = () => {
  return {
    // Page tracking
    trackPageView: useCallback((path: string, title?: string) => {
      trackPageView(path, title);
    }, []),

    // Generic event tracking
    trackEvent: useCallback((eventName: GA4EventName | string, parameters?: Record<string, any>) => {
      trackEvent(eventName, parameters);
    }, []),

    // Diagnostic submission tracking
    trackDiagnosticSubmission: useCallback((data: {
      property_type?: string;
      has_reviews?: boolean;
      review_count?: number;
    }) => {
      trackDiagnosticSubmission(data);
    }, []),

    // Report download tracking
    trackReportDownload: useCallback((data: {
      report_type: 'basic' | 'premium';
      property_id: string;
      format?: 'pdf' | 'json';
    }) => {
      trackReportDownload(data);
    }, []),

    // PDF generation tracking
    trackPDFGeneration: useCallback((data: {
      report_type: 'basic' | 'premium';
      property_id: string;
      generation_time_ms?: number;
    }) => {
      trackPDFGeneration(data);
    }, []),

    // User signup tracking
    trackUserSignup: useCallback((data: {
      method: 'email' | 'google' | 'facebook' | 'other';
      user_type?: 'free' | 'premium';
    }) => {
      trackUserSignup(data);
    }, []),

    // User login tracking
    trackUserLogin: useCallback((data: {
      method: 'email' | 'google' | 'facebook' | 'other';
    }) => {
      trackUserLogin(data);
    }, []),

    // Pricing view tracking
    trackPricingView: useCallback(() => {
      trackPricingView();
    }, []),

    // Conversion tracking
    trackConversion: useCallback((data: {
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
      trackConversion(data);
    }, []),

    // Form tracking
    trackFormStart: useCallback((formName: string) => {
      trackFormStart(formName);
    }, []),

    trackFormComplete: useCallback((formName: string, timeToComplete?: number) => {
      trackFormComplete(formName, timeToComplete);
    }, []),

    trackFormError: useCallback((formName: string, errorField: string, errorMessage: string) => {
      trackFormError(formName, errorField, errorMessage);
    }, []),

    // Button click tracking
    trackButtonClick: useCallback((buttonName: string, location?: string) => {
      trackButtonClick(buttonName, location);
    }, []),

    // Outbound link tracking
    trackOutboundLink: useCallback((url: string) => {
      trackOutboundLink(url);
    }, []),

    // Search tracking
    trackSearch: useCallback((searchTerm: string, resultsCount?: number) => {
      trackSearch(searchTerm, resultsCount);
    }, []),

    // User properties
    setUserProperties: useCallback((properties: {
      user_id?: string;
      user_type?: 'free' | 'premium' | 'admin';
      account_age_days?: number;
      total_reports?: number;
      [key: string]: any;
    }) => {
      setUserProperties(properties);
    }, []),

    setUserId: useCallback((userId: string) => {
      setUserId(userId);
    }, []),

    clearUserId: useCallback(() => {
      clearUserId();
    }, []),
  };
};

/**
 * Hook to track form interactions with timing
 */
export const useFormTracking = (formName: string) => {
  const startTimeRef = useCallback(() => {
    const startTime = Date.now();
    trackFormStart(formName);
    return startTime;
  }, [formName]);

  const trackCompletion = useCallback((startTime: number) => {
    const timeToComplete = Date.now() - startTime;
    trackFormComplete(formName, timeToComplete);
  }, [formName]);

  const trackError = useCallback((errorField: string, errorMessage: string) => {
    trackFormError(formName, errorField, errorMessage);
  }, [formName]);

  return {
    startFormTracking: startTimeRef,
    trackFormCompletion: trackCompletion,
    trackFormError: trackError,
  };
};

/**
 * Hook to track button clicks with location
 */
export const useButtonTracking = () => {
  const location = useLocation();

  const track = useCallback((buttonName: string) => {
    trackButtonClick(buttonName, location.pathname);
  }, [location.pathname]);

  return track;
};

/**
 * Hook to track outbound links
 * Automatically detects and tracks clicks on external links
 */
export const useOutboundLinkTracking = () => {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href) {
        const url = new URL(link.href);
        const isExternal = url.hostname !== window.location.hostname;

        if (isExternal) {
          trackOutboundLink(link.href);
        }
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);
};

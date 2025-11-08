# Performance Monitoring Guide

## Overview

This guide explains the comprehensive Core Web Vitals monitoring system implemented in the application, following Google's 2025 best practices. The system tracks key performance metrics and sends them to Google Analytics 4 and Sentry for analysis and debugging.

## Table of Contents

- [Core Web Vitals Tracked](#core-web-vitals-tracked)
- [Architecture](#architecture)
- [Data Flow](#data-flow)
- [Accessing Performance Data](#accessing-performance-data)
- [Thresholds and Ratings](#thresholds-and-ratings)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Core Web Vitals Tracked

### 1. LCP (Largest Contentful Paint)

**What it measures:** Loading performance - the time it takes for the largest content element to become visible.

**Why it matters:** Indicates when the main content of the page has loaded and is ready for users to interact with.

**Thresholds (2025):**
- 🟢 Good: ≤ 2.5 seconds
- 🟡 Needs Improvement: 2.5 - 4.0 seconds
- 🔴 Poor: > 4.0 seconds

**Common causes of poor LCP:**
- Large image files
- Slow server response times
- Render-blocking JavaScript/CSS
- Client-side rendering delays

### 2. INP (Interaction to Next Paint)

**What it measures:** Interactivity - the time from when a user interacts with the page until the next paint occurs.

**Why it matters:** Replaced FID (First Input Delay) in 2024. Better measures overall responsiveness throughout the page lifecycle.

**Thresholds (2025):**
- 🟢 Good: ≤ 200 milliseconds
- 🟡 Needs Improvement: 200 - 500 milliseconds
- 🔴 Poor: > 500 milliseconds

**Common causes of poor INP:**
- Heavy JavaScript execution
- Long tasks blocking the main thread
- Large DOM size
- Complex event handlers

### 3. CLS (Cumulative Layout Shift)

**What it measures:** Visual stability - the sum of all unexpected layout shifts during the page's lifespan.

**Why it matters:** Prevents frustrating experiences where content moves while users are trying to interact.

**Thresholds (2025):**
- 🟢 Good: ≤ 0.1
- 🟡 Needs Improvement: 0.1 - 0.25
- 🔴 Poor: > 0.25

**Common causes of poor CLS:**
- Images without dimensions
- Dynamically injected content
- Web fonts causing FOIT/FOUT
- Ads, embeds, or iframes without reserved space

### 4. FCP (First Contentful Paint)

**What it measures:** Perceived loading speed - when the first DOM content is rendered.

**Why it matters:** Gives users feedback that the page is loading.

**Thresholds (2025):**
- 🟢 Good: ≤ 1.8 seconds
- 🟡 Needs Improvement: 1.8 - 3.0 seconds
- 🔴 Poor: > 3.0 seconds

### 5. TTFB (Time to First Byte)

**What it measures:** Server response time - time from navigation start to receiving the first byte of the response.

**Why it matters:** Indicates backend performance and network latency.

**Thresholds (2025):**
- 🟢 Good: ≤ 800 milliseconds
- 🟡 Needs Improvement: 800 - 1800 milliseconds
- 🔴 Poor: > 1800 milliseconds

## Architecture

### Components

```
src/
├── hooks/
│   └── useWebVitals.ts          # Core hook that tracks all metrics
├── components/
│   └── performance/
│       └── PerformanceMonitor.tsx # Non-visual component that uses the hook
├── config/
│   ├── analytics.ts             # Google Analytics 4 integration
│   └── sentry.ts                # Sentry performance monitoring
└── App.tsx                      # Integrates PerformanceMonitor
```

### How It Works

1. **PerformanceMonitor Component** is mounted in App.tsx
2. **useWebVitals Hook** initializes web-vitals library observers
3. **Metrics are collected** automatically as the user interacts with the page
4. **Data is processed** and rated (good/needs-improvement/poor)
5. **Metrics are sent** to both Google Analytics 4 and Sentry
6. **Route changes are tracked** for per-page performance analysis

### Performance Overhead

The monitoring system is designed with minimal overhead:
- ✅ **Bundle size:** ~3KB gzipped (web-vitals library)
- ✅ **Runtime impact:** < 5ms per metric
- ✅ **Memory usage:** Negligible (< 100KB)
- ✅ **Network:** Non-blocking async requests

## Data Flow

```
User Interaction
      ↓
web-vitals Library (Browser API)
      ↓
useWebVitals Hook
      ↓
PerformanceMonitor Component
      ↓
   ┌──────────────┬──────────────┐
   ↓              ↓              ↓
Google       Sentry        Console
Analytics 4                (Dev Mode)
```

### Development Mode

In development mode:
- All metrics are logged to console with color coding
- Attribution data is logged for debugging
- Warnings are shown for poor metrics
- Navigation timing and resource timing are logged
- Memory usage is tracked (Chrome only)

### Production Mode

In production mode:
- Silent tracking (no console logs)
- Metrics sent to Google Analytics 4
- Metrics sent to Sentry
- Poor metrics trigger Sentry warnings
- Privacy-compliant (no PII collected)

## Accessing Performance Data

### Google Analytics 4

#### 1. Real-time Reports

Navigate to: **Reports → Realtime → Event count by Event name**

Look for these events:
- `web_vital` - Generic event with all metrics
- `web_vital_lcp` - LCP specific
- `web_vital_inp` - INP specific
- `web_vital_cls` - CLS specific
- `web_vital_fcp` - FCP specific
- `web_vital_ttfb` - TTFB specific

#### 2. Custom Reports

Create a custom exploration:

1. Go to **Explore** → **Create new exploration**
2. Add dimensions:
   - Event name
   - Page path
   - Metric name
   - Metric rating
3. Add metrics:
   - Event count
   - Average metric value
4. Add filters:
   - Event name = web_vital*

#### 3. Using GA4 API

```javascript
// Example query to fetch Web Vitals data
const response = await fetch('https://analyticsdata.googleapis.com/v1beta/properties/YOUR_PROPERTY_ID:runReport', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dimensions: [
      { name: 'pagePath' },
      { name: 'customEvent:metric_name' }
    ],
    metrics: [
      { name: 'customEvent:metric_value' },
      { name: 'eventCount' }
    ],
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: {
          matchType: 'BEGINS_WITH',
          value: 'web_vital'
        }
      }
    }
  })
});
```

### Sentry

#### 1. Performance Monitoring Dashboard

Navigate to: **Performance** → **Web Vitals**

You'll see:
- LCP, INP, CLS, FCP, TTFB graphs over time
- Distribution of ratings (good/needs-improvement/poor)
- P75, P95, P99 percentiles
- Comparisons across time periods

#### 2. Individual Transactions

Navigate to: **Performance** → **Transactions**

For each page view transaction:
- All Web Vitals measurements
- Attribution data for debugging
- Breadcrumbs showing metric capture
- Stack traces (if poor performance)

#### 3. Alerts and Issues

Navigate to: **Alerts** → **Create Alert**

Set up alerts for:
- LCP > 4000ms
- INP > 500ms
- CLS > 0.25

#### 4. Using Sentry API

```javascript
// Example query to fetch performance data
const response = await fetch('https://sentry.io/api/0/organizations/YOUR_ORG/events/', {
  headers: {
    'Authorization': 'Bearer YOUR_AUTH_TOKEN'
  },
  params: {
    query: 'event.type:transaction measurements.lcp:>4000',
    field: ['measurements.lcp', 'measurements.inp', 'measurements.cls'],
    statsPeriod: '7d'
  }
});
```

### Console (Development Only)

Open browser console to see:
- Color-coded metric logs
- Navigation timing breakdown
- Resource timing (slow resources > 1s)
- Memory usage (Chrome only)
- Route change tracking
- Attribution data for debugging

Example console output:
```
[Web Vitals] LCP: 1823ms (good)
  Attribution: { element: 'IMG', url: '/hero.jpg', ... }
[Web Vitals] INP: 156ms (good)
[Web Vitals] CLS: 0.05 (good)
[Performance] Navigation Timing
  DNS: 12 ms
  TCP: 34 ms
  Request: 156 ms
  Response: 89 ms
  DOM Processing: 234 ms
  Load Complete: 45 ms
  Total: 570 ms
```

## Thresholds and Ratings

### Rating Algorithm

Each metric is rated based on Google's official thresholds:

```typescript
function getRating(metric: string, value: number): Rating {
  const thresholds = {
    LCP: { good: 2500, needsImprovement: 4000 },
    INP: { good: 200, needsImprovement: 500 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 },
  };

  const threshold = thresholds[metric];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}
```

### Target Goals

For optimal user experience, aim for:
- **75th percentile** of all metrics in "good" range
- **95th percentile** below "needs improvement" threshold
- **99th percentile** identified and addressed

## Troubleshooting

### Common Issues

#### 1. Metrics Not Appearing in GA4

**Possible causes:**
- GA4 not initialized (check `.env` for `VITE_GA4_MEASUREMENT_ID`)
- Cookie consent not granted
- Ad blocker blocking GA4
- Test mode enabled

**Solutions:**
```javascript
// Check if GA4 is initialized
import ReactGA from 'react-ga4';
console.log('GA4 initialized:', ReactGA.isInitialized);

// Test GA4
import { testGA4 } from '@/config/analytics';
testGA4();
```

#### 2. Metrics Not Appearing in Sentry

**Possible causes:**
- Sentry not initialized (check `.env` for `VITE_SENTRY_DSN`)
- Sample rate too low
- Network issues

**Solutions:**
```javascript
// Check if Sentry is initialized
import * as Sentry from '@sentry/react';
console.log('Sentry client:', Sentry.getCurrentHub().getClient());

// Test Sentry
Sentry.captureMessage('Test message');
```

#### 3. Poor LCP Scores

**Debug steps:**
1. Identify the LCP element:
   ```javascript
   // In console
   onLCP(console.log);
   // Check attribution.element
   ```
2. Check if it's an image:
   - Add `loading="eager"` to critical images
   - Use responsive images with `srcset`
   - Optimize image size and format (WebP)
   - Add dimensions to prevent layout shift
3. Check server response:
   - Optimize TTFB (< 800ms)
   - Use CDN for static assets
   - Enable HTTP/2 or HTTP/3
4. Check render-blocking resources:
   - Inline critical CSS
   - Defer non-critical JavaScript
   - Use `rel="preload"` for critical resources

#### 4. Poor INP Scores

**Debug steps:**
1. Identify slow interactions:
   ```javascript
   // In console
   onINP(console.log);
   // Check attribution data
   ```
2. Profile with Chrome DevTools:
   - Open Performance tab
   - Record user interaction
   - Look for long tasks (> 50ms)
3. Optimize JavaScript:
   - Break up long tasks
   - Use `requestIdleCallback` for non-critical work
   - Debounce/throttle event handlers
   - Reduce JavaScript bundle size
4. Optimize React:
   - Use `React.memo()` for expensive components
   - Implement virtualization for long lists
   - Avoid expensive calculations in render

#### 5. Poor CLS Scores

**Debug steps:**
1. Identify shifting elements:
   ```javascript
   // In console
   onCLS(console.log);
   // Check attribution.largestShiftTarget
   ```
2. Common fixes:
   - Add explicit `width` and `height` to images
   - Reserve space for ads/embeds with `min-height`
   - Use `font-display: optional` for web fonts
   - Avoid inserting content above existing content
   - Use CSS transforms instead of layout properties

#### 6. Poor TTFB Scores

**Debug steps:**
1. Check network timing:
   ```javascript
   // In console
   performance.getEntriesByType('navigation')[0]
   ```
2. Optimize server:
   - Enable server caching
   - Use CDN
   - Optimize database queries
   - Enable compression (gzip/brotli)
3. Check DNS/SSL:
   - Use faster DNS provider
   - Enable HTTP/2 or HTTP/3
   - Optimize SSL handshake

### Debug Mode

Enable debug mode to see detailed logs:

```typescript
// In any component
import { useWebVitals } from '@/hooks/useWebVitals';

function MyComponent() {
  useWebVitals({ debug: true });
  return <div>My Component</div>;
}
```

## Best Practices

### 1. Monitor Regularly

- Check GA4 weekly for trends
- Set up Sentry alerts for regressions
- Review P75 and P95 metrics
- Compare across different pages/routes

### 2. Test Before Deploying

```bash
# Test performance in production build
npm run build
npm run preview

# Open browser console and check metrics
# Use Lighthouse for additional insights
```

### 3. Optimize for Real Users

- Focus on 75th percentile (not averages)
- Test on real devices (not just desktop)
- Consider network conditions (3G, 4G)
- Test on different browsers

### 4. Set Performance Budgets

Create performance budgets in your CI/CD:

```javascript
// lighthouse-config.js
module.exports = {
  ci: {
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
  },
};
```

### 5. Document Performance Issues

When you identify performance issues:
1. Create a Sentry issue with context
2. Add GA4 custom event for tracking
3. Document the fix in code comments
4. Monitor after deployment

### 6. Privacy Compliance

The monitoring system is privacy-compliant:
- ✅ No PII collected
- ✅ Respects cookie consent
- ✅ Anonymized data
- ✅ GDPR compliant
- ✅ Can be disabled per user

## Additional Resources

### Official Documentation

- [Web Vitals](https://web.dev/vitals/)
- [Google's Web Vitals Guide](https://web.dev/learn-core-web-vitals/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

### Tools

- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
- [Chrome User Experience Report](https://developers.google.com/web/tools/chrome-user-experience-report)
- [WebPageTest](https://www.webpagetest.org/)

### Libraries

- [web-vitals](https://github.com/GoogleChrome/web-vitals) - Official library
- [@sentry/react](https://docs.sentry.io/platforms/javascript/guides/react/) - Error & performance monitoring
- [react-ga4](https://github.com/codler/react-ga4) - Google Analytics 4 for React

## Questions or Issues?

If you encounter any issues with the performance monitoring system:

1. Check this guide for troubleshooting steps
2. Review console logs in development mode
3. Verify environment variables are set correctly
4. Check GA4 and Sentry dashboards for data

For implementation questions, review:
- `/src/hooks/useWebVitals.ts` - Core implementation
- `/src/components/performance/PerformanceMonitor.tsx` - Component integration
- `/src/config/analytics.ts` - GA4 tracking
- `/src/config/sentry.ts` - Sentry integration

---

**Last Updated:** 2025-11-08
**Version:** 1.0.0
**Maintained By:** Development Team

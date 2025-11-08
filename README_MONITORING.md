# Monitoring Stack Documentation

This document provides comprehensive information about the monitoring and analytics implementation in the Alojamento Insight Analyzer application, including Sentry error tracking and Google Analytics 4.

## Table of Contents

1. [Overview](#overview)
2. [Sentry Setup](#sentry-setup)
3. [Google Analytics 4 Setup](#google-analytics-4-setup)
4. [Environment Configuration](#environment-configuration)
5. [Usage Guide](#usage-guide)
6. [Privacy Compliance](#privacy-compliance)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

The application includes a complete monitoring stack with:

- **Sentry**: Error tracking, performance monitoring, and session replay
- **Google Analytics 4**: User analytics, event tracking, and conversion tracking
- **ErrorBoundary**: User-friendly error pages with automatic error reporting
- **Cookie Consent**: GDPR-compliant privacy controls

### Key Features

- Automatic error capture and reporting
- Performance monitoring with custom instrumentation
- User session replay for debugging
- Privacy-compliant analytics tracking
- Custom event tracking for business metrics
- Source map upload for detailed stack traces
- Cookie consent management

---

## Sentry Setup

### 1. Create a Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account
3. Create a new project for your application
4. Select "React" as the platform

### 2. Get Your DSN

1. Navigate to **Settings** > **Projects** > **[Your Project]** > **Client Keys (DSN)**
2. Copy the DSN (looks like `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)
3. Add it to your `.env` file:

```bash
VITE_SENTRY_DSN=your_sentry_dsn_here
```

### 3. Configure Source Maps (Production Only)

For detailed stack traces in production, you need to upload source maps:

1. Go to **Settings** > **Account** > **API** > **Auth Tokens**
2. Create a new token with the following scopes:
   - `project:releases`
   - `project:write`
3. Add the configuration to your `.env` file:

```bash
SENTRY_ORG=your_organization_slug
SENTRY_PROJECT=your_project_slug
SENTRY_AUTH_TOKEN=your_auth_token
```

**Note**: Never commit `SENTRY_AUTH_TOKEN` to version control. Add it only in production build environments.

### 4. Sentry Features Enabled

- **Error Tracking**: Automatic capture of JavaScript errors
- **Performance Monitoring**: 10% sample rate in production (100% in development)
- **Session Replay**: Records sessions with errors for debugging
- **Breadcrumbs**: Tracks user actions leading to errors
- **Custom Tags**: Environment, user, and application metadata
- **Data Sanitization**: Automatically removes sensitive data

### Configuration File

The Sentry configuration is in `/src/config/sentry.ts`. Key settings:

```typescript
{
  tracesSampleRate: 0.1,          // 10% of transactions
  replaysSessionSampleRate: 0.1,  // 10% of sessions
  replaysOnErrorSampleRate: 1.0,  // 100% of error sessions
}
```

---

## Google Analytics 4 Setup

### 1. Create a GA4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Navigate to **Admin** > **Create Property**
3. Follow the setup wizard to create a GA4 property
4. Create a **Web Data Stream**

### 2. Get Your Measurement ID

1. In **Admin**, go to **Data Streams**
2. Click on your web stream
3. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)
4. Add it to your `.env` file:

```bash
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. GA4 Features Enabled

- **Automatic Page Tracking**: Tracks all route changes
- **Custom Event Tracking**: Business-specific events
- **User Properties**: Track user segments and behavior
- **Conversion Tracking**: Track key business metrics
- **Privacy Controls**: IP anonymization and cookie consent

### 4. Custom Events Tracked

The following custom events are automatically tracked:

| Event Name | Description | Parameters |
|------------|-------------|------------|
| `diagnostic_submission` | User submits a diagnostic form | property_type, has_reviews, review_count |
| `report_download` | User downloads a report | report_type, property_id, format |
| `pdf_generation` | PDF report is generated | report_type, property_id, generation_time_ms |
| `user_signup` | New user registration | method, user_type |
| `user_login` | User login | method |
| `pricing_view` | Pricing page viewed | - |
| `form_start` | User starts filling a form | form_name |
| `form_complete` | User completes a form | form_name, time_to_complete |
| `form_error` | Form validation error | form_name, error_field, error_message |
| `button_click` | Button clicked | button_name, location |
| `outbound_link` | External link clicked | url, destination |

### Configuration File

The GA4 configuration is in `/src/config/analytics.ts`.

---

## Environment Configuration

### Required Environment Variables

```bash
# Sentry (Error Tracking)
VITE_SENTRY_DSN=your_sentry_dsn_here

# Google Analytics 4 (Analytics)
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Application Metadata
VITE_APP_VERSION=1.0.0
VITE_APP_BUILD=production
```

### Build-Time Variables (CI/CD Only)

```bash
# Sentry Source Maps Upload
SENTRY_ORG=your_organization_slug
SENTRY_PROJECT=your_project_slug
SENTRY_AUTH_TOKEN=your_auth_token  # NEVER commit this!
```

### Development vs Production

- **Development**: All tracking works but with 100% sample rates for testing
- **Production**:
  - Sentry: 10% performance monitoring, 100% error capture
  - GA4: Full analytics with IP anonymization
  - Source maps uploaded and removed from bundle

---

## Usage Guide

### Tracking Custom Events

Use the `useAnalytics` hook in your components:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const analytics = useAnalytics();

  const handleSubmit = () => {
    analytics.trackDiagnosticSubmission({
      property_type: 'apartment',
      has_reviews: true,
      review_count: 50,
    });
  };

  return <button onClick={handleSubmit}>Submit</button>;
}
```

### Tracking Page Views

Page views are automatically tracked via the `usePageTracking` hook in `App.tsx`. No additional code needed.

### Capturing Errors Manually

```typescript
import { captureException, captureMessage } from '@/config/sentry';

try {
  // Some code that might fail
} catch (error) {
  captureException(error as Error, {
    context: 'additional_info',
    user_action: 'button_click',
  });
}

// Or capture a message
captureMessage('Something important happened', 'info', {
  custom_data: 'value',
});
```

### Setting User Context

```typescript
import { setSentryUser } from '@/config/sentry';
import { setUserId } from '@/config/analytics';

// When user logs in
setSentryUser({
  id: user.id,
  email: user.email,
  username: user.username,
});

setUserId(user.id);
```

### Form Tracking

```typescript
import { useFormTracking } from '@/hooks/useAnalytics';

function MyForm() {
  const { startFormTracking, trackFormCompletion, trackFormError } =
    useFormTracking('diagnostic_form');

  const handleSubmit = (data) => {
    const startTime = startFormTracking();

    try {
      // Submit form
      trackFormCompletion(startTime);
    } catch (error) {
      trackFormError('email', error.message);
    }
  };
}
```

---

## Privacy Compliance

### Cookie Consent

The application includes a GDPR-compliant cookie consent banner that:

- Appears on first visit
- Allows granular control (necessary, analytics, marketing)
- Stores preferences in localStorage
- Blocks GA4 tracking until consent is given
- Can be reopened via settings

### Implementation

The `CookieConsent` component is automatically included in `App.tsx`.

Users can manage preferences via:
```typescript
import { CookieSettingsButton } from '@/components/CookieConsent';

// Add to footer or settings page
<CookieSettingsButton />
```

### Data Privacy Features

1. **IP Anonymization**: GA4 automatically anonymizes IP addresses
2. **Data Sanitization**: Sensitive data removed from Sentry and GA4
3. **Cookie Expiration**: 13 months (GDPR compliant)
4. **User Control**: Users can opt-out at any time
5. **No PII**: Never send personally identifiable information

### Sensitive Data Filtering

Both Sentry and GA4 automatically filter:
- Passwords
- API keys
- Tokens
- Credit card numbers
- Email addresses (in events)
- Any field containing sensitive keywords

---

## Testing

### Test in Development

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Check initialization**:
   - Open browser console
   - Look for: `✅ Sentry initialized for development environment`
   - Look for: `✅ Google Analytics 4 initialized for development environment`

3. **Test error tracking**:
   ```typescript
   // In browser console
   throw new Error('Test error');
   ```
   - Check Sentry dashboard for the error

4. **Test analytics**:
   ```typescript
   // In browser console
   import { testGA4 } from '@/config/analytics';
   testGA4();
   ```
   - Check GA4 Real-time reports (Admin > Real-time)

### Test Cookie Consent

1. Open the app in incognito mode
2. Verify the cookie consent banner appears
3. Try "Accept All", "Necessary Only", and "Customize"
4. Verify choices persist on refresh

### Test Error Boundary

Create a component that throws an error:

```typescript
function BrokenComponent() {
  throw new Error('Test error boundary');
  return <div>This won't render</div>;
}
```

Verify:
- Error boundary UI appears
- Error is sent to Sentry
- User can recover or go home

### Verify Source Maps

1. Build for production:
   ```bash
   npm run build
   ```

2. Check for source map upload in build logs:
   ```
   [sentry-vite-plugin] Uploading source maps...
   ```

3. Trigger an error in production
4. Check Sentry issue for readable stack trace

---

## Troubleshooting

### Sentry Not Initializing

**Problem**: No Sentry initialization message in console

**Solutions**:
1. Check `VITE_SENTRY_DSN` is set in `.env`
2. Verify DSN format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
3. Restart dev server after changing `.env`
4. Check browser console for errors

### GA4 Not Tracking

**Problem**: No events appearing in GA4

**Solutions**:
1. Check `VITE_GA4_MEASUREMENT_ID` format: `G-XXXXXXXXXX`
2. Verify cookie consent has been given (check localStorage)
3. Use GA4 DebugView:
   - Install GA Debugger extension
   - Check DebugView in GA4 (Admin > DebugView)
4. Allow 24-48 hours for data to appear in standard reports

### Source Maps Not Uploading

**Problem**: Stack traces show minified code

**Solutions**:
1. Verify all Sentry build variables are set:
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - `SENTRY_AUTH_TOKEN`
2. Check auth token has correct scopes
3. Build in production mode: `npm run build`
4. Check build logs for upload confirmation

### Cookie Consent Not Showing

**Problem**: Banner doesn't appear

**Solutions**:
1. Clear localStorage: `localStorage.clear()`
2. Refresh page in incognito mode
3. Check browser console for React errors

### Performance Issues

**Problem**: Monitoring causing performance degradation

**Solutions**:
1. Reduce sample rates in `/src/config/sentry.ts`:
   ```typescript
   tracesSampleRate: 0.05,  // 5% instead of 10%
   ```
2. Disable session replay in production:
   ```typescript
   replaysSessionSampleRate: 0.0,
   ```
3. Use network throttling to test impact

---

## Best Practices

### 1. Error Tracking

- **Do**: Add context to errors
  ```typescript
  captureException(error, {
    feature: 'checkout',
    step: 'payment',
  });
  ```
- **Don't**: Catch and ignore errors without reporting

### 2. Analytics Tracking

- **Do**: Track meaningful user actions
- **Don't**: Track every button click (creates noise)
- **Do**: Use consistent event names
- **Don't**: Create similar events with different names

### 3. Privacy

- **Do**: Ask for consent before analytics
- **Don't**: Track PII (emails, names, etc.)
- **Do**: Anonymize user data
- **Don't**: Store sensitive data in events

### 4. Performance

- **Do**: Use sample rates in production
- **Don't**: Track 100% of transactions
- **Do**: Remove source maps after upload
- **Don't**: Ship source maps to users

### 5. Development

- **Do**: Test error tracking in development
- **Don't**: Leave test errors in production
- **Do**: Use descriptive error messages
- **Don't**: Use generic "Error occurred" messages

---

## Custom Event Examples

### Track Diagnostic Submission

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

const { trackDiagnosticSubmission } = useAnalytics();

trackDiagnosticSubmission({
  property_type: 'apartment',
  has_reviews: true,
  review_count: 50,
});
```

### Track Report Download

```typescript
const { trackReportDownload } = useAnalytics();

trackReportDownload({
  report_type: 'premium',
  property_id: '123',
  format: 'pdf',
});
```

### Track Conversion

```typescript
const { trackConversion } = useAnalytics();

trackConversion({
  transaction_id: 'txn_123',
  value: 49.99,
  currency: 'EUR',
  items: [{
    item_id: 'premium_report',
    item_name: 'Premium Analysis Report',
    price: 49.99,
    quantity: 1,
  }],
});
```

---

## Advanced Configuration

### Custom Sentry Integrations

Edit `/src/config/sentry.ts` to add custom integrations:

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  // ... existing config
  integrations: [
    // Add custom integrations
    new Sentry.Integrations.HttpContext(),
    new Sentry.Integrations.ExtraErrorData(),
  ],
});
```

### Custom GA4 Dimensions

Add custom dimensions in GA4:

1. Go to **Admin** > **Custom Definitions**
2. Create custom dimensions
3. Track in code:

```typescript
import { setUserProperties } from '@/config/analytics';

setUserProperties({
  user_tier: 'premium',
  subscription_status: 'active',
});
```

---

## Support

For issues or questions:

1. Check this documentation
2. Review Sentry documentation: [https://docs.sentry.io](https://docs.sentry.io)
3. Review GA4 documentation: [https://support.google.com/analytics](https://support.google.com/analytics)
4. Contact the development team

---

## Changelog

### Version 1.0.0 (Current)

- Initial Sentry integration
- Initial GA4 integration
- Cookie consent implementation
- Error boundary setup
- Source maps configuration
- Custom event tracking
- Privacy compliance features

---

## License

This monitoring implementation is part of the Alojamento Insight Analyzer application.

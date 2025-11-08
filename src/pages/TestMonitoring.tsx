import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/hooks/useAnalytics';
import { captureException, captureMessage, addBreadcrumb } from '@/config/sentry';
import { testGA4 } from '@/config/analytics';
import { AlertTriangle, CheckCircle, Activity, BarChart } from 'lucide-react';

/**
 * Test Monitoring Page
 *
 * This page provides a UI to test Sentry error tracking and Google Analytics 4.
 * Use this page to verify your monitoring setup is working correctly.
 */
const TestMonitoring: React.FC = () => {
  const [results, setResults] = useState<Array<{ type: 'success' | 'error'; message: string }>>([]);
  const analytics = useAnalytics();

  const addResult = (type: 'success' | 'error', message: string) => {
    setResults((prev) => [...prev, { type, message }]);
  };

  // Sentry Tests
  const testSentryError = () => {
    try {
      throw new Error('Test error from monitoring test page');
    } catch (error) {
      captureException(error as Error, {
        test: true,
        timestamp: new Date().toISOString(),
      });
      addResult('success', 'Error captured and sent to Sentry. Check your Sentry dashboard.');
    }
  };

  const testSentryMessage = () => {
    captureMessage('Test message from monitoring test page', 'info', {
      test: true,
      timestamp: new Date().toISOString(),
    });
    addResult('success', 'Message sent to Sentry. Check your Sentry dashboard.');
  };

  const testSentryBreadcrumb = () => {
    addBreadcrumb('User clicked test breadcrumb button', 'user', 'info', {
      test: true,
    });
    addResult('success', 'Breadcrumb added. This will appear in the next error.');
  };

  // GA4 Tests
  const testGA4Event = () => {
    testGA4();
    addResult('success', 'Test event sent to GA4. Check Real-time reports or DebugView.');
  };

  const testCustomEvent = () => {
    analytics.trackEvent('test_custom_event', {
      test: true,
      timestamp: new Date().toISOString(),
    });
    addResult('success', 'Custom event sent to GA4.');
  };

  const testDiagnosticSubmission = () => {
    analytics.trackDiagnosticSubmission({
      property_type: 'test_apartment',
      has_reviews: true,
      review_count: 42,
    });
    addResult('success', 'Diagnostic submission event sent to GA4.');
  };

  const testReportDownload = () => {
    analytics.trackReportDownload({
      report_type: 'premium',
      property_id: 'test_123',
      format: 'pdf',
    });
    addResult('success', 'Report download event sent to GA4.');
  };

  const testButtonClick = () => {
    analytics.trackButtonClick('test_button', '/test-monitoring');
    addResult('success', 'Button click event sent to GA4.');
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Monitoring Test Page</h1>
        <p className="text-muted-foreground">
          Test your Sentry error tracking and Google Analytics 4 integration.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Sentry Tests */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle>Sentry Error Tracking</CardTitle>
            </div>
            <CardDescription>
              Test error capture and reporting to Sentry
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={testSentryError} variant="destructive" className="w-full">
              Test Error Capture
            </Button>
            <Button onClick={testSentryMessage} variant="outline" className="w-full">
              Test Message Capture
            </Button>
            <Button onClick={testSentryBreadcrumb} variant="outline" className="w-full">
              Add Test Breadcrumb
            </Button>

            <Alert>
              <AlertDescription className="text-xs">
                <strong>Note:</strong> Check your Sentry dashboard to verify errors are being captured.
                Look for "Test error from monitoring test page" in your Issues.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* GA4 Tests */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-600" />
              <CardTitle>Google Analytics 4</CardTitle>
            </div>
            <CardDescription>
              Test event tracking and analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={testGA4Event} variant="default" className="w-full">
              Test GA4 Event
            </Button>
            <Button onClick={testCustomEvent} variant="outline" className="w-full">
              Test Custom Event
            </Button>
            <Button onClick={testDiagnosticSubmission} variant="outline" className="w-full">
              Test Diagnostic Event
            </Button>
            <Button onClick={testReportDownload} variant="outline" className="w-full">
              Test Report Download
            </Button>
            <Button onClick={testButtonClick} variant="outline" className="w-full">
              Test Button Click
            </Button>

            <Alert>
              <AlertDescription className="text-xs">
                <strong>Note:</strong> Events may take a few minutes to appear in GA4 Real-time reports.
                Use DebugView for immediate verification.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Status Indicators */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            <CardTitle>Monitoring Status</CardTitle>
          </div>
          <CardDescription>
            Current status of monitoring integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Sentry</p>
                <p className="text-sm text-muted-foreground">Error Tracking</p>
              </div>
              <Badge variant={import.meta.env.VITE_SENTRY_DSN ? 'default' : 'secondary'}>
                {import.meta.env.VITE_SENTRY_DSN ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Google Analytics 4</p>
                <p className="text-sm text-muted-foreground">User Analytics</p>
              </div>
              <Badge variant={import.meta.env.VITE_GA4_MEASUREMENT_ID ? 'default' : 'secondary'}>
                {import.meta.env.VITE_GA4_MEASUREMENT_ID ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Environment</p>
                <p className="text-sm text-muted-foreground">Current Mode</p>
              </div>
              <Badge variant="outline">
                {import.meta.env.MODE}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Source Maps</p>
                <p className="text-sm text-muted-foreground">Sentry Upload</p>
              </div>
              <Badge variant={process.env.SENTRY_AUTH_TOKEN ? 'default' : 'secondary'}>
                {process.env.SENTRY_AUTH_TOKEN ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle>Test Results</CardTitle>
              </div>
              <Button onClick={clearResults} variant="ghost" size="sm">
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <Alert key={index} variant={result.type === 'success' ? 'default' : 'destructive'}>
                  <AlertTitle className="flex items-center gap-2">
                    {result.type === 'success' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    {result.type === 'success' ? 'Success' : 'Error'}
                  </AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Verify</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Sentry Verification:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Go to your Sentry dashboard</li>
              <li>Navigate to Issues</li>
              <li>Look for "Test error from monitoring test page"</li>
              <li>Click on the issue to see details, breadcrumbs, and context</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">GA4 Verification:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Go to Google Analytics dashboard</li>
              <li>Navigate to Reports {'>'} Real-time</li>
              <li>Look for events in the real-time view (may take 1-2 minutes)</li>
              <li>For immediate verification, use DebugView (Admin {'>'} DebugView)</li>
              <li>Install Google Analytics Debugger extension for detailed logs</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Console Verification:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Open browser DevTools (F12)</li>
              <li>Go to Console tab</li>
              <li>Look for initialization messages from Sentry and GA4</li>
              <li>Filter by "Sentry" or "Analytics" to see relevant logs</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestMonitoring;

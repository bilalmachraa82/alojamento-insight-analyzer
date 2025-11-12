import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

/**
 * ErrorBoundary Component
 *
 * Catches React errors and displays a user-friendly error page.
 * Automatically reports errors to Sentry.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Report to Sentry
    Sentry.withScope((scope) => {
      scope.setContext('errorBoundary', {
        componentStack: errorInfo.componentStack,
      });

      const eventId = Sentry.captureException(error);
      this.setState({ eventId });
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  handleReportFeedback = () => {
    if (this.state.eventId) {
      Sentry.showReportDialog({ eventId: this.state.eventId });
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
          <Card className="w-full max-w-2xl shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-base mt-2">
                We're sorry, but something unexpected happened. The error has been reported to our team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error details (only in development) */}
              {import.meta.env.MODE === 'development' && this.state.error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <h3 className="font-semibold text-red-900 mb-2">Error Details (Development Only)</h3>
                  <pre className="text-xs text-red-800 overflow-auto max-h-40 whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 flex items-center justify-center gap-2"
                  variant="outline"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Report feedback button (only if Sentry is configured) */}
              {this.state.eventId && (
                <div className="text-center">
                  <Button
                    onClick={this.handleReportFeedback}
                    variant="link"
                    className="text-sm"
                  >
                    Report feedback to our team
                  </Button>
                </div>
              )}

              {/* Help text */}
              <div className="text-center text-sm text-gray-600">
                <p>
                  If the problem persists, please contact support with error ID:{' '}
                  <code className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">
                    {this.state.eventId || 'N/A'}
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper for Sentry's ErrorBoundary with custom fallback
 */
export const SentryErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  showDialog?: boolean;
}> = ({ children, fallback, showDialog = false }) => {
  return (
    <Sentry.ErrorBoundary
      fallback={fallback || <ErrorFallback />}
      showDialog={showDialog}
      beforeCapture={(scope) => {
        scope.setTag('error_boundary', 'sentry_wrapper');
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};

/**
 * Default error fallback component
 */
export const ErrorFallback: React.FC<{
  error?: Error;
  resetError?: () => void;
}> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Oops! Something went wrong
          </CardTitle>
          <CardDescription className="text-base mt-2">
            We're sorry, but something unexpected happened. The error has been reported to our team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error details (only in development) */}
          {import.meta.env.MODE === 'development' && error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <h3 className="font-semibold text-red-900 mb-2">Error Details (Development Only)</h3>
              <pre className="text-xs text-red-800 overflow-auto max-h-40 whitespace-pre-wrap">
                {error.toString()}
              </pre>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {resetError && (
              <Button
                onClick={resetError}
                className="flex-1 flex items-center justify-center gap-2"
                variant="default"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            <Button
              onClick={() => window.location.href = '/'}
              className="flex-1 flex items-center justify-center gap-2"
              variant="outline"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>

          {/* Help text */}
          <div className="text-center text-sm text-gray-600">
            <p>If the problem persists, please contact support.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorBoundary;

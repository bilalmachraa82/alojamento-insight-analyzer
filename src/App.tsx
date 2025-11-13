/**
 * App Component - Main Application Entry Point
 *
 * Performance Optimizations Applied:
 * 1. Route-based code splitting with React.lazy() - reduces initial bundle by ~30-40%
 * 2. Suspense boundaries for progressive loading
 * 3. Optimized QueryClient configuration with smart caching
 * 4. Error tracking with Sentry
 * 5. Analytics tracking with Google Analytics 4
 * 6. GDPR-compliant cookie consent
 * 7. Progressive Web App (PWA) capabilities - offline support & installability
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import React, { Suspense, lazy, useEffect } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ErrorBoundary from "@/components/ErrorBoundary";
import CookieConsent from "@/components/CookieConsent";
import { usePageTracking } from "@/hooks/useAnalytics";
import { registerServiceWorker, setupNetworkListeners } from "@/utils/registerServiceWorker";
import InstallPrompt from "@/components/PWA/InstallPrompt";
import PerformanceMonitor from "@/components/performance/PerformanceMonitor";
import { ThemeProvider } from "@/components/ThemeProvider";

// Lazy load all route components for optimal code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const MySubmissions = lazy(() => import("./pages/MySubmissions"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AnalysisResult = lazy(() => import("./pages/AnalysisResult"));
const TestPremiumPDF = lazy(() => import("./pages/TestPremiumPDF"));
const TestEmails = lazy(() => import("./pages/TestEmails"));
const TestMonitoring = lazy(() => import("./pages/TestMonitoring"));
const Admin = lazy(() => import("./pages/Admin"));
const DebugSubmissions = lazy(() => import("./pages/DebugSubmissions"));

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - reduces unnecessary refetches
      gcTime: 10 * 60 * 1000, // 10 minutes - keeps data in cache longer (formerly cacheTime in v4)
      refetchOnWindowFocus: false, // Prevents refetch on tab focus
      retry: 1, // Reduces retry attempts for faster failure feedback
    },
  },
});

/**
 * PageTracker component to automatically track page views
 */
const PageTracker: React.FC = () => {
  usePageTracking();
  return null;
};

/**
 * PWA Initializer - Register service worker and setup network listeners
 */
const PWAInitializer: React.FC = () => {
  useEffect(() => {
    // Register service worker
    registerServiceWorker({
      onSuccess: (registration) => {
        console.log('[PWA] Service worker registered successfully');
      },
      onUpdate: (registration) => {
        console.log('[PWA] New version available');
      },
    });

    // Setup network status listeners
    setupNetworkListeners({
      onOnline: () => {
        console.log('[PWA] Network connection restored');
      },
      onOffline: () => {
        console.log('[PWA] Network connection lost');
      },
    });
  }, []);

  return null;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <React.StrictMode>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
              <PageTracker />
              <PWAInitializer />
              <PerformanceMonitor />
              {/* Suspense wrapper for lazy-loaded routes with loading fallback */}
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/my-submissions" element={<MySubmissions />} />
                  <Route path="/results/:id" element={<AnalysisResult />} />
                  <Route path="/test-pdf" element={<TestPremiumPDF />} />
                  <Route path="/test-emails" element={<TestEmails />} />
                  <Route path="/test-monitoring" element={<TestMonitoring />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/debug" element={<DebugSubmissions />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <CookieConsent />
              <InstallPrompt />
            </BrowserRouter>
          </TooltipProvider>
        </React.StrictMode>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

/**
 * PWA Install Prompt Component
 *
 * Features:
 * - Detects if app is installable
 * - Shows dismissible install prompt banner
 * - Handles beforeinstallprompt event
 * - Tracks installation analytics
 * - Responsive design with Tailwind CSS
 * - Uses shadcn/ui components for consistency
 */

import React, { useEffect, useState } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Extend Window interface to include beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface InstallPromptProps {
  /** Custom prompt text */
  promptText?: string;
  /** Show/hide the prompt */
  show?: boolean;
  /** Callback when user installs */
  onInstall?: () => void;
  /** Callback when user dismisses */
  onDismiss?: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  promptText = 'Install our app for a better experience!',
  show = true,
  onInstall,
  onDismiss,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('[PWA] App is already installed');
      setIsInstalled(true);
      return;
    }

    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check local storage for dismissed state
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem('pwa-install-dismissed');
      }
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('[PWA] beforeinstallprompt event fired');

      // Prevent the default mini-infobar from appearing
      e.preventDefault();

      // Store the event for later use
      setDeferredPrompt(e);
      setIsInstallable(true);

      // Track event in analytics
      trackEvent('pwa_install_prompt_shown');
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);

      // Track installation in analytics
      trackEvent('pwa_installed');

      if (onInstall) {
        onInstall();
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstall]);

  /**
   * Handle install button click
   */
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No deferred prompt available');
      return;
    }

    console.log('[PWA] Showing install prompt');

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for user response
    const choiceResult = await deferredPrompt.userChoice;

    console.log('[PWA] User choice:', choiceResult.outcome);

    // Track user choice in analytics
    trackEvent('pwa_install_prompt_result', {
      outcome: choiceResult.outcome,
      platform: choiceResult.platform,
    });

    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
      handleDismiss();
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  /**
   * Handle dismiss button click
   */
  const handleDismiss = () => {
    console.log('[PWA] Install prompt dismissed');
    setIsDismissed(true);

    // Store dismissed state in localStorage
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());

    // Track dismissal in analytics
    trackEvent('pwa_install_prompt_dismissed');

    if (onDismiss) {
      onDismiss();
    }
  };

  /**
   * Track analytics events
   */
  const trackEvent = (eventName: string, params?: Record<string, any>) => {
    // Integration with Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, params);
    }

    // Log for debugging
    console.log('[PWA Analytics]', eventName, params);
  };

  // Don't show if:
  // - Already installed
  // - Not installable
  // - Dismissed recently
  // - Explicitly hidden via props
  if (isInstalled || !isInstallable || isDismissed || !show) {
    return null;
  }

  // Show iOS-specific instructions if on iOS
  if (isIOS) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 shadow-lg border-2 border-blue-500 bg-white">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Install App</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm text-gray-700 mb-3">
            Install this app on your iPhone:
          </p>

          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Tap the Share button in Safari</li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" to install</li>
          </ol>
        </div>
      </Card>
    );
  }

  // Show standard install prompt for other browsers
  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 shadow-lg border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Install App</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-700 mb-4">{promptText}</p>

        <div className="flex gap-2">
          <Button
            onClick={handleInstallClick}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Install Now
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Maybe Later
          </Button>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <ul className="text-xs text-gray-600 space-y-1">
            <li className="flex items-center gap-1">
              <span className="text-green-600">✓</span>
              <span>Works offline</span>
            </li>
            <li className="flex items-center gap-1">
              <span className="text-green-600">✓</span>
              <span>Fast & reliable</span>
            </li>
            <li className="flex items-center gap-1">
              <span className="text-green-600">✓</span>
              <span>Add to home screen</span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default InstallPrompt;

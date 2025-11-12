import React, { useState, useEffect } from 'react';
import { Cookie, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { setAnalyticsCookieConsent, getAnalyticsCookieConsent, initGA4 } from '@/config/analytics';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = 'cookie_consent_given';
const COOKIE_PREFERENCES_KEY = 'cookie_preferences';

/**
 * Cookie Consent Banner Component
 *
 * GDPR-compliant cookie consent banner that allows users to control
 * their privacy preferences for analytics and marketing cookies.
 */
export const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always enabled
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const consentGiven = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
        applyPreferences(parsed);
      } catch (error) {
        console.error('Failed to parse cookie preferences:', error);
      }
    }

    // Show banner if consent not given
    if (!consentGiven) {
      setShowBanner(true);
    }
  }, []);

  const applyPreferences = (prefs: CookiePreferences) => {
    // Update analytics consent
    setAnalyticsCookieConsent(prefs.analytics);

    // Initialize GA4 if analytics are enabled
    if (prefs.analytics) {
      initGA4();
    }

    // Here you could add logic for marketing cookies
    // e.g., load Facebook Pixel, Google Ads, etc.
  };

  const handleAcceptAll = () => {
    const newPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };

    setPreferences(newPreferences);
    savePreferences(newPreferences);
    applyPreferences(newPreferences);
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    const newPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };

    setPreferences(newPreferences);
    savePreferences(newPreferences);
    applyPreferences(newPreferences);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
    applyPreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Can't disable necessary cookies

    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom-5">
        <Card className="mx-auto max-w-4xl shadow-2xl border-2">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Cookie className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Cookie Preferences</CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    We use cookies to enhance your experience and analyze site traffic.
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleAcceptNecessary}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We use cookies to improve your browsing experience, analyze site traffic, and personalize content.
              By clicking "Accept All", you consent to our use of cookies.
              You can customize your preferences or decline non-essential cookies.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAcceptAll}
                className="flex-1"
                size="sm"
              >
                Accept All
              </Button>

              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Customize
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Cookie Preferences</DialogTitle>
                    <DialogDescription>
                      Manage your cookie preferences. Necessary cookies are always enabled as they are
                      essential for the website to function properly.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Necessary Cookies */}
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex-1">
                        <Label className="text-base font-semibold">Necessary Cookies</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Essential cookies required for the website to function properly.
                          These cannot be disabled.
                        </p>
                      </div>
                      <Switch
                        checked={preferences.necessary}
                        disabled
                        className="mt-1"
                      />
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex-1">
                        <Label className="text-base font-semibold">Analytics Cookies</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Help us understand how visitors interact with our website by collecting
                          and reporting information anonymously.
                        </p>
                      </div>
                      <Switch
                        checked={preferences.analytics}
                        onCheckedChange={() => togglePreference('analytics')}
                        className="mt-1"
                      />
                    </div>

                    {/* Marketing Cookies */}
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex-1">
                        <Label className="text-base font-semibold">Marketing Cookies</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Used to track visitors across websites to display relevant advertisements
                          and measure their effectiveness.
                        </p>
                      </div>
                      <Switch
                        checked={preferences.marketing}
                        onCheckedChange={() => togglePreference('marketing')}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleSavePreferences} className="flex-1">
                      Save Preferences
                    </Button>
                    <Button onClick={handleAcceptNecessary} variant="outline" className="flex-1">
                      Accept Necessary Only
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    For more information, read our{' '}
                    <a href="/privacy-policy" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                    {' '}and{' '}
                    <a href="/cookie-policy" className="text-primary hover:underline">
                      Cookie Policy
                    </a>
                    .
                  </p>
                </DialogContent>
              </Dialog>

              <Button
                onClick={handleAcceptNecessary}
                variant="ghost"
                className="flex-1"
                size="sm"
              >
                Necessary Only
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Learn more in our{' '}
              <a href="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

/**
 * Cookie Settings Button
 *
 * A button that allows users to change their cookie preferences at any time.
 * Can be placed in footer or settings page.
 */
export const CookieSettingsButton: React.FC<{
  className?: string;
}> = ({ className }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Failed to parse cookie preferences:', error);
      }
    }
  }, []);

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return;

    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences));
    setAnalyticsCookieConsent(preferences.analytics);

    if (preferences.analytics) {
      initGA4();
    }

    setShowSettings(false);
  };

  return (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Cookie className="h-4 w-4 mr-2" />
          Cookie Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription>
            Manage your cookie preferences. Changes will take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-start justify-between space-x-4">
            <div className="flex-1">
              <Label className="text-base font-semibold">Necessary Cookies</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Essential cookies required for the website to function properly.
              </p>
            </div>
            <Switch checked={preferences.necessary} disabled className="mt-1" />
          </div>

          <div className="flex items-start justify-between space-x-4">
            <div className="flex-1">
              <Label className="text-base font-semibold">Analytics Cookies</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Help us understand how visitors interact with our website.
              </p>
            </div>
            <Switch
              checked={preferences.analytics}
              onCheckedChange={() => togglePreference('analytics')}
              className="mt-1"
            />
          </div>

          <div className="flex items-start justify-between space-x-4">
            <div className="flex-1">
              <Label className="text-base font-semibold">Marketing Cookies</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Used to track visitors across websites for advertising purposes.
              </p>
            </div>
            <Switch
              checked={preferences.marketing}
              onCheckedChange={() => togglePreference('marketing')}
              className="mt-1"
            />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Preferences
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CookieConsent;

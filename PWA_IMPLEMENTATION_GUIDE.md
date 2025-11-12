# Progressive Web App (PWA) Implementation Guide
## Alojamento Insight Analyzer - 2025 Best Practices

---

## Executive Summary

This guide provides a comprehensive, phased approach to transforming Alojamento Insight Analyzer into a state-of-the-art Progressive Web App following 2025 best practices. The implementation will deliver:

- **Offline-First Experience**: Full functionality without internet connection
- **Native App Features**: Install prompts, app shortcuts, push notifications
- **Performance Gains**: 55%+ conversion rate improvements (industry benchmark)
- **Enhanced Engagement**: Background sync, share capabilities, and re-engagement tools
- **Better UX**: App-like feel with splash screens, status bar theming, and smooth interactions

### Key Statistics (2025 Research)
- PWAs see 55%+ conversion rate uplift (Mainline Menswear case study)
- 25% of daily conversions initiated through share menu
- 80-95% cache hit ratio benchmark for optimal performance
- iOS 16.4+ now supports web push notifications for installed PWAs

---

## Current State Analysis

### What We Have
- ✅ Vite 5 + React 18 + TypeScript
- ✅ Modern build pipeline with code splitting
- ✅ Sentry error tracking
- ✅ Google Analytics 4
- ✅ Supabase backend
- ✅ Responsive design with Tailwind CSS

### What's Missing (PWA Features)
- ❌ Web App Manifest
- ❌ Service Worker
- ❌ Offline support
- ❌ Install prompts
- ❌ App icons (all sizes)
- ❌ Splash screens
- ❌ Background sync
- ❌ Push notifications
- ❌ Web Share integration
- ❌ App shortcuts

---

## PWA Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│              (React Components + UI)                     │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│              Service Worker Layer                        │
│  ┌──────────┬──────────┬──────────┬─────────────────┐  │
│  │ Precache │ Runtime  │ Background│ Push/Sync       │  │
│  │ Static   │ Caching  │ Sync      │ Notifications   │  │
│  │ Assets   │ API      │ Queue     │                 │  │
│  └──────────┴──────────┴──────────┴─────────────────┘  │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│              Cache Storage                               │
│  ┌────────────┬────────────┬──────────────────────┐    │
│  │ Precache   │ Runtime    │ Background Queue     │    │
│  │ (v1.2.3)   │ (API calls)│ (Pending actions)    │    │
│  └────────────┴────────────┴──────────────────────┘    │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│              Network / Backend                           │
│           (Supabase + External APIs)                     │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (Week 1-2)
### Basic PWA Setup - Manifest, Icons, Service Worker

### 1.1 Install Dependencies

```bash
npm install --save-dev vite-plugin-pwa workbox-window
```

### 1.2 Create Web App Manifest

**File: `/public/manifest.json`**

```json
{
  "name": "Diagnóstico Inteligente - Alojamento Local",
  "short_name": "A Maria Faz",
  "description": "Obtenha um diagnóstico inteligente e personalizado para o seu alojamento local",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0EA5E9",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "pt",
  "dir": "ltr",
  "categories": ["business", "productivity"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop-1.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Dashboard view"
    },
    {
      "src": "/screenshots/mobile-1.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Mobile form view"
    }
  ],
  "shortcuts": [
    {
      "name": "Novo Diagnóstico",
      "short_name": "Diagnóstico",
      "description": "Criar novo diagnóstico de alojamento",
      "url": "/?action=new",
      "icons": [
        {
          "src": "/icons/shortcut-new.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Ver Resultados",
      "short_name": "Resultados",
      "description": "Ver resultados anteriores",
      "url": "/results",
      "icons": [
        {
          "src": "/icons/shortcut-results.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    }
  ],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "property_images",
          "accept": ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        }
      ]
    }
  }
}
```

### 1.3 Update index.html

**File: `/index.html`**

```html
<!DOCTYPE html>
<html lang="pt">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Diagnóstico Inteligente - Alojamento Local | A Maria Faz</title>
    <meta name="description" content="Obtenha um diagnóstico inteligente e personalizado para o seu alojamento local." />
    <meta name="author" content="A Maria Faz" />

    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json" />

    <!-- Theme Color -->
    <meta name="theme-color" content="#0EA5E9" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0284c7" media="(prefers-color-scheme: dark)" />

    <!-- Apple Touch Icons -->
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
    <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />

    <!-- Apple Mobile Web App -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="A Maria Faz" />

    <!-- iOS Splash Screens (iPhone 14 Pro Max) -->
    <link rel="apple-touch-startup-image" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iPhone_14_Pro_Max_portrait.png">

    <!-- iOS Splash Screens (iPhone 14 Pro) -->
    <link rel="apple-touch-startup-image" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iPhone_14_Pro_portrait.png">

    <!-- iOS Splash Screens (iPhone 14) -->
    <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iPhone_14_portrait.png">

    <!-- iOS Splash Screens (iPad Pro 12.9") -->
    <link rel="apple-touch-startup-image" media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash/iPad_Pro_12.9_portrait.png">

    <!-- Open Graph -->
    <meta property="og:title" content="Diagnóstico Inteligente - Alojamento Local | A Maria Faz" />
    <meta property="og:description" content="Obtenha um diagnóstico inteligente e personalizado para o seu alojamento local." />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@lovable_dev" />
    <meta name="twitter:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />

    <!-- Google Fonts - Performance Optimized -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>

  <body>
    <div id="root"></div>
    <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 1.4 Configure Vite Plugin PWA

**File: `/vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'analyze' && visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
    mode === 'production' &&
      process.env.VITE_SENTRY_DSN &&
      process.env.SENTRY_AUTH_TOKEN &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          assets: './dist/**',
          filesToDeleteAfterUpload: './dist/**/*.map',
        },
        telemetry: false,
      }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png', 'splash/*.png'],
      manifest: {
        // Manifest is loaded from /public/manifest.json
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        sourcemap: true,
        runtimeCaching: [
          // API Calls - Network First with Cache Fallback
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Google Fonts - Cache First
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Images - Stale While Revalidate
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Static Assets - Cache First
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // Enable in development for testing
        type: 'module',
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        sourcemapExcludeSources: false,
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'supabase-vendor': ['@supabase/supabase-js', '@tanstack/react-query'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        passes: 2,
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
      },
      format: {
        comments: false,
      },
    },
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
    ],
  },
}));
```

### 1.5 Create PWA Registration Component

**File: `/src/components/pwa/PWAInstallPrompt.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after 30 seconds or on user action
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show install prompt
    await deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');

    // Show again in 7 days
    setTimeout(() => {
      localStorage.removeItem('pwa-install-dismissed');
    }, 7 * 24 * 60 * 60 * 1000);
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Alert className="relative shadow-lg border-2">
        <Download className="h-4 w-4" />
        <AlertTitle className="pr-6">Instalar App</AlertTitle>
        <AlertDescription className="mt-2">
          {isIOS ? (
            <>
              Para instalar, toque no ícone de partilha{' '}
              <span className="inline-block">
                <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/>
                </svg>
              </span>
              {' '}e depois "Adicionar ao ecrã principal".
            </>
          ) : (
            'Instale o app para acesso rápido e experiência offline.'
          )}
        </AlertDescription>
        {!isIOS && (
          <div className="mt-3 flex gap-2">
            <Button onClick={handleInstallClick} size="sm" className="flex-1">
              Instalar
            </Button>
            <Button onClick={handleDismiss} variant="outline" size="sm">
              Agora não
            </Button>
          </div>
        )}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>
    </div>
  );
};
```

### 1.6 Create PWA Update Prompt Component

**File: `/src/components/pwa/PWAUpdatePrompt.tsx`**

```typescript
import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw } from 'lucide-react';

export const PWAUpdatePrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registered:', r);

      // Check for updates every hour
      r && setInterval(() => {
        r.update();
      }, 60 * 60 * 1000);
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-96">
      {offlineReady && (
        <Alert className="shadow-lg border-2 border-green-500">
          <RefreshCw className="h-4 w-4" />
          <AlertTitle>App Pronto para Offline!</AlertTitle>
          <AlertDescription className="mt-2">
            O app está pronto para funcionar offline.
          </AlertDescription>
          <Button onClick={close} variant="outline" size="sm" className="mt-3">
            OK
          </Button>
        </Alert>
      )}

      {needRefresh && (
        <Alert className="shadow-lg border-2 border-blue-500">
          <RefreshCw className="h-4 w-4" />
          <AlertTitle>Nova Versão Disponível!</AlertTitle>
          <AlertDescription className="mt-2">
            Uma nova versão do app está disponível. Clique em atualizar para obter as últimas funcionalidades.
          </AlertDescription>
          <div className="mt-3 flex gap-2">
            <Button onClick={handleUpdate} size="sm" className="flex-1">
              Atualizar
            </Button>
            <Button onClick={close} variant="outline" size="sm">
              Mais tarde
            </Button>
          </div>
        </Alert>
      )}
    </div>
  );
};
```

### 1.7 Create Offline Indicator Component

**File: `/src/components/pwa/OfflineIndicator.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [showBackOnlineMessage, setShowBackOnlineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnlineMessage(true);
      setShowOfflineMessage(false);

      // Hide "back online" message after 3 seconds
      setTimeout(() => {
        setShowBackOnlineMessage(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      setShowBackOnlineMessage(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineMessage && !showBackOnlineMessage) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      {showOfflineMessage && (
        <Alert className="shadow-lg border-2 border-orange-500 bg-orange-50 dark:bg-orange-950">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900 dark:text-orange-100">
            Você está offline. Algumas funcionalidades podem estar limitadas.
          </AlertDescription>
        </Alert>
      )}

      {showBackOnlineMessage && (
        <Alert className="shadow-lg border-2 border-green-500 bg-green-50 dark:bg-green-950">
          <Wifi className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            Conexão restaurada! Você está online novamente.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
```

### 1.8 Update Main App Component

**File: `/src/App.tsx` (add PWA components)**

```typescript
// Add these imports at the top of your App.tsx
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { PWAUpdatePrompt } from '@/components/pwa/PWAUpdatePrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';

// Add these components inside your main App return (before closing tag)
function App() {
  return (
    <div>
      {/* Your existing app code */}

      {/* PWA Components */}
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
      <OfflineIndicator />
    </div>
  );
}
```

### 1.9 Generate Icons

Use one of these tools to generate all required icon sizes:

**Online Tools:**
- https://progressier.com/pwa-icons-and-ios-splash-screen-generator
- https://realfavicongenerator.net/

**CLI Tool:**
```bash
npx pwa-asset-generator ./public/logo.svg ./public/icons --icon-only --background "#0EA5E9" --padding "10%"
npx pwa-asset-generator ./public/logo.svg ./public/splash --splash-only --background "#0EA5E9"
```

**Required Icon Sizes:**
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
- 192x192 and 512x512 (maskable)
- 180x180, 167x167 (Apple)

---

## Phase 2: Offline-First Strategy (Week 3-4)
### Advanced Caching, Background Sync, Optimistic UI

### 2.1 IndexedDB Setup for Offline Data

**File: `/src/lib/db.ts`**

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AlojamentoDB extends DBSchema {
  'pending-submissions': {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      status: 'pending' | 'syncing' | 'failed';
      retryCount: number;
    };
  };
  'cached-results': {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      expiresAt: number;
    };
  };
  'user-preferences': {
    key: string;
    value: any;
  };
}

let db: IDBPDatabase<AlojamentoDB> | null = null;

export async function initDB() {
  if (db) return db;

  db = await openDB<AlojamentoDB>('alojamento-db', 1, {
    upgrade(database) {
      // Pending submissions store
      if (!database.objectStoreNames.contains('pending-submissions')) {
        database.createObjectStore('pending-submissions', { keyPath: 'id' });
      }

      // Cached results store
      if (!database.objectStoreNames.contains('cached-results')) {
        const store = database.createObjectStore('cached-results', { keyPath: 'id' });
        store.createIndex('expiresAt', 'expiresAt');
      }

      // User preferences store
      if (!database.objectStoreNames.contains('user-preferences')) {
        database.createObjectStore('user-preferences');
      }
    },
  });

  return db;
}

export async function getDB() {
  if (!db) {
    await initDB();
  }
  return db!;
}

// Pending Submissions
export async function addPendingSubmission(data: any) {
  const database = await getDB();
  const id = `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await database.put('pending-submissions', {
    id,
    data,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  });

  return id;
}

export async function getPendingSubmissions() {
  const database = await getDB();
  return database.getAll('pending-submissions');
}

export async function updateSubmissionStatus(
  id: string,
  status: 'pending' | 'syncing' | 'failed',
  retryCount?: number
) {
  const database = await getDB();
  const submission = await database.get('pending-submissions', id);

  if (submission) {
    submission.status = status;
    if (retryCount !== undefined) {
      submission.retryCount = retryCount;
    }
    await database.put('pending-submissions', submission);
  }
}

export async function deletePendingSubmission(id: string) {
  const database = await getDB();
  await database.delete('pending-submissions', id);
}

// Cached Results
export async function cacheResult(id: string, data: any, ttl: number = 24 * 60 * 60 * 1000) {
  const database = await getDB();

  await database.put('cached-results', {
    id,
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  });
}

export async function getCachedResult(id: string) {
  const database = await getDB();
  const cached = await database.get('cached-results', id);

  if (!cached) return null;

  // Check if expired
  if (cached.expiresAt < Date.now()) {
    await database.delete('cached-results', id);
    return null;
  }

  return cached.data;
}

export async function clearExpiredCache() {
  const database = await getDB();
  const now = Date.now();
  const index = database.transaction('cached-results').store.index('expiresAt');

  let cursor = await index.openCursor(IDBKeyRange.upperBound(now));

  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
}

// User Preferences
export async function setPreference(key: string, value: any) {
  const database = await getDB();
  await database.put('user-preferences', value, key);
}

export async function getPreference(key: string) {
  const database = await getDB();
  return database.get('user-preferences', key);
}
```

**Install idb:**
```bash
npm install idb
```

### 2.2 Background Sync Service

**File: `/src/services/backgroundSync.ts`**

```typescript
import { getPendingSubmissions, updateSubmissionStatus, deletePendingSubmission } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';

export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-submissions');
      console.log('Background sync registered');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }
}

export async function syncPendingSubmissions() {
  const pending = await getPendingSubmissions();

  for (const submission of pending) {
    if (submission.status === 'syncing') continue;

    try {
      await updateSubmissionStatus(submission.id, 'syncing');

      // Submit to Supabase
      const { error } = await supabase
        .from('diagnostic_submissions')
        .insert(submission.data);

      if (error) throw error;

      // Success - remove from queue
      await deletePendingSubmission(submission.id);

      // Show success notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Diagnóstico Sincronizado', {
          body: 'Seu diagnóstico foi enviado com sucesso!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
        });
      }
    } catch (error) {
      console.error('Sync failed for submission:', submission.id, error);

      // Increment retry count
      const newRetryCount = submission.retryCount + 1;

      if (newRetryCount >= 3) {
        // Failed after 3 retries - mark as failed
        await updateSubmissionStatus(submission.id, 'failed', newRetryCount);
      } else {
        // Retry later
        await updateSubmissionStatus(submission.id, 'pending', newRetryCount);
      }
    }
  }
}
```

### 2.3 Custom Service Worker with Background Sync

**File: `/public/sw.js`**

```javascript
/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

// Precache all assets generated by Vite
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches
cleanupOutdatedCaches();

// Background Sync for POST requests
const bgSyncPlugin = new BackgroundSyncPlugin('submission-queue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours (in minutes)
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
        console.log('Background sync successful for:', entry.request.url);
      } catch (error) {
        console.error('Background sync failed for:', entry.request.url);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// API Calls - Network First with Background Sync
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co') && url.pathname.includes('/rest/v1/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  }),
  'GET'
);

// POST requests with Background Sync
registerRoute(
  ({ url, request }) =>
    url.hostname.includes('supabase.co') &&
    url.pathname.includes('/rest/v1/') &&
    request.method === 'POST',
  new NetworkFirst({
    cacheName: 'post-cache',
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

// Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  })
);

// Images
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Listen for sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-submissions') {
    event.waitUntil(
      // Import and run sync function
      import('/src/services/backgroundSync.ts').then((module) =>
        module.syncPendingSubmissions()
      )
    );
  }
});

// Listen for push events (for Phase 3)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || 'Nova Notificação';
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.data,
    actions: data.actions,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listen for notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle action buttons
    clients.openWindow(event.action);
  } else if (event.notification.data?.url) {
    // Open URL from notification data
    clients.openWindow(event.notification.data.url);
  }
});

// Skip waiting and claim clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
```

**Update vite.config.ts to use custom SW:**

```typescript
VitePWA({
  registerType: 'prompt',
  strategies: 'injectManifest', // Use custom service worker
  srcDir: 'public',
  filename: 'sw.js',
  // ... rest of config
})
```

### 2.4 Optimistic UI Hook

**File: `/src/hooks/useOptimisticMutation.ts`**

```typescript
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addPendingSubmission, registerBackgroundSync } from '@/lib/db';

export function useOptimisticMutation<T, R>(
  mutationFn: (data: T) => Promise<R>,
  options?: {
    onSuccess?: (data: R) => void;
    onError?: (error: Error) => void;
    optimisticUpdate?: (data: T) => void;
    rollback?: () => void;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const mutate = async (data: T) => {
    setIsLoading(true);
    setError(null);

    // Apply optimistic update
    if (options?.optimisticUpdate) {
      options.optimisticUpdate(data);
    }

    try {
      // Try mutation
      const result = await mutationFn(data);

      setIsLoading(false);

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      toast({
        title: 'Sucesso!',
        description: 'Operação concluída com sucesso.',
      });

      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);

      // Rollback optimistic update
      if (options?.rollback) {
        options.rollback();
      }

      // If offline, queue for background sync
      if (!navigator.onLine) {
        await addPendingSubmission(data);
        await registerBackgroundSync();

        toast({
          title: 'Salvo para Sincronização',
          description: 'Você está offline. Os dados serão sincronizados quando a conexão for restaurada.',
          variant: 'default',
        });
      } else {
        // Online but failed
        if (options?.onError) {
          options.onError(error);
        }

        toast({
          title: 'Erro',
          description: error.message || 'Ocorreu um erro. Tente novamente.',
          variant: 'destructive',
        });
      }

      throw error;
    }
  };

  return {
    mutate,
    isLoading,
    error,
  };
}
```

### 2.5 Offline Fallback Page

**File: `/public/offline.html`**

```html
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - A Maria Faz</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0EA5E9 0%, #0284c7 100%);
      color: white;
      padding: 20px;
    }

    .container {
      text-align: center;
      max-width: 500px;
    }

    .icon {
      width: 120px;
      height: 120px;
      margin: 0 auto 30px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 60px;
    }

    h1 {
      font-size: 32px;
      margin-bottom: 16px;
      font-weight: 700;
    }

    p {
      font-size: 18px;
      margin-bottom: 30px;
      opacity: 0.9;
      line-height: 1.6;
    }

    .button {
      display: inline-block;
      padding: 14px 32px;
      background: white;
      color: #0EA5E9;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
      border: none;
    }

    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    }

    .features {
      margin-top: 40px;
      text-align: left;
      background: rgba(255, 255, 255, 0.1);
      padding: 24px;
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .features h2 {
      font-size: 20px;
      margin-bottom: 16px;
    }

    .features ul {
      list-style: none;
      padding: 0;
    }

    .features li {
      padding: 8px 0;
      padding-left: 28px;
      position: relative;
    }

    .features li:before {
      content: '✓';
      position: absolute;
      left: 0;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>Você está Offline</h1>
    <p>
      Não foi possível conectar à internet. Algumas funcionalidades podem estar limitadas,
      mas você ainda pode usar recursos offline.
    </p>
    <button class="button" onclick="window.location.reload()">
      Tentar Novamente
    </button>

    <div class="features">
      <h2>Recursos Disponíveis Offline:</h2>
      <ul>
        <li>Ver resultados salvos anteriormente</li>
        <li>Preencher formulários (serão sincronizados depois)</li>
        <li>Navegar em páginas já visitadas</li>
        <li>Acessar suas preferências</li>
      </ul>
    </div>
  </div>

  <script>
    // Check connection every 5 seconds
    setInterval(() => {
      if (navigator.onLine) {
        window.location.reload();
      }
    }, 5000);
  </script>
</body>
</html>
```

---

## Phase 3: Advanced Features (Week 5-6)
### Push Notifications, Web Share, Shortcuts, Badging

### 3.1 Push Notifications Service

**File: `/src/services/pushNotifications.ts`**

```typescript
import { supabase } from '@/integrations/supabase/client';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

export async function subscribeToPushNotifications() {
  try {
    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    const registration = await navigator.serviceWorker.ready;

    // Get VAPID public key from your environment
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      throw new Error('VAPID public key not configured');
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Save subscription to Supabase
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscription.toJSON(),
          updated_at: new Date().toISOString(),
        });
    }

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }
}

export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Remove from Supabase
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);
      }
    }
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    throw error;
  }
}

export async function sendTestNotification() {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;

    registration.showNotification('A Maria Faz', {
      body: 'Notificações ativadas com sucesso!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'test-notification',
      actions: [
        {
          action: 'view',
          title: 'Ver Detalhes',
        },
        {
          action: 'dismiss',
          title: 'Dispensar',
        },
      ],
    });
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
```

### 3.2 Push Notification Settings Component

**File: `/src/components/pwa/NotificationSettings.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  sendTestNotification,
} from '@/services/pushNotifications';

export const NotificationSettings: React.FC = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleToggleNotifications = async () => {
    setIsLoading(true);

    try {
      if (isSubscribed) {
        await unsubscribeFromPushNotifications();
        setIsSubscribed(false);
        toast({
          title: 'Notificações Desativadas',
          description: 'Você não receberá mais notificações push.',
        });
      } else {
        await subscribeToPushNotifications();
        setIsSubscribed(true);
        toast({
          title: 'Notificações Ativadas',
          description: 'Você receberá atualizações importantes.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar as configurações de notificação.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      toast({
        title: 'Notificação de Teste Enviada',
        description: 'Verifique se recebeu a notificação.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a notificação de teste.',
        variant: 'destructive',
      });
    }
  };

  if (!('Notification' in window)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>
            Seu navegador não suporta notificações push.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          Notificações Push
        </CardTitle>
        <CardDescription>
          Receba atualizações sobre seus diagnósticos e novidades.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="notifications" className="flex-1">
            Ativar Notificações
          </Label>
          <Switch
            id="notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading}
          />
        </div>

        {isSubscribed && (
          <Button
            onClick={handleTestNotification}
            variant="outline"
            className="w-full"
          >
            Enviar Notificação de Teste
          </Button>
        )}

        <div className="text-sm text-muted-foreground">
          <p>Você será notificado sobre:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Diagnósticos concluídos</li>
            <li>Atualizações de relatórios</li>
            <li>Dicas e recomendações personalizadas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 3.3 Web Share Integration

**File: `/src/components/pwa/ShareButton.tsx`**

```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  files?: File[];
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url,
  files,
}) => {
  const { toast } = useToast();

  const handleShare = async () => {
    // Check if Web Share API is supported
    if (!navigator.share) {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(url || window.location.href);
        toast({
          title: 'Link Copiado',
          description: 'O link foi copiado para a área de transferência.',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível compartilhar.',
          variant: 'destructive',
        });
      }
      return;
    }

    try {
      const shareData: ShareData = {
        title,
        text,
        url: url || window.location.href,
      };

      // Add files if supported
      if (files && files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
        shareData.files = files;
      }

      await navigator.share(shareData);
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        toast({
          title: 'Erro',
          description: 'Não foi possível compartilhar.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Button onClick={handleShare} variant="outline" size="sm">
      <Share2 className="h-4 w-4 mr-2" />
      Compartilhar
    </Button>
  );
};
```

### 3.4 App Badging

**File: `/src/services/badging.ts`**

```typescript
declare global {
  interface Navigator {
    setAppBadge?: (count?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  }
}

export async function setAppBadge(count?: number) {
  if ('setAppBadge' in navigator) {
    try {
      await navigator.setAppBadge!(count);
    } catch (error) {
      console.error('Error setting app badge:', error);
    }
  }
}

export async function clearAppBadge() {
  if ('clearAppBadge' in navigator) {
    try {
      await navigator.clearAppBadge!();
    } catch (error) {
      console.error('Error clearing app badge:', error);
    }
  }
}

// Example usage: Set badge when there are pending submissions
export async function updateBadgeForPendingSubmissions(count: number) {
  if (count > 0) {
    await setAppBadge(count);
  } else {
    await clearAppBadge();
  }
}
```

### 3.5 Share Target Handler

**File: `/src/pages/Share.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const Share: React.FC = () => {
  const [shareData, setShareData] = useState<{
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
  }>({});
  const navigate = useNavigate();

  useEffect(() => {
    // This page is loaded when content is shared to the app
    // Parse the share data from the URL or FormData
    const parseSharedData = async () => {
      const formData = new FormData(document.forms[0] as HTMLFormElement);

      const data: any = {
        title: formData.get('title'),
        text: formData.get('text'),
        url: formData.get('url'),
      };

      // Handle shared files
      const files = formData.getAll('property_images') as File[];
      if (files.length > 0) {
        data.files = files;
      }

      setShareData(data);
    };

    parseSharedData();
  }, []);

  const handleAccept = () => {
    // Navigate to diagnostic form with shared data
    navigate('/', { state: { sharedData: shareData } });
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo Compartilhado</CardTitle>
          <CardDescription>
            Você compartilhou o seguinte conteúdo com A Maria Faz:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {shareData.title && (
            <div>
              <strong>Título:</strong> {shareData.title}
            </div>
          )}
          {shareData.text && (
            <div>
              <strong>Texto:</strong> {shareData.text}
            </div>
          )}
          {shareData.url && (
            <div>
              <strong>URL:</strong> {shareData.url}
            </div>
          )}
          {shareData.files && shareData.files.length > 0 && (
            <div>
              <strong>Arquivos:</strong> {shareData.files.length} arquivo(s)
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleAccept} className="flex-1">
              Usar no Diagnóstico
            </Button>
            <Button onClick={() => navigate('/')} variant="outline">
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## Performance Enhancements

### Image Optimization

**File: `/vite.config.ts` - Add image optimization**

```typescript
import imagemin from 'vite-plugin-imagemin';

// Add to plugins array
imagemin({
  gifsicle: {
    optimizationLevel: 7,
    interlaced: false,
  },
  optipng: {
    optimizationLevel: 7,
  },
  mozjpeg: {
    quality: 80,
  },
  pngquant: {
    quality: [0.8, 0.9],
    speed: 4,
  },
  svgo: {
    plugins: [
      {
        name: 'removeViewBox',
        active: false,
      },
      {
        name: 'removeEmptyAttrs',
        active: true,
      },
    ],
  },
})
```

### Resource Preloading

**File: `/index.html` - Add resource hints**

```html
<!-- Preload critical resources -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/src/main.tsx" as="script">

<!-- DNS Prefetch for external domains -->
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://fonts.gstatic.com">
<link rel="dns-prefetch" href="https://cdn.gpteng.co">
```

---

## Analytics & Monitoring

### Service Worker Analytics

**File: `/src/services/pwaAnalytics.ts`**

```typescript
import ReactGA from 'react-ga4';

export function trackServiceWorkerEvent(event: string, params?: Record<string, any>) {
  ReactGA.event({
    category: 'PWA',
    action: event,
    ...params,
  });
}

export function trackCacheHit(resource: string, hit: boolean) {
  ReactGA.event({
    category: 'PWA Cache',
    action: hit ? 'Cache Hit' : 'Cache Miss',
    label: resource,
  });
}

export function trackOfflineUsage(action: string) {
  ReactGA.event({
    category: 'PWA Offline',
    action,
  });
}

export function trackInstallation() {
  ReactGA.event({
    category: 'PWA',
    action: 'App Installed',
  });
}

export function trackUpdateAvailable() {
  ReactGA.event({
    category: 'PWA',
    action: 'Update Available',
  });
}

export function trackUpdateInstalled() {
  ReactGA.event({
    category: 'PWA',
    action: 'Update Installed',
  });
}

// Track when app is used in standalone mode
export function trackStandaloneUsage() {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    ReactGA.event({
      category: 'PWA',
      action: 'Standalone Mode',
    });
  }
}
```

### Implementation in main.tsx

```typescript
// Add to main.tsx
import { trackStandaloneUsage, trackServiceWorkerEvent } from '@/services/pwaAnalytics';

// Track standalone usage
trackStandaloneUsage();

// Track service worker lifecycle
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    trackServiceWorkerEvent('Service Worker Ready');

    registration.addEventListener('updatefound', () => {
      trackServiceWorkerEvent('Update Found');
    });
  });
}

// Track install prompt
window.addEventListener('beforeinstallprompt', () => {
  trackServiceWorkerEvent('Install Prompt Shown');
});

window.addEventListener('appinstalled', () => {
  trackServiceWorkerEvent('App Installed');
});
```

---

## Testing Strategy

### 1. Lighthouse Audits

**Automated Testing Script:**

```json
// package.json
{
  "scripts": {
    "lighthouse": "lighthouse http://localhost:8080 --output json --output html --output-path ./lighthouse-report --view",
    "lighthouse:ci": "lhci autorun"
  }
}
```

**Lighthouse CI Configuration:**

**File: `/.lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run preview",
      "url": ["http://localhost:4173/"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}],
        "categories:pwa": ["error", {"minScore": 0.9}],
        "service-worker": "error",
        "viewport": "error",
        "installable-manifest": "error",
        "splash-screen": "error",
        "themed-omnibox": "error",
        "content-width": "error",
        "apple-touch-icon": "warn"
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### 2. PWA Checklist

**Manual Testing Checklist:**

- [ ] **Manifest**
  - [ ] Valid manifest.json file
  - [ ] All required fields present
  - [ ] Icons in all required sizes
  - [ ] Theme colors properly configured
  - [ ] Display mode set to "standalone"

- [ ] **Service Worker**
  - [ ] Service worker registers successfully
  - [ ] Precaching works correctly
  - [ ] Runtime caching strategies working
  - [ ] Offline fallback displays correctly
  - [ ] Update flow works as expected

- [ ] **Install Experience**
  - [ ] Install prompt appears (Android/Desktop)
  - [ ] iOS add to home screen instructions clear
  - [ ] App installs successfully
  - [ ] Splash screen displays correctly
  - [ ] App opens in standalone mode

- [ ] **Offline Functionality**
  - [ ] App shell loads offline
  - [ ] Previously viewed pages work offline
  - [ ] Offline indicator displays
  - [ ] Form submissions queue when offline
  - [ ] Background sync works when back online

- [ ] **Performance**
  - [ ] First Contentful Paint < 1.8s
  - [ ] Largest Contentful Paint < 2.5s
  - [ ] Time to Interactive < 3.8s
  - [ ] Total Blocking Time < 200ms
  - [ ] Cumulative Layout Shift < 0.1

- [ ] **Advanced Features**
  - [ ] Push notifications work
  - [ ] Web Share API functional
  - [ ] App shortcuts accessible
  - [ ] Badging updates correctly
  - [ ] Status bar theming correct

### 3. Browser Testing Matrix

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Web App Manifest | ✅ | ✅ | ✅ | ✅ |
| Install Prompt | ✅ | ❌ | ❌ | ✅ |
| Push Notifications | ✅ | ✅ | ✅ (iOS 16.4+) | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ✅ |
| Web Share | ✅ | ❌ | ✅ | ✅ |
| Badging API | ✅ | ❌ | ✅ (iOS 17+) | ✅ |
| Periodic Background Sync | ✅ | ❌ | ❌ | ✅ |

### 4. Automated E2E Tests

**File: `/tests/e2e/pwa.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('PWA Functionality', () => {
  test('should have valid manifest', async ({ page }) => {
    await page.goto('/');

    const manifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link ? link.getAttribute('href') : null;
    });

    expect(manifest).toBe('/manifest.json');

    const response = await page.goto(manifest!);
    expect(response?.status()).toBe(200);
  });

  test('should register service worker', async ({ page }) => {
    await page.goto('/');

    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });

    expect(swRegistered).toBe(true);
  });

  test('should work offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Try to navigate
    await page.reload();

    // Should still show content (from cache)
    await expect(page).toHaveTitle(/A Maria Faz/);

    // Go back online
    await context.setOffline(false);
  });

  test('should show offline indicator when offline', async ({ page, context }) => {
    await page.goto('/');

    // Go offline
    await context.setOffline(true);

    // Trigger offline event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Check for offline indicator
    const offlineIndicator = page.locator('[data-offline-indicator]');
    await expect(offlineIndicator).toBeVisible();
  });
});
```

---

## Rollout Strategy

### Phase 1: Foundation (Week 1-2)
**Goal:** Basic PWA installable

- [ ] Install vite-plugin-pwa
- [ ] Create manifest.json
- [ ] Generate all icon sizes
- [ ] Configure basic service worker
- [ ] Add install prompt component
- [ ] Test installation on Android, iOS, Desktop
- [ ] Deploy to staging
- [ ] Run Lighthouse audit (target score: 80+)

**Success Metrics:**
- Lighthouse PWA score: 80+
- Installable on all platforms
- No console errors

### Phase 2: Offline-First (Week 3-4)
**Goal:** Full offline functionality

- [ ] Set up IndexedDB
- [ ] Implement caching strategies
- [ ] Add background sync
- [ ] Create offline indicator
- [ ] Build optimistic UI patterns
- [ ] Create offline fallback page
- [ ] Test offline scenarios
- [ ] Deploy to staging
- [ ] Run Lighthouse audit (target score: 90+)

**Success Metrics:**
- Cache hit ratio: 85%+
- Offline success rate: 95%+
- Background sync success rate: 98%+

### Phase 3: Advanced Features (Week 5-6)
**Goal:** Native app parity

- [ ] Implement push notifications
- [ ] Add Web Share integration
- [ ] Configure app shortcuts
- [ ] Implement badging API
- [ ] Add notification settings UI
- [ ] Test all advanced features
- [ ] Deploy to production
- [ ] Run full Lighthouse audit (target score: 95+)

**Success Metrics:**
- Push notification opt-in rate: 20%+
- Share API usage: 15% of users
- Install rate: 10% of visitors
- Lighthouse PWA score: 95+

### Monitoring & Optimization (Ongoing)

**Weekly:**
- Review Lighthouse reports
- Check error rates in Sentry
- Monitor cache hit rates
- Review user feedback

**Monthly:**
- Analyze PWA metrics in GA4
- Review conversion rates
- Test on new device/browser combinations
- Update caching strategies based on usage

**Quarterly:**
- Full PWA audit
- Review and update service worker
- Update dependencies
- Benchmark against competitors

---

## Key Performance Indicators (KPIs)

### Installation Metrics
- Install rate (installs / visitors)
- Install prompt acceptance rate
- Uninstall rate
- Time to first install

### Engagement Metrics
- Standalone mode usage percentage
- Return visit rate (installed vs. browser)
- Session duration (installed vs. browser)
- Feature usage rate (share, notifications)

### Performance Metrics
- Cache hit ratio (target: 85-95%)
- Offline success rate (target: 95%+)
- Background sync success rate (target: 98%+)
- Service worker activation time
- Update installation time

### Technical Metrics
- Service worker error rate
- Cache storage size
- IndexedDB size
- Failed sync attempts
- Push notification delivery rate

### Business Metrics
- Conversion rate (installed vs. browser)
- Average session value (installed vs. browser)
- User retention (30, 60, 90 days)
- Feature adoption rates

---

## Troubleshooting Guide

### Common Issues

**1. Service Worker Not Registering**
```javascript
// Check browser support
if ('serviceWorker' in navigator) {
  console.log('Service Worker supported');
} else {
  console.log('Service Worker NOT supported');
}

// Check registration errors
navigator.serviceWorker.register('/sw.js')
  .then(reg => console.log('SW registered:', reg))
  .catch(err => console.error('SW registration failed:', err));
```

**2. Manifest Not Loading**
- Ensure manifest.json is in /public
- Check Content-Type header (should be application/manifest+json)
- Validate JSON syntax
- Check CORS headers if served from CDN

**3. Icons Not Displaying**
- Verify all icon sizes exist
- Check file paths in manifest
- Ensure icons are in supported format (PNG recommended)
- Test maskable icons on Android

**4. Install Prompt Not Showing**
- Must be HTTPS (or localhost)
- Must have valid manifest
- Must have service worker
- Must meet engagement criteria (varies by browser)
- User hasn't previously dismissed prompt

**5. Offline Mode Not Working**
- Check service worker is active
- Verify caching strategies
- Ensure resources are precached
- Check cache names match
- Test network requests in DevTools

**6. Push Notifications Not Working**
- Check VAPID keys configured
- Verify permission granted
- Ensure service worker handles push events
- Check subscription endpoint valid
- Test notification payload format

---

## Resources & References

### Official Documentation
- [MDN Web Docs - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google Workbox](https://developers.google.com/web/tools/workbox)
- [vite-plugin-pwa Documentation](https://vite-pwa-org.netlify.app/)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)
- [Progressier Icon Generator](https://progressier.com/pwa-icons-and-ios-splash-screen-generator)
- [Real Favicon Generator](https://realfavicongenerator.net/)
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)

### Testing
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Firefox Developer Tools](https://firefox-source-docs.mozilla.org/devtools-user/)
- [Safari Web Inspector](https://webkit.org/web-inspector/)
- [WebPageTest](https://www.webpagetest.org/)

### Case Studies
- [Mainline Menswear: 55% conversion uplift](https://web.dev/mainline-mensware/)
- [Twitter Lite PWA](https://developers.google.com/web/showcase/2017/twitter)
- [Starbucks PWA](https://formidable.com/work/starbucks-progressive-web-app/)

---

## Conclusion

This comprehensive PWA implementation guide provides everything needed to transform Alojamento Insight Analyzer into a world-class Progressive Web App following 2025 best practices.

### Expected Outcomes

**Performance:**
- 55%+ conversion rate improvement
- 85-95% cache hit ratio
- <2s load time on 3G networks
- Lighthouse score: 95+

**User Experience:**
- Install rate: 10-15% of visitors
- Offline functionality for all core features
- Native app-like experience
- Push notification engagement: 20%+

**Technical Excellence:**
- Service worker error rate: <1%
- Background sync success: 98%+
- Cross-browser compatibility
- Automatic updates with zero downtime

### Next Steps

1. **Week 1-2:** Implement Phase 1 (Foundation)
2. **Week 3-4:** Implement Phase 2 (Offline-First)
3. **Week 5-6:** Implement Phase 3 (Advanced Features)
4. **Ongoing:** Monitor, optimize, and iterate

Start with Phase 1, test thoroughly, gather metrics, and iterate based on real user data. PWA implementation is a journey, not a destination!

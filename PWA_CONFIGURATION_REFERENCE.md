# PWA Configuration Reference
## Quick Copy-Paste Configurations

This file contains all the configuration snippets you need to implement PWA features. Copy and paste as needed.

---

## Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "build:preview": "vite build --mode preview",
    "build:production": "vite build --mode production",
    "build:analyze": "vite build --mode analyze",
    "preview": "vite preview",

    "pwa:generate-icons": "pwa-asset-generator ./public/logo.svg ./public/icons --icon-only --background '#0EA5E9' --padding '10%'",
    "pwa:generate-splash": "pwa-asset-generator ./public/logo.svg ./public/splash --splash-only --background '#0EA5E9'",
    "pwa:generate-all": "npm run pwa:generate-icons && npm run pwa:generate-splash",

    "lighthouse": "lighthouse http://localhost:4173 --output json --output html --output-path ./lighthouse-report --view",
    "lighthouse:ci": "lhci autorun",

    "test:pwa": "playwright test tests/e2e/pwa.spec.ts"
  },
  "devDependencies": {
    "vite-plugin-pwa": "^0.17.0",
    "@lighthouse-ci/cli": "^0.12.0",
    "pwa-asset-generator": "^6.3.0"
  },
  "dependencies": {
    "workbox-window": "^7.0.0",
    "idb": "^8.0.0"
  }
}
```

---

## Environment Variables

Create/update `.env` files:

### `.env.example`

```env
# Sentry (already configured)
VITE_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

# Analytics (already configured)
VITE_GA_TRACKING_ID=

# PWA Push Notifications
VITE_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Supabase (already configured)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Generating VAPID Keys

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys

# Output will be:
# Public Key: BHx...
# Private Key: y9k...

# Add to .env:
# VITE_VAPID_PUBLIC_KEY=BHx...
# VAPID_PRIVATE_KEY=y9k... (server-side only, not in Vite)
```

---

## TypeScript Definitions

### `src/vite-env.d.ts`

Add PWA type definitions:

```typescript
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_GA_TRACKING_ID?: string
  readonly VITE_VAPID_PUBLIC_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Service Worker types
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}

// Navigator extensions for PWA APIs
interface Navigator {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
}

// Share API
interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

interface Navigator {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
}
```

---

## Lighthouse CI Configuration

### `.lighthouserc.json`

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
        "apple-touch-icon": "warn",

        "first-contentful-paint": ["error", {"maxNumericValue": 1800}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "total-blocking-time": ["error", {"maxNumericValue": 200}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

---

## GitHub Actions Workflow

### `.github/workflows/pwa-audit.yml`

```yaml
name: PWA Lighthouse Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lighthouse:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Upload Lighthouse results
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-results
          path: .lighthouseci
```

---

## Vercel Configuration

### `vercel.json`

```json
{
  "headers": [
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/share",
      "destination": "/index.html"
    }
  ]
}
```

---

## Cloudflare Configuration

### `_headers` (already in /public)

```
# Service Worker
/sw.js
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: public, max-age=0, must-revalidate
  Service-Worker-Allowed: /

# Manifest
/manifest.json
  Content-Type: application/manifest+json
  Cache-Control: public, max-age=31536000, immutable

# Icons
/icons/*
  Cache-Control: public, max-age=31536000, immutable

# Splash screens
/splash/*
  Cache-Control: public, max-age=31536000, immutable

# All pages
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
```

---

## Nginx Configuration

If using Nginx:

```nginx
# PWA Configuration for Nginx

# Manifest
location /manifest.json {
    add_header Content-Type application/manifest+json;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# Service Worker
location /sw.js {
    add_header Content-Type "application/javascript; charset=utf-8";
    add_header Cache-Control "public, max-age=0, must-revalidate";
    add_header Service-Worker-Allowed "/";
}

# Icons and Splash Screens
location ~* ^/(icons|splash)/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# Security Headers
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# HTTPS Redirect
if ($scheme != "https") {
    return 301 https://$server_name$request_uri;
}
```

---

## Docker Configuration

### `Dockerfile.pwa`

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build PWA
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## Supabase Database Schema

For push notifications and offline sync:

### Push Subscriptions Table

```sql
-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Offline Queue Table (Optional)

```sql
-- Create offline_queue table for failed syncs
CREATE TABLE IF NOT EXISTS offline_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  data JSONB NOT NULL,
  retry_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'failed', 'completed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE offline_queue ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own queue items"
  ON offline_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queue items"
  ON offline_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queue items"
  ON offline_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own queue items"
  ON offline_queue FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_offline_queue_user_id ON offline_queue(user_id);
CREATE INDEX idx_offline_queue_status ON offline_queue(status);
CREATE INDEX idx_offline_queue_created_at ON offline_queue(created_at);
```

---

## Edge Functions for Push Notifications

### `supabase/functions/send-push-notification/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.6';

// Configure VAPID
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
);

serve(async (req) => {
  try {
    const { userId, title, body, data, url } = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabaseClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);

    if (error) throw error;

    // Send push notification to all user's devices
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          sub.subscription,
          JSON.stringify({
            title,
            body,
            data,
            actions: [
              { action: url || '/', title: 'Ver' },
              { action: 'dismiss', title: 'Dispensar' },
            ],
          })
        )
      )
    );

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## VSCode Settings

### `.vscode/settings.json`

```json
{
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "editor.quickSuggestions": {
    "strings": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/dist": true,
    "**/.lighthouseci": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.lighthouseci": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  }
}
```

---

## GitIgnore Additions

### `.gitignore`

```
# PWA Generated Files
/public/icons/*.png
/public/splash/*.png
/lighthouse-report.*
/.lighthouseci/

# Keep example icons
!/public/icons/.gitkeep
!/public/splash/.gitkeep

# Environment variables (keep .env.example)
.env.local
.env.production
.env.development

# Service Worker Debug
sw-debug.log
```

---

## Playwright E2E Test Configuration

### `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Performance Budget

### `budget.json`

```json
{
  "budgets": [
    {
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 250
        },
        {
          "resourceType": "stylesheet",
          "budget": 50
        },
        {
          "resourceType": "image",
          "budget": 200
        },
        {
          "resourceType": "font",
          "budget": 100
        },
        {
          "resourceType": "total",
          "budget": 600
        }
      ],
      "resourceCounts": [
        {
          "resourceType": "script",
          "budget": 10
        },
        {
          "resourceType": "stylesheet",
          "budget": 5
        },
        {
          "resourceType": "third-party",
          "budget": 5
        }
      ]
    }
  ]
}
```

---

## Quick Commands Reference

```bash
# Install dependencies
npm install --save-dev vite-plugin-pwa workbox-window @lighthouse-ci/cli pwa-asset-generator
npm install idb

# Generate icons and splash screens
npm run pwa:generate-all

# Build and test
npm run build
npm run preview
npm run lighthouse

# Run PWA tests
npm run test:pwa

# Generate VAPID keys
npx web-push generate-vapid-keys

# Check bundle size
npm run build:analyze

# Lighthouse CI
npm run lighthouse:ci
```

---

## Useful DevTools Commands

### Chrome DevTools Console

```javascript
// Check if PWA is installed
window.matchMedia('(display-mode: standalone)').matches

// Check service worker status
navigator.serviceWorker.getRegistrations().then(r => console.log(r))

// Check cache storage
caches.keys().then(keys => console.log('Cache names:', keys))

// Check cache contents
caches.open('workbox-precache-v2-https://your-site.com/').then(cache => {
  cache.keys().then(keys => console.log('Cached URLs:', keys.map(k => k.url)))
})

// Unregister all service workers (for testing)
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister())
})

// Clear all caches (for testing)
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key))
})

// Check IndexedDB
indexedDB.databases().then(dbs => console.log('Databases:', dbs))

// Check notification permission
Notification.permission

// Check if share is supported
'share' in navigator
```

---

## Troubleshooting Commands

```bash
# Clear all caches and rebuild
rm -rf node_modules package-lock.json dist .lighthouseci
npm install
npm run build

# Check service worker in DevTools
# Chrome: DevTools > Application > Service Workers
# Firefox: about:debugging#/runtime/this-firefox > Service Workers
# Safari: Develop > Service Workers

# Test offline mode
# Chrome DevTools > Network > Offline checkbox
# Firefox DevTools > Network > Offline mode
# Safari Web Inspector > Network > Network Throttling > Offline

# Check manifest
# Chrome DevTools > Application > Manifest
# Firefox DevTools > Application > Manifest
# Safari Web Inspector > Storage > Manifest

# Validate PWA
# https://www.pwabuilder.com/
# Enter your URL and check report
```

---

## Additional Resources

- [Full Implementation Guide](./PWA_IMPLEMENTATION_GUIDE.md)
- [Quick Start Guide](./PWA_QUICK_START.md)
- [Testing Checklist](./PWA_TESTING_CHECKLIST.md)
- [vite-plugin-pwa Docs](https://vite-pwa-org.netlify.app/)
- [Workbox Docs](https://developers.google.com/web/tools/workbox)
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

**Note:** Remember to replace placeholder values (emails, URLs, keys) with your actual values before deploying to production.

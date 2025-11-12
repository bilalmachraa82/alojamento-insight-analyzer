# Performance Optimization Implementation Checklist
## 2025 Advanced Techniques - Task Tracker

**Project:** Alojamento Insight Analyzer
**Last Updated:** 2025-11-08

---

## Phase 1: Core Web Vitals - Critical Path (Week 1-3)

### Font Optimization (High Impact) - 2 days

- [ ] **Download Variable Fonts**
  - [ ] Inter Variable (Latin subset)
  - [ ] Montserrat Variable (Latin subset)
  - [ ] Playfair Display Variable (Latin subset)
  - [ ] Tool used: google-webfonts-helper or glyphhanger
  - [ ] Format: WOFF2 only

- [ ] **Create Font Directory**
  - [ ] Create `/public/fonts/` directory
  - [ ] Place WOFF2 files in directory
  - [ ] Verify total size < 60 KB
  - [ ] Test fonts display correctly

- [ ] **Update HTML**
  - [ ] Remove Google Fonts `<link>` from `index.html`
  - [ ] Add preload for Inter Variable
  - [ ] Add preload for Montserrat Variable
  - [ ] Set `crossorigin` attribute on preload links

- [ ] **Create Font CSS File**
  - [ ] Create `src/fonts.css`
  - [ ] Add @font-face for Inter Variable
  - [ ] Add @font-face for Montserrat Variable
  - [ ] Add @font-face for Playfair Variable
  - [ ] Set `font-display: swap` for all
  - [ ] Configure weight ranges

- [ ] **Update Index CSS**
  - [ ] Remove `@import` for Google Fonts from `src/index.css`
  - [ ] Add `@import './fonts.css'` at top
  - [ ] Update font-family references if needed
  - [ ] Verify no duplicate font loading

- [ ] **Testing**
  - [ ] Build project: `npm run build`
  - [ ] Check Network tab: no Google Fonts requests
  - [ ] Verify fonts render correctly
  - [ ] Check font file sizes in dist
  - [ ] Test in Chrome, Firefox, Safari

**Expected Result:** 0.5-1.0s LCP improvement, 86% font size reduction

---

### Resource Hints (Medium Impact) - 1 day

- [ ] **DNS Prefetch**
  - [ ] Add for Supabase domain
  - [ ] Add for analytics domains (if applicable)
  - [ ] Add for any other external domains

- [ ] **Preconnect**
  - [ ] Add for Supabase (includes DNS + TCP + TLS)
  - [ ] Verify `crossorigin` attribute
  - [ ] Limit to 2-3 critical domains

- [ ] **Preload Critical Assets**
  - [ ] Preload critical CSS (if extracted)
  - [ ] Preload hero image (if specific)
  - [ ] Set `fetchpriority="high"` on hero image

- [ ] **Testing**
  - [ ] Check Network tab waterfall
  - [ ] Verify earlier connection to Supabase
  - [ ] Measure TTFB improvement

**Expected Result:** 200-400ms faster API calls

---

### Image Lazy Loading (High Impact) - 2 days

- [ ] **Create LazyImage Component**
  - [ ] Create `src/components/LazyImage.tsx`
  - [ ] Add props: src, alt, className, priority
  - [ ] Implement `loading` attribute logic
  - [ ] Implement `decoding` attribute logic
  - [ ] Implement `fetchpriority` attribute logic
  - [ ] Add TypeScript types

- [ ] **Update Image Usage**
  - [ ] Find all `<img>` tags in codebase
  - [ ] Replace with `<LazyImage>`
  - [ ] Set `priority={true}` for above-fold images
  - [ ] Set `priority={false}` for below-fold images
  - [ ] Add width and height attributes

- [ ] **Testing**
  - [ ] Check hero image loads immediately
  - [ ] Check below-fold images lazy load
  - [ ] Test on slow network (DevTools throttling)
  - [ ] Verify LCP image has priority

**Expected Result:** 40-50% fewer initial image requests

---

### TTFB Optimization (Medium Impact) - 1 day

- [ ] **Vercel Configuration**
  - [ ] Update `vercel.json` with edge functions config
  - [ ] Configure caching headers for API routes
  - [ ] Set `stale-while-revalidate` for APIs
  - [ ] Enable edge runtime if applicable

- [ ] **Testing**
  - [ ] Deploy to preview environment
  - [ ] Measure TTFB with WebPageTest
  - [ ] Verify API caching works
  - [ ] Check cache headers in Network tab

**Expected Result:** TTFB < 200ms

---

## Phase 2: Bundle Optimization (Week 4-6)

### Vite Plugins Installation (Medium Impact) - 1 day

- [ ] **Install Dependencies**
  - [ ] `npm install -D vite-plugin-compression`
  - [ ] `npm install -D vite-plugin-pwa`
  - [ ] `npm install -D vite-plugin-imagetools` (optional)
  - [ ] `npm install -D rollup-plugin-visualizer` (if not already)

- [ ] **Configure Brotli Compression**
  - [ ] Add to `vite.config.ts`
  - [ ] Set algorithm to 'brotliCompress'
  - [ ] Set extension to '.br'
  - [ ] Set threshold to 1024 bytes

- [ ] **Configure Gzip Fallback**
  - [ ] Add to `vite.config.ts`
  - [ ] Set algorithm to 'gzip'
  - [ ] Set extension to '.gz'
  - [ ] Set threshold to 1024 bytes

- [ ] **Testing**
  - [ ] Run `npm run build`
  - [ ] Check dist folder for .br and .gz files
  - [ ] Verify file sizes are smaller
  - [ ] Test Brotli support in browser

**Expected Result:** 15-25% smaller bundle size

---

### Service Worker & PWA (High Impact) - 2 days

- [ ] **Configure PWA Plugin**
  - [ ] Add VitePWA plugin to config
  - [ ] Set registerType to 'autoUpdate'
  - [ ] Configure manifest.json properties
  - [ ] Add icon assets (192x192, 512x512)

- [ ] **Configure Workbox Caching**
  - [ ] Add runtime caching for images
  - [ ] Add runtime caching for API calls
  - [ ] Add runtime caching for fonts
  - [ ] Set appropriate expiration policies
  - [ ] Configure cache names

- [ ] **Testing**
  - [ ] Build and serve: `npm run build && npm run preview`
  - [ ] Check Application > Service Workers in DevTools
  - [ ] Verify service worker registers
  - [ ] Test offline functionality
  - [ ] Check Cache Storage in DevTools

**Expected Result:** Offline support, 80% fewer repeated requests

---

### Code Splitting (High Impact) - 3 days

- [ ] **Route-based Splitting**
  - [ ] Import `lazy` and `Suspense` from React
  - [ ] Convert Dashboard import to lazy
  - [ ] Convert DiagnosticForm import to lazy
  - [ ] Convert ReportView import to lazy
  - [ ] Wrap routes with `<Suspense>`
  - [ ] Create loading fallback component

- [ ] **Component-level Splitting**
  - [ ] Identify heavy components (charts, editors)
  - [ ] Convert to lazy imports
  - [ ] Add individual Suspense boundaries
  - [ ] Create skeleton loading states

- [ ] **Prefetching (Optional)**
  - [ ] Add hover prefetch for navigation
  - [ ] Implement link prefetching strategy
  - [ ] Test perceived performance

- [ ] **Testing**
  - [ ] Run `npm run build:analyze`
  - [ ] Verify chunks are created
  - [ ] Check initial bundle size reduced
  - [ ] Test route navigation
  - [ ] Verify loading states appear

**Expected Result:** 30-50% smaller initial bundle

---

### Enhanced Terser Configuration (Low Impact) - 0.5 days

- [ ] **Update vite.config.ts**
  - [ ] Set `passes: 3` in compress options
  - [ ] Add all console methods to `pure_funcs`
  - [ ] Enable `ecma: 2020`
  - [ ] Enable `module: true`
  - [ ] Enable `toplevel: true` in mangle

- [ ] **Testing**
  - [ ] Run production build
  - [ ] Check bundle sizes
  - [ ] Verify console logs removed
  - [ ] Test app functionality

**Expected Result:** 5-10% additional compression

---

## Phase 3: Image Optimization (Week 7-9)

### WebP Conversion (High Impact) - 2 days

- [ ] **Manual Conversion Option**
  - [ ] Install cwebp tool
  - [ ] Convert all JPG/PNG to WebP
  - [ ] Set quality to 80-85
  - [ ] Place in public/images directory

- [ ] **OR Cloudflare Images Setup**
  - [ ] Sign up for Cloudflare Images
  - [ ] Get account hash
  - [ ] Upload images to Cloudflare
  - [ ] Create helper function for URLs

- [ ] **Create OptimizedImage Component**
  - [ ] Create `src/components/OptimizedImage.tsx`
  - [ ] Implement `<picture>` element
  - [ ] Add WebP source
  - [ ] Add AVIF source (optional)
  - [ ] Add fallback img element

- [ ] **Testing**
  - [ ] Check Network tab for WebP requests
  - [ ] Verify fallback works in older browsers
  - [ ] Measure file size reduction
  - [ ] Test image quality

**Expected Result:** 25-35% (WebP) to 50% (AVIF) image size reduction

---

### Responsive Images (Medium Impact) - 2 days

- [ ] **Update OptimizedImage Component**
  - [ ] Generate srcset with multiple sizes
  - [ ] Add sizes attribute
  - [ ] Support 400w, 800w, 1200w, 1920w
  - [ ] Configure for different breakpoints

- [ ] **Image Processing**
  - [ ] Create multiple sizes for each image
  - [ ] OR configure Cloudflare Images parameters
  - [ ] Test on different screen sizes
  - [ ] Verify correct image loads

- [ ] **Testing**
  - [ ] Use DevTools device emulation
  - [ ] Check which image size loads
  - [ ] Test on real mobile device
  - [ ] Verify bandwidth savings

**Expected Result:** 60-70% bandwidth savings on mobile

---

### Blur-up Technique (Optional, Low Impact) - 1 day

- [ ] **Create BlurImage Component**
  - [ ] Generate tiny placeholder (20px wide)
  - [ ] Add blur effect to placeholder
  - [ ] Fade out when full image loads
  - [ ] Add smooth transition

- [ ] **Testing**
  - [ ] Test on slow connection
  - [ ] Verify blur effect
  - [ ] Check smooth transition
  - [ ] Measure perceived performance

**Expected Result:** Better perceived performance

---

## Phase 4: Monitoring & Measurement (Week 10-11)

### Web Vitals RUM (Critical) - 1 day

- [ ] **Install Package**
  - [ ] `npm install web-vitals`

- [ ] **Create Monitoring Module**
  - [ ] Create `src/lib/performance-monitoring.ts`
  - [ ] Import web-vitals functions
  - [ ] Create `sendToAnalytics` function
  - [ ] Export `initPerformanceMonitoring`

- [ ] **Integrate with Analytics**
  - [ ] Send metrics to Google Analytics
  - [ ] Send metrics to Sentry (optional)
  - [ ] Log to console in development

- [ ] **Initialize in App**
  - [ ] Import in `src/main.tsx`
  - [ ] Call `initPerformanceMonitoring()`

- [ ] **Testing**
  - [ ] Check console for metrics in dev
  - [ ] Verify GA4 events in production
  - [ ] Monitor for 24-48 hours

**Expected Result:** Real-time performance data

---

### Lighthouse CI (High Priority) - 2 days

- [ ] **Install CLI**
  - [ ] `npm install -D @lhci/cli`

- [ ] **Create Configuration**
  - [ ] Create `lighthouserc.json`
  - [ ] Configure collect settings
  - [ ] Configure assert thresholds
  - [ ] Set up upload target

- [ ] **Create GitHub Action**
  - [ ] Create `.github/workflows/lighthouse.yml`
  - [ ] Configure to run on PRs
  - [ ] Add build and test steps
  - [ ] Add LHCI_GITHUB_APP_TOKEN secret

- [ ] **Testing**
  - [ ] Run locally: `npx @lhci/cli autorun`
  - [ ] Create test PR
  - [ ] Verify workflow runs
  - [ ] Check results in PR comments

**Expected Result:** Automated performance testing

---

### Performance Budgets (Medium Priority) - 1 day

- [ ] **Install size-limit**
  - [ ] `npm install -D size-limit @size-limit/preset-app`

- [ ] **Configure in package.json**
  - [ ] Add size-limit configuration
  - [ ] Set limit for main bundle (280 KB)
  - [ ] Set limit for CSS (15 KB)
  - [ ] Add npm script: "size"

- [ ] **Create GitHub Action**
  - [ ] Create `.github/workflows/size-limit.yml`
  - [ ] Run on PRs
  - [ ] Fail if limits exceeded

- [ ] **Testing**
  - [ ] Run `npm run size` locally
  - [ ] Intentionally exceed limit
  - [ ] Verify CI fails
  - [ ] Fix and verify passes

**Expected Result:** Automated bundle size enforcement

---

### Event Handler Optimization (Medium Impact) - 1 day

- [ ] **Create Performance Utils**
  - [ ] Create `src/utils/performance.ts`
  - [ ] Implement `useDebouncedCallback` hook
  - [ ] Implement `useThrottledCallback` hook
  - [ ] Add TypeScript types

- [ ] **Update Components**
  - [ ] Find search inputs
  - [ ] Find scroll handlers
  - [ ] Find resize handlers
  - [ ] Apply debounce/throttle as appropriate

- [ ] **Testing**
  - [ ] Type in search field rapidly
  - [ ] Verify reduced function calls
  - [ ] Check DevTools Performance tab
  - [ ] Measure INP improvement

**Expected Result:** 30-50% INP improvement

---

### CLS Prevention (Medium Impact) - 2 days

- [ ] **Add Image Dimensions**
  - [ ] Add width/height to all images
  - [ ] Ensure aspect ratio maintained with CSS
  - [ ] Verify no layout shifts

- [ ] **Create Skeleton Loaders**
  - [ ] Use shadcn/ui Skeleton component
  - [ ] Add to async data components
  - [ ] Match actual content dimensions
  - [ ] Test loading states

- [ ] **Font Loading Strategy**
  - [ ] Verify `font-display: swap`
  - [ ] Add size-adjust (optional)
  - [ ] Test font swap behavior

- [ ] **Testing**
  - [ ] Use DevTools to throttle network
  - [ ] Watch for layout shifts
  - [ ] Measure CLS in Lighthouse
  - [ ] Verify CLS < 0.1

**Expected Result:** CLS < 0.1 (target met)

---

## Phase 5: CSS Optimization (Week 12-13)

### Critical CSS Extraction (Medium Impact) - 2 days

- [ ] **Install Plugin**
  - [ ] `npm install -D vite-plugin-critical`

- [ ] **Configure in Vite**
  - [ ] Add critical plugin
  - [ ] Set inline: true
  - [ ] Configure dimensions (mobile + desktop)

- [ ] **Testing**
  - [ ] Build project
  - [ ] Check HTML has inlined CSS
  - [ ] Measure FCP improvement
  - [ ] Verify no styling flash

**Expected Result:** 36% FCP improvement

---

### Tailwind Optimization (Already Good) - 0.5 days

- [ ] **Verify Configuration**
  - [ ] Check JIT mode enabled
  - [ ] Verify content paths correct
  - [ ] Check purge configuration
  - [ ] Ensure only used classes included

- [ ] **Testing**
  - [ ] Build and check CSS size
  - [ ] Should be ~12-18 KB compressed
  - [ ] Verify no unused styles

**Expected Result:** Already optimized

---

## Phase 6: Advanced Optimizations (Week 14+)

### Web Workers (Optional, Medium Impact) - 3 days

- [ ] **Identify Heavy Computations**
  - [ ] Analytics calculations
  - [ ] PDF generation
  - [ ] Data processing

- [ ] **Create Worker Files**
  - [ ] Create `src/workers/analytics.worker.ts`
  - [ ] Implement message handlers
  - [ ] Add error handling

- [ ] **Create Hook**
  - [ ] Create `src/hooks/useWorker.ts`
  - [ ] Handle worker initialization
  - [ ] Handle cleanup

- [ ] **Testing**
  - [ ] Test worker functionality
  - [ ] Monitor main thread performance
  - [ ] Verify INP improvement

**Expected Result:** Main thread free for interactions

---

### Advanced Caching (Optional, Low Impact) - 2 days

- [ ] **Customize Service Worker**
  - [ ] Create custom service worker
  - [ ] Implement advanced strategies
  - [ ] Add offline page
  - [ ] Handle cache versioning

- [ ] **Testing**
  - [ ] Test offline functionality
  - [ ] Verify cache updates
  - [ ] Test stale-while-revalidate

**Expected Result:** Better offline experience

---

## Testing & Validation Checklist

### Local Testing

- [ ] **Build & Analyze**
  - [ ] Run `npm run build`
  - [ ] Run `npm run build:analyze`
  - [ ] Check bundle sizes
  - [ ] Verify chunks created correctly

- [ ] **Lighthouse Audit**
  - [ ] Run `npx lighthouse http://localhost:4173 --view`
  - [ ] Check Performance score (target: 90+)
  - [ ] Check all Core Web Vitals
  - [ ] Review opportunities

- [ ] **Size Check**
  - [ ] Run `npm run size`
  - [ ] Verify under budgets
  - [ ] Check individual chunk sizes

### Staging Testing

- [ ] **Deploy to Preview**
  - [ ] Deploy to Vercel/Cloudflare preview
  - [ ] Get preview URL

- [ ] **Real Device Testing**
  - [ ] Test on iPhone (Safari)
  - [ ] Test on Android (Chrome)
  - [ ] Test on Desktop (Chrome, Firefox, Safari)

- [ ] **Network Testing**
  - [ ] Test on Fast 3G
  - [ ] Test on Slow 3G
  - [ ] Test on offline

- [ ] **WebPageTest**
  - [ ] Run test from multiple locations
  - [ ] Check waterfall charts
  - [ ] Verify resource loading order

### Production Validation

- [ ] **Gradual Rollout**
  - [ ] Deploy to 10% of users
  - [ ] Monitor for 24 hours
  - [ ] Deploy to 50% of users
  - [ ] Monitor for 24 hours
  - [ ] Deploy to 100%

- [ ] **Monitor Metrics**
  - [ ] Check RUM data in GA4
  - [ ] Monitor Sentry for errors
  - [ ] Check Core Web Vitals in Search Console
  - [ ] Compare before/after analytics

- [ ] **A/B Testing (Optional)**
  - [ ] Set up A/B test
  - [ ] Compare conversion rates
  - [ ] Compare bounce rates
  - [ ] Measure impact

---

## Success Criteria Validation

### Technical Metrics
- [ ] Lighthouse Performance Score: ≥ 90
- [ ] LCP: < 2.5s (Good)
- [ ] INP: < 200ms (Good)
- [ ] CLS: < 0.1 (Good)
- [ ] TTFB: < 200ms
- [ ] FCP: < 1.8s
- [ ] Total Bundle Size: < 1 MB

### Business Metrics (After 30 days)
- [ ] Bounce Rate: Reduced by 30%+
- [ ] Conversion Rate: Increased by 50%+
- [ ] Average Session Duration: Increased by 25%+
- [ ] Mobile Traffic: Increased by 40%+
- [ ] Core Web Vitals Pass Rate: > 90%

---

## Quick Reference: Commands

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Build with analysis
npm run build:analyze

# Run Lighthouse
npx lighthouse http://localhost:4173 --view

# Check bundle sizes
npm run size

# Run Lighthouse CI
npx @lhci/cli autorun

# Run tests
npm run test

# Convert images to WebP
for img in public/images/*.{jpg,png}; do
  cwebp -q 80 "$img" -o "${img%.*}.webp"
done
```

---

## Troubleshooting Guide

### Fonts Not Loading
- [ ] Check `/public/fonts/` directory exists
- [ ] Verify WOFF2 files are present
- [ ] Check Network tab for 404 errors
- [ ] Verify preload links have correct paths
- [ ] Check CORS headers if using CDN

### Service Worker Issues
- [ ] Clear service worker cache
- [ ] Unregister old service workers
- [ ] Check Application tab in DevTools
- [ ] Verify service worker script has no errors
- [ ] Test in incognito mode

### Large Bundle Size
- [ ] Run bundle analyzer
- [ ] Check for duplicate dependencies
- [ ] Verify tree shaking is working
- [ ] Check for large libraries
- [ ] Consider code splitting

### Poor Lighthouse Score
- [ ] Test in incognito mode
- [ ] Disable browser extensions
- [ ] Clear cache and hard reload
- [ ] Test on real device
- [ ] Check DevTools Console for errors

### Layout Shifts
- [ ] Add dimensions to all images
- [ ] Check font-display strategy
- [ ] Verify skeleton loaders
- [ ] Test with slow network
- [ ] Use DevTools Layout Shift Regions

---

## Notes & Observations

**Date:** _______________

**What worked well:**


**What didn't work:**


**Unexpected issues:**


**Performance improvements observed:**


**Next steps:**


---

## Sign-off

**Phase 1 Completed:** ☐ Date: _______________
**Phase 2 Completed:** ☐ Date: _______________
**Phase 3 Completed:** ☐ Date: _______________
**Phase 4 Completed:** ☐ Date: _______________
**Phase 5 Completed:** ☐ Date: _______________
**Phase 6 Completed:** ☐ Date: _______________

**Final Performance Validated:** ☐ Date: _______________
**Deployed to Production:** ☐ Date: _______________

**Completed by:** _______________
**Reviewed by:** _______________

---

**Last Updated:** 2025-11-08
**Version:** 1.0
**Next Review:** After Phase 1 completion

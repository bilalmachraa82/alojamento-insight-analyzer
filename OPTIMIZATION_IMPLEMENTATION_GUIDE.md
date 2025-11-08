# Performance Optimization - Implementation Guide
**Quick Reference for Developers**

This guide provides ready-to-use code for implementing the optimizations identified in the Performance Analysis Report.

---

## Quick Wins - Start Here

### 1. Route-Based Lazy Loading (30 min)

#### Current Code (`/src/App.tsx`)
```typescript
// ❌ BAD - Everything loaded upfront
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AnalysisResult from "./pages/AnalysisResult";
import TestPremiumPDF from "./pages/TestPremiumPDF";
import TestEmails from "./pages/TestEmails";
import Admin from "./pages/Admin";
```

#### Optimized Code
```typescript
// ✅ GOOD - Lazy load routes
import { lazy, Suspense } from "react";

// Create loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      <p className="mt-2 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Lazy load all routes
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AnalysisResult = lazy(() => import("./pages/AnalysisResult"));
const TestPremiumPDF = lazy(() => import("./pages/TestPremiumPDF"));
const TestEmails = lazy(() => import("./pages/TestEmails"));
const Admin = lazy(() => import("./pages/Admin"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <React.StrictMode>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/results/:id" element={<AnalysisResult />} />
              <Route path="/test-pdf" element={<TestPremiumPDF />} />
              <Route path="/test-emails" element={<TestEmails />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </React.StrictMode>
  </QueryClientProvider>
);
```

**Expected Impact:** -30% bundle size (425KB → 300KB)

---

### 2. Font Loading Optimization (5 min)

#### Current Code (`/index.html`)
```html
<!-- ❌ BAD - No font-display, render blocking -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
```

#### Optimized Code
```html
<!-- ✅ GOOD - Preconnect + font-display swap + subset -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Montserrat:wght@500;700;800&family=Playfair+Display:wght@600;700&display=swap&subset=latin" rel="stylesheet">
```

**Changes:**
- Added `&display=swap` - prevents invisible text
- Reduced font weights from 15 to 7 - smaller download
- Added `&subset=latin` - only load needed characters

**Expected Impact:** Faster FCP, reduced CLS, -50KB font download

---

### 3. Vite Build Configuration (15 min)

#### Add to `vite.config.ts`
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Add bundle visualizer
    mode === 'production' && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ✅ ADD THIS - Build optimizations
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console.logs in production
        drop_debugger: true,
      },
    },
    // Chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI library
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],

          // Charts
          'charts': ['recharts'],

          // Forms
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Supabase
          'supabase': ['@supabase/supabase-js'],

          // React Query
          'query': ['@tanstack/react-query'],
        },
      },
    },
    // Set chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Source maps for debugging
    sourcemap: mode !== 'production',
  },
  // Performance hints
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

#### Install required package
```bash
npm install -D rollup-plugin-visualizer
```

**Expected Impact:** Better caching, 10-15% smaller main chunk

---

### 4. React Query Configuration (10 min)

#### Current Code
```typescript
// ❌ BAD - Default configuration
const queryClient = new QueryClient();
```

#### Optimized Code
```typescript
// ✅ GOOD - Optimized configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Keep unused data in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,

      // Don't refetch on window focus
      refetchOnWindowFocus: false,

      // Only retry once on failure
      retry: 1,

      // Don't retry on 404
      retryOnMount: false,

      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Only retry mutations once
      retry: 1,
    },
  },
});
```

**Expected Impact:** Fewer unnecessary API calls, faster perceived performance

---

### 5. Component Memoization Examples

#### Example 1: PremiumReportViewer

**Current Code:**
```typescript
// ❌ BAD - Functions recreated on every render
const PremiumReportViewer: React.FC<PremiumReportViewerProps> = ({ analysisData }) => {
  const getHealthScoreColor = (categoria: string) => {
    switch (categoria) {
      case 'excelente': return 'bg-green-500';
      case 'bom': return 'bg-yellow-500';
      case 'medio': return 'bg-orange-500';
      case 'critico': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div>{/* render */}</div>
  );
};
```

**Optimized Code:**
```typescript
import React, { memo, useMemo } from 'react';

// ✅ GOOD - Helper functions outside component (don't need access to props/state)
const getHealthScoreColor = (categoria: string) => {
  switch (categoria) {
    case 'excelente': return 'bg-green-500';
    case 'bom': return 'bg-yellow-500';
    case 'medio': return 'bg-orange-500';
    case 'critico': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getHealthScoreText = (categoria: string) => {
  switch (categoria) {
    case 'excelente': return 'Excelente';
    case 'bom': return 'Bom';
    case 'medio': return 'Médio';
    case 'critico': return 'Crítico';
    default: return 'N/A';
  }
};

// ✅ GOOD - Memoized component
const PremiumReportViewer: React.FC<PremiumReportViewerProps> = memo(({ analysisData }) => {
  return (
    <div>{/* render */}</div>
  );
});

PremiumReportViewer.displayName = 'PremiumReportViewer';

export default PremiumReportViewer;
```

#### Example 2: AnalysisResult with useMemo

**Current Code:**
```typescript
// ❌ BAD - Computed on every render
const AnalysisResult = () => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  const getPropertyName = () => {
    if (!analysisData) return "Propriedade";
    return analysisData.analysis_result?.property_data?.property_name ||
           analysisData.property_data?.property_name ||
           "Sua Propriedade";
  };

  const getPropertyLocation = () => {
    if (!analysisData) return "Localização Indisponível";
    return analysisData.analysis_result?.property_data?.location ||
           analysisData.property_data?.location ||
           "Localização Indisponível";
  };

  return <div>{getPropertyName()}</div>;
};
```

**Optimized Code:**
```typescript
import { useMemo, useCallback } from 'react';

// ✅ GOOD - Memoized derived values
const AnalysisResult = () => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  // Memoize computed properties
  const propertyName = useMemo(() => {
    if (!analysisData) return "Propriedade";
    return analysisData.analysis_result?.property_data?.property_name ||
           analysisData.property_data?.property_name ||
           "Sua Propriedade";
  }, [analysisData]);

  const propertyLocation = useMemo(() => {
    if (!analysisData) return "Localização Indisponível";
    return analysisData.analysis_result?.property_data?.location ||
           analysisData.property_data?.location ||
           "Localização Indisponível";
  }, [analysisData]);

  const propertyType = useMemo(() => {
    if (!analysisData) return "Alojamento";
    return analysisData.analysis_result?.property_data?.property_type ||
           analysisData.property_data?.property_type ||
           "Alojamento";
  }, [analysisData]);

  const propertyRating = useMemo(() => {
    if (!analysisData) return null;
    return analysisData.analysis_result?.property_data?.rating ||
           analysisData.property_data?.rating ||
           null;
  }, [analysisData]);

  // Memoize callback functions
  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchAnalysisData();
  }, []);

  const requestManualAnalysis = useCallback(async () => {
    if (!analysisData) return;

    toast({
      title: "Solicitação enviada",
      description: "Seu pedido para análise manual foi registrado.",
    });

    await supabase
      .from("diagnostic_submissions")
      .update({
        status: "manual_review_requested",
        error_message: "Manual review requested at " + new Date().toISOString()
      })
      .eq("id", analysisData.id);

    setTimeout(() => fetchAnalysisData(), 1000);
  }, [analysisData]);

  return (
    <div>
      <h1>{propertyName}</h1>
      <p>{propertyLocation}</p>
      <p>{propertyType}</p>
      {propertyRating && <p>⭐ {propertyRating}</p>}
      <button onClick={handleRefresh}>Refresh</button>
    </div>
  );
};
```

#### Example 3: Index Page with useCallback

**Current Code:**
```typescript
// ❌ BAD
const Index: React.FC = () => {
  const [language, setLanguage] = useState<"en" | "pt">("pt");

  const scrollToForm = () => {
    const form = document.getElementById("diagnosticoForm");
    form?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      <HeroSection language={language} scrollToForm={scrollToForm} />
      <PricingTable language={language} scrollToForm={scrollToForm} />
    </div>
  );
};
```

**Optimized Code:**
```typescript
import { useCallback } from 'react';

// ✅ GOOD
const Index: React.FC = () => {
  const [language, setLanguage] = useState<"en" | "pt">("pt");

  // Memoize callback to prevent child re-renders
  const scrollToForm = useCallback(() => {
    const form = document.getElementById("diagnosticoForm");
    form?.scrollIntoView({ behavior: "smooth" });
  }, []); // No dependencies - function never changes

  return (
    <div>
      <HeroSection language={language} scrollToForm={scrollToForm} />
      <PricingTable language={language} scrollToForm={scrollToForm} />
    </div>
  );
};
```

---

### 6. Component-Level Code Splitting

#### Example: Admin Page

**Current Code:**
```typescript
// ❌ BAD - All imported upfront
import { SystemHealthCard } from '@/components/admin/SystemHealthCard';
import { PerformanceChart } from '@/components/admin/PerformanceChart';
import { RevenueMetrics } from '@/components/admin/RevenueMetrics';
```

**Optimized Code:**
```typescript
import { lazy, Suspense } from 'react';

// ✅ GOOD - Lazy load heavy components
const SystemHealthCard = lazy(() => import('@/components/admin/SystemHealthCard'));
const PerformanceChart = lazy(() => import('@/components/admin/PerformanceChart'));
const RevenueMetrics = lazy(() => import('@/components/admin/RevenueMetrics'));
const UserMetrics = lazy(() => import('@/components/admin/UserMetrics'));
const SubmissionMetrics = lazy(() => import('@/components/admin/SubmissionMetrics'));

const ComponentLoader = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
);

const Admin = () => {
  return (
    <div className="grid gap-6">
      <Suspense fallback={<ComponentLoader />}>
        <SystemHealthCard />
      </Suspense>

      <Suspense fallback={<ComponentLoader />}>
        <PerformanceChart />
      </Suspense>

      <Suspense fallback={<ComponentLoader />}>
        <RevenueMetrics />
      </Suspense>
    </div>
  );
};
```

---

## Medium Priority Optimizations

### 7. Debouncing Form Validation

**Current Issue:** Form validation runs on every keystroke

**Optimized Code:**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash-es'; // or create custom debounce

const DiagnosticForm = ({ language }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange', // Validate on change
  });

  const propertyLink = form.watch("link");

  // ✅ GOOD - Debounced validation
  const validateLink = useCallback(
    debounce((link: string) => {
      if (link.includes("booking.com/share-")) {
        toast({
          title: "⚠️ Link Encurtado Detectado",
          description: "Use o URL completo da propriedade.",
          variant: "destructive",
          duration: 5000,
        });
      }
    }, 500), // Wait 500ms after user stops typing
    []
  );

  useEffect(() => {
    if (propertyLink) {
      validateLink(propertyLink);
    }
  }, [propertyLink, validateLink]);
};
```

**Install lodash-es:**
```bash
npm install lodash-es
npm install -D @types/lodash-es
```

---

### 8. Virtual Scrolling for Large Lists

**Use Case:** Admin error logs, submission lists

**Install:**
```bash
npm install @tanstack/react-virtual
```

**Example:**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

const ErrorLogList = ({ logs }: { logs: ErrorLog[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height
    overscan: 5, // Render 5 extra items
  });

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto border rounded-lg"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const log = logs[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ErrorLogItem log={log} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

---

### 9. Image Optimization (Future)

**When you add images, use this setup:**

**Install:**
```bash
npm install -D vite-imagetools
```

**Add to vite.config.ts:**
```typescript
import { imagetools } from 'vite-imagetools';

export default defineConfig({
  plugins: [
    react(),
    imagetools(),
  ],
});
```

**Usage:**
```typescript
// Automatically generate responsive images
import heroImage from './assets/hero.jpg?w=400;800;1200&format=webp&as=picture';

// In component
<picture>
  <source srcSet={heroImage.sources.webp} type="image/webp" />
  <img src={heroImage.img.src} alt="Hero" loading="lazy" />
</picture>
```

---

## Testing Performance Improvements

### 1. Before Optimization - Baseline
```bash
# Build and measure
npm run build

# Note the bundle sizes
# dist/assets/index-*.js should be ~1,417 KB
```

### 2. After Each Optimization
```bash
# Rebuild
npm run build

# Compare sizes
# Track improvement percentage
```

### 3. Lighthouse Testing
```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run test
lhci autorun --config=lighthouserc.json
```

**Create `lighthouserc.json`:**
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:8080"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

### 4. Bundle Analysis
```bash
# After building, open the visualizer
npm run build
# Opens dist/stats.html automatically
```

---

## Monitoring in Production

### Add Web Vitals Tracking

**Install:**
```bash
npm install web-vitals
```

**Add to `/src/main.tsx`:**
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Report Web Vitals
function sendToAnalytics(metric: any) {
  // Send to your analytics endpoint
  console.log(metric);

  // Example: Send to Google Analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

## Quick Reference Checklist

### Week 1 - Critical Optimizations
- [ ] Implement route lazy loading (30 min)
- [ ] Add Suspense boundaries (15 min)
- [ ] Optimize font loading (5 min)
- [ ] Configure Vite chunks (15 min)
- [ ] Add bundle visualizer (5 min)
- [ ] Optimize React Query (10 min)
- [ ] Add React.memo to 5 key components (1 hour)
- [ ] Add useCallback to Index.scrollToForm (5 min)
- [ ] Add useMemo to AnalysisResult helpers (30 min)
- [ ] Remove unused dependencies (5 min)

**Total Time:** ~4 hours
**Expected Impact:** 40% bundle reduction

### Week 2 - Important Optimizations
- [ ] Component-level code splitting (2 hours)
- [ ] Add React.memo to all heavy components (2 hours)
- [ ] Debounce form validation (30 min)
- [ ] Add performance budgets to CI (1 hour)
- [ ] Comprehensive bundle analysis (1 hour)

**Total Time:** ~7 hours
**Expected Impact:** Additional 20% reduction

---

## Common Pitfalls to Avoid

### ❌ Over-Memoization
Don't memoize everything - only components that:
- Are expensive to render
- Receive the same props frequently
- Have many child components

### ❌ Wrong Dependencies
```typescript
// ❌ BAD - Missing dependency
const value = useMemo(() => data.map(x => x * 2), []);

// ✅ GOOD
const value = useMemo(() => data.map(x => x * 2), [data]);
```

### ❌ Lazy Loading Too Much
Don't lazy load:
- Critical above-the-fold components
- Very small components
- Components that are always used

### ❌ Not Testing
Always:
- Test after each optimization
- Measure the impact
- Check for regression
- Verify user experience

---

## Support & Resources

### Questions?
- Check the Performance Analysis Report for detailed explanations
- Review React documentation on performance
- Use Chrome DevTools Performance tab
- Profile with React DevTools

### Tools
- **Chrome DevTools:** Performance profiling
- **React DevTools:** Component profiling
- **Lighthouse:** Performance scoring
- **Bundle Visualizer:** Understand bundle composition

**Happy Optimizing! 🚀**

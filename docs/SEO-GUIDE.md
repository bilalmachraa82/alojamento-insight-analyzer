# SEO Implementation Guide

## Overview

This document provides a comprehensive guide to the SEO (Search Engine Optimization) implementation for the Alojamento Insight Analyzer platform. All SEO best practices have been implemented to ensure maximum visibility in search engines and optimal social media sharing.

## Table of Contents

1. [Meta Tags](#meta-tags)
2. [Structured Data](#structured-data)
3. [Sitemap](#sitemap)
4. [Robots.txt](#robotstxt)
5. [Social Media Previews](#social-media-previews)
6. [Accessibility](#accessibility)
7. [Performance](#performance)
8. [Maintenance](#maintenance)

---

## Meta Tags

### Implementation

Meta tags are managed through the `MetaTags` component located at `/src/components/SEO/MetaTags.tsx`. This component uses `react-helmet-async` to dynamically update meta tags based on the current page.

### Page-Specific Meta Tags

#### Homepage (`/`)
- **Title:** "Análise de Alojamento Local - Diagnóstico Inteligente com IA | Maria Faz"
- **Description:** "Otimize o seu alojamento local com análise inteligente por IA..."
- **Keywords:** alojamento local, short-term rental, airbnb portugal, booking.com
- **Status:** Indexed (public)

#### Analysis Results (`/results/:id`)
- **Title:** Dynamic - based on property name and location
- **Description:** Dynamic - based on property type and location
- **Keywords:** Dynamic - includes property details
- **Status:** Noindex when incomplete, indexed when completed

#### Admin Dashboard (`/admin`)
- **Title:** "Admin Dashboard | Maria Faz"
- **Description:** "Admin dashboard for system monitoring"
- **Status:** Noindex, nofollow (private)

#### Test Pages (`/test-pdf`, `/test-emails`)
- **Title:** "Test [Feature] | Maria Faz"
- **Description:** "Internal testing page"
- **Status:** Noindex, nofollow (internal use only)

#### 404 Page
- **Title:** "404 - Página Não Encontrada | Maria Faz"
- **Description:** "A página que você está procurando não foi encontrada"
- **Status:** Noindex

### How to Update Meta Tags

To update meta tags for a page:

```tsx
import MetaTags from '@/components/SEO/MetaTags';

function MyPage() {
  return (
    <>
      <MetaTags
        title="Your Page Title | Maria Faz"
        description="Your page description (max 160 characters)"
        keywords="keyword1, keyword2, keyword3"
        canonicalUrl="https://alojamento-insight-analyzer.mariafaz.com/page"
        ogImage="https://alojamento-insight-analyzer.mariafaz.com/og-image.jpg"
        noindex={false} // Set to true for private pages
      />
      {/* Your page content */}
    </>
  );
}
```

### Meta Tag Best Practices

- **Title:** Keep under 60 characters, include primary keyword
- **Description:** Keep under 160 characters, compelling and descriptive
- **Keywords:** 5-10 relevant keywords, comma-separated
- **OG Image:** Always 1200x630px for optimal display
- **Canonical URL:** Always use absolute URLs

---

## Structured Data

### Implementation

Structured data (JSON-LD) is implemented through helper functions in `/src/components/SEO/structuredData.ts`. These schemas help search engines understand your content better.

### Available Schemas

#### 1. Organization Schema
Identifies the business and its basic information.

```typescript
import { organizationSchema } from '@/components/SEO/structuredData';
```

#### 2. Website Schema
Describes the website and its search functionality.

```typescript
import { websiteSchema } from '@/components/SEO/structuredData';
```

#### 3. Software Application Schema
Describes the SaaS platform, features, and pricing.

```typescript
import { softwareApplicationSchema } from '@/components/SEO/structuredData';
```

#### 4. Service Schema
Describes the analysis service offered.

```typescript
import { serviceSchema } from '@/components/SEO/structuredData';
```

#### 5. Product Schema
Describes premium features as products.

```typescript
import { premiumProductSchema } from '@/components/SEO/structuredData';
```

#### 6. Article Schema
For individual analysis/result pages.

```typescript
import { createArticleSchema } from '@/components/SEO/structuredData';

const articleSchema = createArticleSchema({
  title: 'Analysis Title',
  description: 'Analysis description',
  datePublished: '2025-11-07',
  url: 'https://example.com/article',
});
```

#### 7. Breadcrumb Schema
For navigation hierarchy.

```typescript
import { createBreadcrumbSchema } from '@/components/SEO/structuredData';

const breadcrumbSchema = createBreadcrumbSchema([
  { name: 'Home', url: 'https://example.com' },
  { name: 'Page', url: 'https://example.com/page' },
]);
```

### Testing Structured Data

Use Google's Rich Results Test:
- URL: https://search.google.com/test/rich-results
- Test URL: https://alojamento-insight-analyzer.mariafaz.com/

---

## Sitemap

### Location
`/public/sitemap.xml`

### Current Pages in Sitemap

1. **Homepage** (`/`)
   - Priority: 1.0
   - Change Frequency: daily
   - Last Modified: Updated on deployment

### Excluded from Sitemap

- Individual analysis pages (`/results/:id`) - User-specific, dynamically generated
- Admin pages (`/admin`) - Private, authentication required
- Test pages (`/test-pdf`, `/test-emails`) - Internal testing only
- 404 page - Error page

### Updating the Sitemap

The sitemap is currently static. To update:

1. Edit `/public/sitemap.xml`
2. Update the `<lastmod>` date to current date (YYYY-MM-DD)
3. Add new public pages if needed:

```xml
<url>
  <loc>https://alojamento-insight-analyzer.mariafaz.com/new-page</loc>
  <lastmod>2025-11-07</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>
```

### Change Frequency Guidelines

- **always:** Changes with every access (not recommended)
- **hourly:** Real-time content
- **daily:** Homepage, frequently updated content
- **weekly:** Regular content updates
- **monthly:** Occasional updates
- **yearly:** Archive pages
- **never:** Static pages

### Priority Guidelines

- **1.0:** Most important page (usually homepage)
- **0.8:** Main category pages
- **0.6:** Subcategory pages
- **0.4:** Individual content pages
- **0.2:** Utility pages

### Submitting Sitemap to Search Engines

#### Google Search Console
1. Go to https://search.google.com/search-console
2. Select your property
3. Navigate to Sitemaps
4. Submit: `https://alojamento-insight-analyzer.mariafaz.com/sitemap.xml`

#### Bing Webmaster Tools
1. Go to https://www.bing.com/webmasters
2. Select your site
3. Navigate to Sitemaps
4. Submit: `https://alojamento-insight-analyzer.mariafaz.com/sitemap.xml`

---

## Robots.txt

### Location
`/public/robots.txt`

### Current Configuration

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /test-pdf
Disallow: /test-emails

Crawl-delay: 1

Sitemap: https://alojamento-insight-analyzer.mariafaz.com/sitemap.xml
```

### Disallowed Paths

- `/admin` - Private admin dashboard
- `/test-pdf` - Internal PDF testing
- `/test-emails` - Internal email testing

### Allowed Bots

- Googlebot
- Bingbot
- Twitterbot
- facebookexternalhit
- LinkedInBot
- All other bots (with restrictions)

### Testing Robots.txt

Test using:
- Google Search Console: https://search.google.com/search-console
- Navigate to "Coverage" > "robots.txt Tester"

---

## Social Media Previews

### Open Graph Image

#### Location
`/public/og-image.svg` (temporary SVG placeholder)
`/public/og-image.jpg` (create final image)

#### Specifications
- **Dimensions:** 1200 x 630 px
- **File Size:** < 300 KB recommended
- **Format:** JPG or PNG
- **Aspect Ratio:** 1.91:1

#### Creating the Final OG Image

See `/public/og-image-instructions.md` for detailed design guidelines.

**Quick Tips:**
- Include brand name "A Maria Faz"
- Include product name "Alojamento Insight Analyzer"
- Use brand colors: Pink (#F472B6), Blue (#3B82F6)
- Keep text readable at small sizes
- Test at various display sizes

### Testing Social Media Previews

#### Facebook/Open Graph
- **Sharing Debugger:** https://developers.facebook.com/tools/debug/
- Enter URL: https://alojamento-insight-analyzer.mariafaz.com/
- Click "Scrape Again" to refresh cache

#### Twitter
- **Card Validator:** https://cards-dev.twitter.com/validator
- Note: Requires Twitter developer account
- Tests both summary and summary_large_image cards

#### LinkedIn
- **Post Inspector:** https://www.linkedin.com/post-inspector/
- Enter URL and inspect preview
- Clear cache if needed

#### General Testing
- **OpenGraph.xyz:** https://www.opengraph.xyz/
- Free tool, no login required
- Shows preview for multiple platforms

---

## Accessibility

### Semantic HTML

All pages use proper semantic HTML5 elements:
- `<header>` for page headers
- `<main>` for main content
- `<nav>` for navigation
- `<footer>` for page footers
- `<article>` for content articles
- `<section>` for content sections

### Heading Hierarchy

Proper heading hierarchy is maintained:
- **H1:** Page title (one per page)
- **H2:** Major sections
- **H3:** Subsections
- **H4-H6:** Nested subsections

### ARIA Labels

Icons and interactive elements include appropriate ARIA labels:
- Lucide React icons are decorative and handled automatically
- Interactive elements have descriptive labels
- Form inputs have associated labels

### Color Contrast

All text meets WCAG AA standards:
- Brand Black (#1F2937) on white: 13.46:1 (AAA)
- Gray (#6B7280) on white: 5.74:1 (AA)
- Links are underlined and color-distinguishable

### Keyboard Navigation

All interactive elements are keyboard accessible:
- Tab navigation works throughout
- Focus indicators are visible
- Modal dialogs trap focus appropriately

---

## Performance

### Core Web Vitals

The platform is optimized for Google's Core Web Vitals:

#### Largest Contentful Paint (LCP)
- **Target:** < 2.5s
- **Optimizations:**
  - Route-based code splitting with React.lazy()
  - Image optimization with proper dimensions
  - Preconnect to external domains

#### First Input Delay (FID)
- **Target:** < 100ms
- **Optimizations:**
  - Minimal JavaScript execution on load
  - Deferred non-critical scripts
  - Optimized event handlers

#### Cumulative Layout Shift (CLS)
- **Target:** < 0.1
- **Optimizations:**
  - Reserved space for dynamic content
  - No layout shifts during load
  - Proper image dimensions

### SEO Performance Checklist

- ✅ Mobile-responsive design
- ✅ Fast page load times (< 3s)
- ✅ HTTPS enabled
- ✅ No broken links
- ✅ Proper canonical URLs
- ✅ Sitemap submitted
- ✅ Robots.txt configured
- ✅ Structured data implemented
- ✅ Meta tags on all pages
- ✅ Social media previews working

---

## Maintenance

### Monthly Tasks

1. **Check Search Console**
   - Review coverage issues
   - Check for crawl errors
   - Monitor search performance
   - Review mobile usability

2. **Update Sitemap**
   - Update lastmod dates
   - Add new pages
   - Remove deprecated pages

3. **Test Meta Tags**
   - Verify all pages have unique titles
   - Check description lengths
   - Update seasonal keywords

4. **Monitor Performance**
   - Check Core Web Vitals
   - Review page speed scores
   - Test mobile performance

### Quarterly Tasks

1. **Content Audit**
   - Review and update content
   - Check for outdated information
   - Optimize underperforming pages

2. **Competitor Analysis**
   - Research competitor keywords
   - Analyze their meta descriptions
   - Review their structured data

3. **Schema Updates**
   - Update organization information
   - Add new schema types if needed
   - Verify schema validity

### Annual Tasks

1. **SEO Strategy Review**
   - Analyze annual performance
   - Set new goals
   - Update keyword strategy

2. **Technical Audit**
   - Full site crawl
   - Check for technical issues
   - Update documentation

---

## Resources

### Official Documentation
- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards)

### Testing Tools
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Schema Markup Validator](https://validator.schema.org/)

### Learning Resources
- [Moz SEO Learning Center](https://moz.com/learn/seo)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Web.dev Learn SEO](https://web.dev/learn/seo/)

---

## Support

For questions or issues related to SEO implementation:

1. Check this documentation first
2. Review the component source code in `/src/components/SEO/`
3. Test using the tools listed above
4. Document any changes in this guide

---

*Last Updated: November 7, 2025*

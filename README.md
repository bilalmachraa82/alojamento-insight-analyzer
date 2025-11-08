# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/9bf4dc89-2484-418e-af13-fb4c8e7dbd1e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9bf4dc89-2484-418e-af13-fb4c8e7dbd1e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9bf4dc89-2484-418e-af13-fb4c8e7dbd1e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## SEO Implementation

This project includes comprehensive SEO best practices:

### Features
- ✅ **React Helmet Async** - Dynamic meta tags for all pages
- ✅ **Structured Data (JSON-LD)** - Organization, Website, SoftwareApplication, Service, Product schemas
- ✅ **Sitemap.xml** - XML sitemap for search engines
- ✅ **Robots.txt** - Proper crawler directives
- ✅ **Open Graph Tags** - Social media preview optimization
- ✅ **Twitter Cards** - Twitter-specific sharing optimization
- ✅ **Canonical URLs** - Prevent duplicate content issues
- ✅ **Semantic HTML** - Proper heading hierarchy and structure
- ✅ **Accessibility** - WCAG AA compliant

### Documentation
- **[SEO Guide](/docs/SEO-GUIDE.md)** - Comprehensive SEO implementation guide
- **[SEO Checklist](/docs/SEO-CHECKLIST.md)** - Pre-launch and maintenance checklists
- **[OG Image Instructions](/public/og-image-instructions.md)** - Social media image creation guide

### Quick Start
All pages automatically include SEO meta tags. To update meta tags for a new page:

```tsx
import MetaTags from '@/components/SEO/MetaTags';

function MyPage() {
  return (
    <>
      <MetaTags
        title="Page Title | Maria Faz"
        description="Page description under 160 characters"
        keywords="keyword1, keyword2, keyword3"
        canonicalUrl="https://alojamento-insight-analyzer.mariafaz.com/page"
      />
      {/* Your page content */}
    </>
  );
}
```

### Testing
- **Structured Data:** https://search.google.com/test/rich-results
- **Social Preview:** https://www.opengraph.xyz/
- **Mobile-Friendly:** https://search.google.com/test/mobile-friendly

### Action Required
1. Create final OG image (1200x630px) following `/public/og-image-instructions.md`
2. Submit sitemap to Google Search Console and Bing Webmaster Tools
3. Set up weekly SEO monitoring

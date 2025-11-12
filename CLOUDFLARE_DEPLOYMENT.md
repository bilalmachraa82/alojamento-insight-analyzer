# Cloudflare Pages Deployment Guide

Complete guide for deploying the Alojamento Insight Analyzer to Cloudflare Pages.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Connect GitHub Repository](#connect-github-repository)
4. [Configure Build Settings](#configure-build-settings)
5. [Environment Variables](#environment-variables)
6. [Custom Domain Setup](#custom-domain-setup)
7. [Testing Deployment](#testing-deployment)
8. [Monitoring & Analytics](#monitoring--analytics)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)
11. [Advanced Configuration](#advanced-configuration)

---

## Prerequisites

Before deploying, ensure you have:

- [x] GitHub account with repository access
- [x] Cloudflare account (free tier works)
- [x] All required API keys (Supabase, Hugging Face, Apify)
- [x] Domain name (optional, for custom domain)
- [x] Working local development environment

---

## Initial Setup

### 1. Create Cloudflare Account

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Sign up for a free account (no credit card required)
3. Verify your email address

### 2. Navigate to Pages

1. In Cloudflare Dashboard, click **Workers & Pages** in the sidebar
2. Click **Create application** button
3. Select **Pages** tab
4. Click **Connect to Git**

---

## Connect GitHub Repository

### Option A: Using Cloudflare Dashboard (Recommended)

1. Click **Connect GitHub** (or **Connect GitLab** if applicable)
2. Authorize Cloudflare to access your GitHub account
3. Select the **alojamento-insight-analyzer** repository
4. Click **Begin setup**

### Option B: Using Wrangler CLI

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy from command line
wrangler pages deploy dist
```

---

## Configure Build Settings

### Build Configuration

Set the following in the Cloudflare Pages dashboard:

| Setting | Value |
|---------|-------|
| **Project name** | `alojamento-insight-analyzer` |
| **Production branch** | `main` |
| **Framework preset** | `Vite` |
| **Build command** | `npm run build:production` |
| **Build output directory** | `dist` |
| **Node version** | `20` (or `18`) |

### Build Settings Screenshot Guide

1. **Production branch**: The branch that deploys to your production URL
2. **Preview branches**: All other branches deploy to preview URLs
3. **Build command**: Runs during deployment to build your app
4. **Output directory**: Where Vite outputs the built files

### Advanced Build Settings

```yaml
# .node-version (optional - place in project root)
20

# Alternative: use .nvmrc
# Place in project root with content: 20
```

---

## Environment Variables

### Required Variables

Configure these in: **Workers & Pages > Your Project > Settings > Environment Variables**

#### Supabase Configuration

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get from: [Supabase Dashboard](https://app.supabase.com/) > Your Project > Settings > API

#### Hugging Face API

```bash
VITE_HUGGINGFACE_API_KEY=hf_your_api_key
```

Get from: [Hugging Face Tokens](https://huggingface.co/settings/tokens)

#### Apify API

```bash
VITE_APIFY_API_KEY=apify_api_your_key
```

Get from: [Apify Console](https://console.apify.com/account/integrations)

### Optional Variables

#### Email Service (Resend)

```bash
VITE_RESEND_API_KEY=re_your_api_key
```

Get from: [Resend API Keys](https://resend.com/api-keys)

#### Analytics

```bash
# Google Analytics 4
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Sentry Error Tracking
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_SENTRY_AUTH_TOKEN=your_sentry_auth_token
VITE_SENTRY_ORG=your-org
VITE_SENTRY_PROJECT=your-project
```

### How to Add Environment Variables

1. Go to **Workers & Pages** > **alojamento-insight-analyzer** > **Settings**
2. Click **Environment variables** tab
3. Click **Add variables** button
4. For each variable:
   - **Variable name**: Enter the variable name (e.g., `VITE_SUPABASE_URL`)
   - **Value**: Enter the value
   - **Environment**: Choose:
     - **Production**: Only for main branch
     - **Preview**: Only for preview branches
     - **Both**: For all deployments (not recommended for sensitive data)
   - **Encrypt**: Toggle ON for API keys and secrets
5. Click **Save**
6. **Deploy** your site again for changes to take effect

### Environment Variable Best Practices

- Use **Production** variables for your production API keys
- Use **Preview** variables for development/testing API keys
- Always **Encrypt** sensitive values (API keys, secrets)
- Use different API keys for production vs preview when possible
- Never commit real API keys to your repository
- Rotate API keys regularly

---

## Custom Domain Setup

### Add Custom Domain

1. Go to **Workers & Pages** > **alojamento-insight-analyzer** > **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Click **Continue**

### Configure DNS

Cloudflare will provide DNS records to configure:

#### Option A: Domain on Cloudflare

If your domain is already on Cloudflare:
1. Click **Activate domain**
2. DNS records are added automatically
3. SSL certificate is provisioned automatically

#### Option B: Domain on Another Registrar

If your domain is elsewhere:
1. Add a CNAME record:
   ```
   Name: app (or your subdomain)
   Target: alojamento-insight-analyzer.pages.dev
   ```
2. Wait for DNS propagation (up to 48 hours, usually much faster)

### SSL Certificate

- SSL is automatic and free with Cloudflare Pages
- Certificates are provisioned within minutes
- Auto-renewal is handled by Cloudflare
- Both `yourdomain.com` and `www.yourdomain.com` are supported

### Verify Custom Domain

1. Wait for DNS propagation
2. Visit your custom domain
3. Verify SSL certificate (should show as secure)
4. Test all routes work correctly

---

## Testing Deployment

### Local Testing

Before deploying, test locally:

```bash
# Install dependencies
npm install

# Build for production
npm run build:production

# Preview production build locally
npm run preview

# Open http://localhost:4173
```

### Preview Deployments

Every push to a non-production branch creates a preview deployment:

1. Push to a feature branch:
   ```bash
   git checkout -b feature/my-feature
   git add .
   git commit -m "Add new feature"
   git push origin feature/my-feature
   ```

2. Cloudflare automatically builds and deploys
3. Preview URL: `https://<commit-hash>.alojamento-insight-analyzer.pages.dev`
4. Each commit gets a unique URL

### Production Deployment

1. Merge to main branch:
   ```bash
   git checkout main
   git merge feature/my-feature
   git push origin main
   ```

2. Cloudflare builds and deploys to production
3. Production URL: `https://alojamento-insight-analyzer.pages.dev`
4. Custom domain (if configured): `https://yourdomain.com`

### Deployment Checklist

Before marking deployment as successful:

- [ ] Site loads correctly
- [ ] All routes work (navigation)
- [ ] API connections work (Supabase, etc.)
- [ ] Authentication works
- [ ] Data loads correctly
- [ ] Forms submit correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] SSL certificate valid
- [ ] Custom domain works (if applicable)
- [ ] Analytics tracking works

---

## Monitoring & Analytics

### Cloudflare Web Analytics

1. Go to **Workers & Pages** > **alojamento-insight-analyzer** > **Analytics**
2. Click **Enable Web Analytics**
3. Analytics are automatically tracked (no code changes needed)

### View Deployment Logs

1. Go to **Workers & Pages** > **alojamento-insight-analyzer** > **Deployments**
2. Click on any deployment
3. View:
   - **Build log**: Build process output
   - **Functions log**: Runtime logs (if using Functions)
   - **Real-time logs**: Live request logs

### Sentry Error Tracking

If using Sentry (optional):

1. Configure Sentry environment variables (see above)
2. Source maps are automatically uploaded during build
3. View errors at [Sentry.io](https://sentry.io/)

### Performance Monitoring

Cloudflare provides:
- **Page views**: Total visits
- **Unique visitors**: Unique IPs
- **Page load time**: Performance metrics
- **Geographic data**: Visitor locations
- **Referrers**: Traffic sources

Access in: **Workers & Pages** > **alojamento-insight-analyzer** > **Analytics**

### Set Up Alerts

1. Go to **Notifications** in Cloudflare dashboard
2. Click **Add**
3. Configure alerts for:
   - **Build failures**: Get notified when builds fail
   - **High error rates**: Detect issues quickly
   - **SSL certificate expiry**: Renewal issues (rare)

---

## Rollback Procedures

### Immediate Rollback

If you need to rollback quickly:

1. Go to **Workers & Pages** > **alojamento-insight-analyzer** > **Deployments**
2. Find the last known good deployment
3. Click the **⋯** (three dots) menu
4. Select **Rollback to this deployment**
5. Confirm the rollback

**Note**: Rollback is instant and doesn't require a rebuild.

### Rollback Using Git

1. Identify the problematic commit:
   ```bash
   git log --oneline
   ```

2. Revert to previous commit:
   ```bash
   # Option A: Revert specific commit
   git revert <commit-hash>
   git push origin main

   # Option B: Reset to previous commit (destructive)
   git reset --hard <commit-hash>
   git push --force origin main
   ```

3. Cloudflare automatically redeploys the reverted code

### Rollback Environment Variables

If environment variable changes caused issues:

1. Go to **Settings** > **Environment variables**
2. Click **History** (if available)
3. Restore previous values
4. Click **Save and deploy**

### Emergency Procedures

If site is completely broken:

1. **Immediate**: Use Cloudflare dashboard rollback (instant)
2. **Fix forward**: Deploy a hotfix branch
3. **Temporary**: Put up maintenance page
4. **Communication**: Update status page or notify users

---

## Troubleshooting

### Build Failures

#### Issue: Build fails with "command not found"

**Solution**: Verify build command in settings

```bash
# Should be one of:
npm run build:production  # For production
npm run build:preview     # For preview
npm run build            # Default
```

#### Issue: Build fails with dependency errors

**Solution**: Clear build cache

1. Go to **Settings** > **Builds & deployments**
2. Click **Clear build cache**
3. Trigger new deployment

#### Issue: Build succeeds but site shows blank page

**Solution**: Check console for errors

1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Common issues:
   - Missing environment variables
   - API connection failures
   - CORS issues

### Deployment Issues

#### Issue: Preview deployment not created

**Solution**:

1. Check **Settings** > **Builds & deployments**
2. Ensure "Enable preview deployments" is ON
3. Verify branch is not ignored in settings

#### Issue: Custom domain not working

**Solution**:

1. Verify DNS records:
   ```bash
   # Check DNS propagation
   nslookup yourdomain.com
   dig yourdomain.com
   ```

2. Wait for DNS propagation (can take up to 48 hours)
3. Check SSL certificate status in Cloudflare dashboard

#### Issue: 404 on refresh

**Solution**: This is likely fixed by `_redirects` file, but if issues persist:

1. Verify `/public/_redirects` exists with:
   ```
   /* /index.html 200
   ```

2. Clear Cloudflare cache:
   - Go to **Caching** > **Configuration**
   - Click **Purge Everything**

### Environment Variable Issues

#### Issue: Environment variables not working

**Solution**:

1. Verify variable names start with `VITE_` (required for Vite)
2. Check they're set for the correct environment (Production/Preview)
3. Redeploy after adding variables (changes don't auto-apply)
4. Verify in build logs that variables are present (values will be hidden)

#### Issue: API keys not working

**Solution**:

1. Verify keys are correct (copy-paste from source)
2. Check API key permissions (some require specific scopes)
3. Verify API key hasn't expired
4. Test API key directly with curl/Postman

### Performance Issues

#### Issue: Slow load times

**Solution**:

1. Check Cloudflare Analytics for bottlenecks
2. Verify assets are being cached (check `_headers` file)
3. Consider code splitting:
   ```typescript
   // Use dynamic imports
   const Component = lazy(() => import('./Component'));
   ```

4. Enable compression in `_headers`:
   ```
   /assets/*
     Cache-Control: public, max-age=31536000, immutable
   ```

#### Issue: Large bundle size

**Solution**:

```bash
# Analyze bundle
npm run build:production -- --mode analyze

# Or add to package.json:
# "build:analyze": "vite build --mode production && vite-bundle-visualizer"
```

### Error Logging

#### Enable detailed logging

Add to your Vite config:

```typescript
export default defineConfig({
  build: {
    sourcemap: true, // Enable source maps
    minify: 'terser', // Better error messages
  },
});
```

#### View real-time logs

```bash
# Using wrangler CLI
wrangler pages deployment tail

# Follow logs in real-time
wrangler pages deployment tail --follow
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Build exceeded maximum duration` | Build timeout (> 20 min) | Optimize build process, reduce dependencies |
| `Failed to fetch` | API connection issue | Check environment variables, API endpoints |
| `CORS policy` | CORS headers missing | Configure in `_headers` or API server |
| `Module not found` | Missing dependency | Run `npm install`, check imports |
| `Hydration failed` | SSR/Client mismatch | Not applicable for SPA, check React errors |

### Getting Help

If you're still stuck:

1. **Cloudflare Community**: [community.cloudflare.com](https://community.cloudflare.com/)
2. **Cloudflare Discord**: [discord.gg/cloudflaredev](https://discord.gg/cloudflaredev)
3. **Documentation**: [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages/)
4. **Support Ticket**: Available for paid plans

---

## Advanced Configuration

### Functions (Cloudflare Workers)

Add server-side logic with Cloudflare Functions:

```bash
# Create functions directory
mkdir -p functions/api

# Example function: functions/api/hello.ts
export async function onRequest(context) {
  return new Response('Hello from Cloudflare Functions!');
}
```

Access at: `https://yourdomain.com/api/hello`

### Build Optimization

#### Enable Build Cache

Build cache is enabled by default, but you can configure:

```bash
# .cloudflare/build-cache.json (optional)
{
  "version": 1,
  "include": [
    "node_modules/**",
    ".vite/**"
  ]
}
```

#### Parallel Builds

Cloudflare Pages supports parallel builds automatically.

#### Build Minutes

- **Free Plan**: 500 build minutes/month
- **Pro Plan**: 5,000 build minutes/month
- Check usage: **Workers & Pages** > **alojamento-insight-analyzer** > **Usage**

### Security Headers

Headers are configured in `/public/_headers`. Enhance security:

```
/*
  # Additional security headers
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

  # Strict CSP (adjust as needed)
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
```

### Performance Optimization

#### Image Optimization

Use Cloudflare Images (paid feature) or optimize images before upload:

```bash
# Install image optimization tool
npm install -D vite-plugin-imagemin

# Add to vite.config.ts
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 3 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9] },
      svgo: { plugins: [{ name: 'removeViewBox' }] },
    }),
  ],
});
```

#### Code Splitting

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
});
```

### Caching Strategy

Optimize caching in `public/_headers`:

```
# HTML - No cache
/*.html
  Cache-Control: public, max-age=0, must-revalidate

# JS/CSS - Long cache with immutable
/assets/*.js
  Cache-Control: public, max-age=31536000, immutable

/assets/*.css
  Cache-Control: public, max-age=31536000, immutable

# Images - Medium cache
/images/*
  Cache-Control: public, max-age=2592000, immutable

# API responses - No cache
/api/*
  Cache-Control: no-store, no-cache, must-revalidate
```

### CI/CD Integration

See `.github/workflows/cloudflare-pages.yml` for GitHub Actions integration.

### Wrangler Configuration

Create `wrangler.toml` for advanced configuration:

```toml
name = "alojamento-insight-analyzer"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"

[env.production]
name = "alojamento-insight-analyzer"
route = "yourdomain.com/*"

[env.preview]
name = "alojamento-insight-analyzer-preview"
```

---

## Migration Guide

### From Vercel

1. Export environment variables from Vercel
2. Import to Cloudflare Pages (Settings > Environment variables)
3. Update build command if needed
4. Deploy to Cloudflare Pages
5. Update DNS to point to Cloudflare
6. Verify deployment
7. Delete Vercel project

### From Netlify

1. Export `_redirects` and `_headers` (already compatible)
2. Copy environment variables
3. Update build command:
   - Netlify: `npm run build`
   - Cloudflare: `npm run build:production`
4. Deploy to Cloudflare Pages
5. Update DNS
6. Verify deployment
7. Delete Netlify project

### Pre-Deployment Checklist

- [ ] All dependencies installed
- [ ] Build succeeds locally
- [ ] Environment variables documented
- [ ] API keys ready
- [ ] Custom domain DNS ready (if applicable)
- [ ] Analytics configured
- [ ] Error monitoring set up
- [ ] Team members have access
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

### Post-Deployment Verification

- [ ] Homepage loads
- [ ] All routes accessible
- [ ] Authentication works
- [ ] Database connections work
- [ ] API integrations work
- [ ] Forms submit correctly
- [ ] Email notifications work (if applicable)
- [ ] Error tracking works
- [ ] Analytics tracking works
- [ ] Performance is acceptable
- [ ] Mobile experience is good
- [ ] SSL certificate valid
- [ ] Custom domain works (if applicable)

---

## Resources

### Official Documentation

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)

### Community

- [Cloudflare Community](https://community.cloudflare.com/)
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/cloudflare-pages)

### Tools

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [DNS Checker](https://dnschecker.org/)

---

## Support

For issues specific to this project:
1. Check this documentation first
2. Search existing issues on GitHub
3. Create a new issue with:
   - Detailed description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Error messages/screenshots

For Cloudflare-specific issues:
- Free plan: Community support
- Paid plan: Email support + Community
- Enterprise: 24/7 support

---

**Last Updated**: 2025-11-07

**Version**: 1.0.0

**Maintainer**: Development Team

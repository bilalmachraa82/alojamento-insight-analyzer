# Cloudflare Pages Deployment Checklist

Use this checklist to ensure a smooth deployment to Cloudflare Pages.

## Pre-Deployment

### Code Preparation

- [ ] All code committed to Git
- [ ] Latest changes pushed to GitHub
- [ ] Build succeeds locally (`npm run build:production`)
- [ ] All tests passing (`npm run test:run`)
- [ ] No console errors in browser
- [ ] Environment variables documented in `.env.cloudflare.example`

### API Keys & Credentials

- [ ] Supabase URL and Anon Key ready
- [ ] Hugging Face API key obtained
- [ ] Apify API key obtained
- [ ] Resend API key obtained (if using email)
- [ ] Google Analytics ID ready (if using GA4)
- [ ] Sentry DSN ready (if using error tracking)
- [ ] All API keys tested and working

### Cloudflare Account

- [ ] Cloudflare account created
- [ ] Email verified
- [ ] GitHub account connected to Cloudflare
- [ ] API token created (if using GitHub Actions)
- [ ] Account ID noted (if using GitHub Actions)

## Initial Setup

### Repository Connection

- [ ] Logged into Cloudflare Dashboard
- [ ] Navigated to **Workers & Pages**
- [ ] Clicked **Create application** > **Pages**
- [ ] Selected **Connect to Git**
- [ ] Authorized Cloudflare to access GitHub
- [ ] Selected correct repository
- [ ] Clicked **Begin setup**

### Build Configuration

Set these values in Cloudflare:

- [ ] **Project name**: `alojamento-insight-analyzer`
- [ ] **Production branch**: `main`
- [ ] **Framework preset**: `Vite`
- [ ] **Build command**: `npm run build:production`
- [ ] **Build output directory**: `dist`
- [ ] **Root directory**: `/` (leave blank)
- [ ] **Node version**: `20` (or `18`)

### Environment Variables

Add in **Settings** > **Environment variables**:

#### Required Variables

- [ ] `VITE_SUPABASE_URL` (Production)
- [ ] `VITE_SUPABASE_ANON_KEY` (Production, Encrypted)
- [ ] `VITE_HUGGINGFACE_API_KEY` (Production, Encrypted)
- [ ] `VITE_APIFY_API_KEY` (Production, Encrypted)

#### Optional Variables

- [ ] `VITE_RESEND_API_KEY` (Production, Encrypted)
- [ ] `VITE_GA4_MEASUREMENT_ID` (Production)
- [ ] `VITE_SENTRY_DSN` (Production)
- [ ] `VITE_SENTRY_AUTH_TOKEN` (Production, Encrypted)
- [ ] `VITE_SENTRY_ORG` (Production)
- [ ] `VITE_SENTRY_PROJECT` (Production)

#### Preview Environment (Optional)

- [ ] Same variables configured for **Preview** environment
- [ ] Using test/development API keys for preview

### First Deployment

- [ ] Clicked **Save and Deploy**
- [ ] Watched build logs for errors
- [ ] Build completed successfully
- [ ] Deployment URL noted: `https://alojamento-insight-analyzer.pages.dev`

## Post-Deployment Testing

### Basic Functionality

- [ ] Homepage loads correctly
- [ ] All routes accessible (test navigation)
- [ ] No 404 errors on refresh
- [ ] No console errors in browser DevTools
- [ ] Mobile responsive design works
- [ ] SSL certificate shows as valid

### Authentication & Database

- [ ] Can connect to Supabase
- [ ] Login/signup works (if applicable)
- [ ] Data loads from database
- [ ] Data saves to database
- [ ] Real-time updates work (if applicable)

### API Integrations

- [ ] Hugging Face API calls work (sentiment analysis)
- [ ] Apify scraping works
- [ ] Email sending works (if configured)
- [ ] All third-party integrations functional

### Performance

- [ ] Page load time acceptable (< 3 seconds)
- [ ] Images load correctly
- [ ] Assets cached properly (check Network tab)
- [ ] No unnecessary re-renders
- [ ] JavaScript bundle size reasonable (< 1MB)

### Analytics & Monitoring

- [ ] Cloudflare Web Analytics enabled
- [ ] Google Analytics tracking (if configured)
- [ ] Sentry error tracking working (if configured)
- [ ] No errors in Sentry dashboard

## Custom Domain Setup (Optional)

### Add Domain

- [ ] Navigated to **Custom domains** tab
- [ ] Clicked **Set up a custom domain**
- [ ] Entered domain name
- [ ] Followed DNS configuration instructions

### DNS Configuration

For domain on Cloudflare:
- [ ] DNS records added automatically
- [ ] Domain activated

For external domain:
- [ ] CNAME record added at registrar
- [ ] DNS propagation complete (check with `nslookup`)

### SSL Certificate

- [ ] SSL certificate provisioned
- [ ] Certificate shows as valid
- [ ] HTTPS redirect working
- [ ] Both `www` and non-`www` working (if applicable)

### Verification

- [ ] Custom domain loads correctly
- [ ] All features work on custom domain
- [ ] SEO tags show custom domain

## GitHub Actions Setup (Optional)

### GitHub Secrets

- [ ] `CLOUDFLARE_API_TOKEN` added to GitHub Secrets
- [ ] `CLOUDFLARE_ACCOUNT_ID` added to GitHub Secrets
- [ ] All `VITE_*` environment variables added to GitHub Secrets

### Workflow Configuration

- [ ] `.github/workflows/cloudflare-pages.yml` exists
- [ ] Workflow permissions set (Settings > Actions > General)
- [ ] Workflow enabled (Actions tab)

### Test Workflow

- [ ] Push to main branch triggers workflow
- [ ] Tests run successfully
- [ ] Build completes
- [ ] Deployment succeeds
- [ ] Production site updated

### Test Preview Deployments

- [ ] Created test PR
- [ ] Workflow runs on PR
- [ ] Preview deployment created
- [ ] Comment with URL posted on PR
- [ ] Preview URL accessible and working

## Performance Optimization

### Cloudflare Settings

- [ ] Auto minify enabled (Speed > Optimization)
- [ ] Brotli compression enabled
- [ ] HTTP/3 enabled
- [ ] Early Hints enabled (if needed)

### Caching

- [ ] `_headers` file in place with cache rules
- [ ] Static assets cached (check Network tab)
- [ ] HTML not cached (for dynamic updates)
- [ ] Cache-Control headers correct

### Monitoring

- [ ] Cloudflare Analytics reviewed
- [ ] Performance metrics acceptable
- [ ] Core Web Vitals measured (if available)
- [ ] Page insights reviewed

## Security

### Headers

- [ ] Security headers configured in `_headers`
- [ ] CSP policy appropriate for app
- [ ] HSTS enabled
- [ ] X-Frame-Options set

### API Keys

- [ ] All sensitive keys encrypted in Cloudflare
- [ ] Different keys for production vs preview
- [ ] Keys not exposed in browser console
- [ ] No API keys in Git repository

### SSL/TLS

- [ ] SSL certificate valid
- [ ] TLS 1.2+ enforced
- [ ] HTTPS redirect working
- [ ] No mixed content warnings

## Documentation

- [ ] `CLOUDFLARE_DEPLOYMENT.md` reviewed
- [ ] `CLOUDFLARE_QUICKSTART.md` accessible to team
- [ ] `.env.cloudflare.example` up to date
- [ ] GitHub Actions setup documented (if used)
- [ ] Custom domain configuration documented (if used)

## Team Access

- [ ] Team members invited to Cloudflare account
- [ ] Appropriate roles assigned
- [ ] GitHub repository access granted
- [ ] Documentation shared with team

## Monitoring & Alerts

### Cloudflare Notifications

- [ ] Build failure alerts configured
- [ ] Error rate alerts set up
- [ ] SSL expiry alerts enabled

### External Monitoring

- [ ] Uptime monitoring configured (if using service)
- [ ] Error tracking reviewed (Sentry)
- [ ] Analytics dashboard bookmarked

## Rollback Plan

### Documentation

- [ ] Rollback procedure documented
- [ ] Team knows how to rollback
- [ ] Previous deployment URLs noted

### Test Rollback

- [ ] Tested rollback in Cloudflare dashboard
- [ ] Verified rollback works as expected
- [ ] Documented rollback time (~instant)

## Go Live

### Final Checks

- [ ] All tests passing
- [ ] All features working
- [ ] Performance acceptable
- [ ] Security headers in place
- [ ] Analytics tracking
- [ ] Team notified
- [ ] Documentation complete

### Communication

- [ ] Stakeholders notified of deployment
- [ ] Support team briefed
- [ ] Status page updated (if applicable)
- [ ] Social media announcement (if applicable)

### Post-Launch Monitoring

- [ ] Monitor error rates for first 24 hours
- [ ] Check analytics for traffic
- [ ] Review user feedback
- [ ] Address any critical issues immediately

## Maintenance

### Regular Tasks

- [ ] Review analytics weekly
- [ ] Check error logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate API keys quarterly
- [ ] Review security headers quarterly
- [ ] Test rollback procedure quarterly

### Optimization

- [ ] Monitor bundle size
- [ ] Review and optimize slow pages
- [ ] Update caching strategies as needed
- [ ] Review and optimize database queries

## Emergency Contacts

Document these for emergencies:

- [ ] Cloudflare support contact
- [ ] GitHub support (if paid plan)
- [ ] Team technical lead contact
- [ ] On-call rotation (if applicable)

## Notes

Use this space for deployment-specific notes:

```
Deployment Date: _______________
Deployed By: _______________
Production URL: _______________
Custom Domain: _______________
Issues Encountered: _______________
Lessons Learned: _______________
```

---

## Success Criteria

Deployment is considered successful when:

✅ All items in this checklist are completed
✅ Site is accessible and functional
✅ All tests passing
✅ No critical errors in monitoring
✅ Performance meets requirements
✅ Security headers in place
✅ Team can access and manage deployment

---

**Last Updated**: 2025-11-07
**Version**: 1.0.0
**Next Review**: Before each major deployment

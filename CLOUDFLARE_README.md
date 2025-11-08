# Cloudflare Pages Deployment - Complete Setup

This repository is fully configured for deployment to Cloudflare Pages with zero-config setup.

## Quick Start

**Deploy in 5 minutes:**

1. Push to GitHub
2. Connect to Cloudflare Pages
3. Set environment variables
4. Deploy!

See [CLOUDFLARE_QUICKSTART.md](./CLOUDFLARE_QUICKSTART.md) for detailed steps.

---

## What's Included

This setup includes everything you need for a production-ready Cloudflare Pages deployment:

### Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| `_headers` | Security & cache headers | `/public/_headers` |
| `_redirects` | SPA routing configuration | `/public/_redirects` |
| `wrangler.toml` | Cloudflare Workers config | `/wrangler.toml` |
| `.node-version` | Node.js version for builds | `/.node-version` |
| `404.html` | Custom 404 error page | `/public/404.html` |
| `500.html` | Custom 500 error page | `/public/500.html` |

### Documentation

| Document | Description |
|----------|-------------|
| [CLOUDFLARE_QUICKSTART.md](./CLOUDFLARE_QUICKSTART.md) | 5-minute deployment guide |
| [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) | Complete deployment documentation |
| [CLOUDFLARE_DEPLOYMENT_CHECKLIST.md](./CLOUDFLARE_DEPLOYMENT_CHECKLIST.md) | Pre/post deployment checklist |
| [CLOUDFLARE_MIGRATION_GUIDE.md](./CLOUDFLARE_MIGRATION_GUIDE.md) | Migrating from other platforms |
| [.env.cloudflare.example](./.env.cloudflare.example) | Environment variables template |

### GitHub Actions (Optional)

| File | Purpose |
|------|---------|
| `.github/workflows/cloudflare-pages.yml` | Automated deployments |
| `.github/CLOUDFLARE_ACTIONS_SETUP.md` | GitHub Actions setup guide |

### Build Scripts

Added to `package.json`:

```json
{
  "scripts": {
    "build:preview": "vite build --mode preview",
    "build:production": "vite build --mode production"
  }
}
```

### Optimizations

- ✅ **Manual chunk splitting** - Better caching
- ✅ **Terser minification** - Smaller bundles
- ✅ **Source maps** - Error tracking
- ✅ **Security headers** - CSP, HSTS, X-Frame-Options
- ✅ **Cache optimization** - Static assets cached for 1 year
- ✅ **SPA routing** - No 404s on refresh
- ✅ **Error pages** - Custom 404/500 pages

---

## Deployment Options

### Option 1: Cloudflare Dashboard (Recommended)

**Best for:** First-time setup, manual deployments

1. Follow [CLOUDFLARE_QUICKSTART.md](./CLOUDFLARE_QUICKSTART.md)
2. Deploy through Cloudflare dashboard
3. ~5 minutes to production

### Option 2: GitHub Actions

**Best for:** Automated CI/CD, team workflows

1. Follow [.github/CLOUDFLARE_ACTIONS_SETUP.md](./.github/CLOUDFLARE_ACTIONS_SETUP.md)
2. Set up GitHub secrets
3. Push to main → auto-deploy

### Option 3: Wrangler CLI

**Best for:** Local deployments, quick testing

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Build
npm run build:production

# Deploy
wrangler pages deploy dist
```

---

## Build Configuration

### Cloudflare Dashboard Settings

```
Project name:           alojamento-insight-analyzer
Production branch:      main
Framework preset:       Vite
Build command:          npm run build:production
Build output directory: dist
Node version:           20
```

### Environment Variables Required

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_HUGGINGFACE_API_KEY=hf_your_api_key
VITE_APIFY_API_KEY=apify_api_your_key
```

See [.env.cloudflare.example](./.env.cloudflare.example) for all variables.

---

## Features

### Security

- **HTTPS/SSL**: Automatic, free, auto-renewing
- **Security Headers**: CSP, HSTS, X-Frame-Options, XSS Protection
- **Encrypted Variables**: All API keys encrypted in Cloudflare
- **DDoS Protection**: Cloudflare's network-level protection

### Performance

- **Global CDN**: 275+ cities worldwide
- **Unlimited Bandwidth**: No bandwidth limits
- **Smart Caching**: Static assets cached for 1 year
- **Brotli/Gzip**: Automatic compression
- **HTTP/3**: Latest protocol support

### Developer Experience

- **Git Integration**: Push to deploy
- **Preview Deployments**: Every PR gets a unique URL
- **Instant Rollbacks**: One-click rollback to any deployment
- **Build Logs**: Detailed build and runtime logs
- **Analytics**: Built-in web analytics

---

## Project Structure

```
alojamento-insight-analyzer/
├── public/
│   ├── _headers              # Security & cache headers
│   ├── _redirects            # SPA routing
│   ├── 404.html              # Custom 404 page
│   ├── 500.html              # Custom 500 page
│   ├── favicon.ico
│   └── robots.txt
├── .github/
│   ├── workflows/
│   │   └── cloudflare-pages.yml  # CI/CD workflow
│   └── CLOUDFLARE_ACTIONS_SETUP.md
├── src/
│   └── ... (your app code)
├── .node-version             # Node.js version
├── wrangler.toml             # Cloudflare config
├── vite.config.ts            # Optimized build config
├── package.json              # Build scripts
├── .env.cloudflare.example   # Environment variables template
├── CLOUDFLARE_QUICKSTART.md  # 5-min deployment guide
├── CLOUDFLARE_DEPLOYMENT.md  # Complete deployment guide
├── CLOUDFLARE_DEPLOYMENT_CHECKLIST.md
├── CLOUDFLARE_MIGRATION_GUIDE.md
└── CLOUDFLARE_README.md      # This file
```

---

## Verification

After deployment, verify:

- [ ] Site loads at `https://alojamento-insight-analyzer.pages.dev`
- [ ] All routes work (no 404 on refresh)
- [ ] API connections work (Supabase, etc.)
- [ ] Environment variables loaded
- [ ] SSL certificate valid
- [ ] Security headers present (check DevTools)
- [ ] Assets cached correctly (check Network tab)
- [ ] No console errors

See [CLOUDFLARE_DEPLOYMENT_CHECKLIST.md](./CLOUDFLARE_DEPLOYMENT_CHECKLIST.md) for complete checklist.

---

## Monitoring

### Cloudflare Web Analytics

Enable in: **Workers & Pages** > **alojamento-insight-analyzer** > **Analytics**

Provides:
- Page views
- Unique visitors
- Page load time
- Geographic data
- Referrers

### Build & Deployment Logs

View in: **Workers & Pages** > **alojamento-insight-analyzer** > **Deployments**

### Error Tracking (Optional)

Configure Sentry for production error tracking:
```bash
VITE_SENTRY_DSN=https://...@sentry.io/...
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check build logs, verify Node version |
| Env vars not working | Ensure `VITE_` prefix, redeploy after adding |
| 404 on refresh | Verify `_redirects` file exists |
| Slow loading | Check caching headers in `_headers` |
| API calls fail | Check CORS headers, verify env vars |

See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md#troubleshooting) for detailed troubleshooting.

---

## Custom Domain Setup

1. Go to **Custom domains** tab
2. Click **Set up a custom domain**
3. Enter your domain
4. Follow DNS configuration instructions
5. Wait for SSL certificate (automatic)

See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md#custom-domain-setup) for details.

---

## Rollback

If something goes wrong:

1. Go to **Deployments** tab
2. Find last known good deployment
3. Click **⋯** menu → **Rollback**
4. Rollback is instant (no rebuild required)

---

## Cost

### Free Tier Includes:

- ✅ Unlimited bandwidth
- ✅ 500 build minutes/month
- ✅ Unlimited sites
- ✅ Unlimited team members
- ✅ Preview deployments
- ✅ Custom domains
- ✅ SSL certificates
- ✅ DDoS protection
- ✅ Web analytics

**Total cost: $0/month**

### Paid Plans (Optional):

- **Cloudflare Pages Pro**: $20/month
  - 5,000 build minutes
  - Additional features

---

## Support

### Documentation

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Vite Documentation](https://vitejs.dev/)
- Project-specific docs in this repository

### Community

- [Cloudflare Community](https://community.cloudflare.com/)
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/cloudflare-pages)

### Professional Support

- Free plan: Community support
- Paid plans: Email support
- Enterprise: 24/7 support

---

## Next Steps

1. ✅ **Deploy**: Follow [CLOUDFLARE_QUICKSTART.md](./CLOUDFLARE_QUICKSTART.md)
2. ✅ **Verify**: Use [CLOUDFLARE_DEPLOYMENT_CHECKLIST.md](./CLOUDFLARE_DEPLOYMENT_CHECKLIST.md)
3. ✅ **Monitor**: Enable analytics and error tracking
4. ✅ **Optimize**: Review performance metrics
5. ✅ **Scale**: Add team members, custom domain

---

## Additional Resources

### Migration Guides

Migrating from another platform?
- See [CLOUDFLARE_MIGRATION_GUIDE.md](./CLOUDFLARE_MIGRATION_GUIDE.md)

### CI/CD Setup

Want automated deployments?
- See [.github/CLOUDFLARE_ACTIONS_SETUP.md](./.github/CLOUDFLARE_ACTIONS_SETUP.md)

### Environment Variables

Need help with env vars?
- See [.env.cloudflare.example](./.env.cloudflare.example)

---

## Contributing

When making changes:

1. Test locally:
   ```bash
   npm run build:production
   npm run preview
   ```

2. Create PR for preview deployment

3. Merge to main for production

4. Monitor deployment in Cloudflare dashboard

---

## License

Same as main project license.

---

## Changelog

### v1.0.0 (2025-11-07)

- ✅ Initial Cloudflare Pages setup
- ✅ Security headers configured
- ✅ SPA routing enabled
- ✅ Build optimization
- ✅ Error pages (404, 500)
- ✅ GitHub Actions workflow
- ✅ Complete documentation

---

**Need Help?** Start with [CLOUDFLARE_QUICKSTART.md](./CLOUDFLARE_QUICKSTART.md)

**Questions?** Check [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md#troubleshooting)

**Ready to Deploy?** You're all set! 🚀

# Cloudflare Pages Quick Start Guide

The fastest way to deploy your Alojamento Insight Analyzer to Cloudflare Pages.

## 5-Minute Deployment

### Step 1: Push to GitHub (if not already done)

```bash
git add .
git commit -m "Ready for Cloudflare deployment"
git push origin main
```

### Step 2: Connect to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **Workers & Pages**
3. Click **Create application** > **Pages** > **Connect to Git**
4. Select your repository: **alojamento-insight-analyzer**

### Step 3: Configure Build Settings

Use these exact settings:

```
Production branch:        main
Build command:           npm run build:production
Build output directory:  dist
```

### Step 4: Add Environment Variables

Go to **Settings** > **Environment variables** and add:

**Required:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_HUGGINGFACE_API_KEY=hf_your_api_key
VITE_APIFY_API_KEY=apify_api_your_key
```

**Optional (for full features):**
```bash
VITE_RESEND_API_KEY=re_your_api_key
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

**Important:** Toggle **Encrypt** for all API keys!

### Step 5: Deploy

1. Click **Save and Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Your app is live at: `https://alojamento-insight-analyzer.pages.dev`

## What's Included

This deployment includes:

- ✅ Automatic HTTPS/SSL
- ✅ Global CDN
- ✅ Security headers configured
- ✅ SPA routing enabled
- ✅ Build optimization
- ✅ Error pages (404, 500)
- ✅ Preview deployments for PRs
- ✅ Automatic cache busting

## GitHub Actions (Optional)

To enable automated deployments via GitHub Actions:

1. Get Cloudflare API token:
   - Go to **My Profile** > **API Tokens** > **Create Token**
   - Use template: **Edit Cloudflare Workers**
   - Copy the token

2. Add to GitHub Secrets:
   - Go to your repo **Settings** > **Secrets and variables** > **Actions**
   - Add `CLOUDFLARE_API_TOKEN` with the token value
   - Add `CLOUDFLARE_ACCOUNT_ID` (find in Cloudflare dashboard)

3. Add all environment variables as GitHub Secrets:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_HUGGINGFACE_API_KEY
   VITE_APIFY_API_KEY
   (etc.)
   ```

4. Push to main branch - automatic deployment will trigger!

## Custom Domain (Optional)

1. Go to **Custom domains** > **Set up a custom domain**
2. Enter your domain: `app.yourdomain.com`
3. Add DNS record (automatic if domain is on Cloudflare)
4. Wait for SSL certificate provisioning (~5 minutes)
5. Done! Your app is at `https://app.yourdomain.com`

## Troubleshooting

### Build Failed?

**Check build logs:**
1. Go to **Deployments** > Click on failed deployment
2. View build log for errors
3. Common fixes:
   - Clear build cache in **Settings**
   - Verify Node version is 18 or 20
   - Check for missing dependencies

### Site Not Loading?

**Check environment variables:**
1. Go to **Settings** > **Environment variables**
2. Verify all required variables are set
3. Make sure they're set for **Production** environment
4. Redeploy after adding variables

### Preview Deployments Not Working?

1. Go to **Settings** > **Builds & deployments**
2. Enable **Preview deployments**
3. Set preview environment variables if needed

## Need More Help?

- 📖 **Full Guide**: See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)
- 💬 **Cloudflare Community**: [community.cloudflare.com](https://community.cloudflare.com/)
- 📚 **Official Docs**: [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages/)

## Next Steps

After deployment:

1. ✅ Test all features work
2. ✅ Enable Cloudflare Web Analytics
3. ✅ Set up custom domain (optional)
4. ✅ Configure Sentry error tracking (optional)
5. ✅ Enable GitHub Actions for CI/CD (optional)

---

**Deployment Time**: ~5 minutes
**Cost**: Free (Cloudflare Pages Free Tier)
**Support**: Community (Free) or Email (Paid plans)

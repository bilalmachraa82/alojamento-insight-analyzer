# Migration Guide to Cloudflare Pages

Complete guide for migrating to Cloudflare Pages from other platforms.

## Table of Contents

1. [From Vercel](#from-vercel)
2. [From Netlify](#from-netlify)
3. [From GitHub Pages](#from-github-pages)
4. [From AWS S3/CloudFront](#from-aws-s3cloudfront)
5. [General Migration Steps](#general-migration-steps)
6. [Post-Migration Checklist](#post-migration-checklist)

---

## From Vercel

### Similarities

- Both use Git-based deployments
- Similar build configuration
- Environment variables work similarly
- Automatic HTTPS/SSL
- Preview deployments for PRs

### Key Differences

| Feature | Vercel | Cloudflare Pages |
|---------|--------|------------------|
| **Edge Network** | Vercel Edge | Cloudflare CDN (275+ cities) |
| **Build minutes** | 6,000/month (Hobby) | 500/month (Free) |
| **Bandwidth** | 100GB/month | Unlimited |
| **Serverless** | Vercel Functions | Cloudflare Workers |
| **Configuration** | `vercel.json` | `_headers`, `_redirects` |
| **Environment vars** | UI or CLI | UI only |

### Migration Steps

1. **Export environment variables from Vercel**:
   ```bash
   # Using Vercel CLI
   vercel env pull .env.vercel
   ```

2. **Convert `vercel.json` to Cloudflare config**:

   **Vercel (`vercel.json`):**
   ```json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           }
         ]
       }
     ]
   }
   ```

   **Cloudflare (`public/_headers`):**
   ```
   /*
     X-Frame-Options: DENY
   ```

3. **Update build command if needed**:
   - Vercel: `npm run build` or auto-detected
   - Cloudflare: `npm run build:production`

4. **Deploy to Cloudflare** (see [CLOUDFLARE_QUICKSTART.md](./CLOUDFLARE_QUICKSTART.md))

5. **Test thoroughly** on Cloudflare preview URL

6. **Update DNS**:
   - Remove Vercel DNS records
   - Add Cloudflare DNS records (or transfer domain to Cloudflare)

7. **Monitor for 24-48 hours** before deleting Vercel project

### Vercel-Specific Features

- **Vercel Functions** → Use Cloudflare Workers/Pages Functions
- **Vercel Analytics** → Use Cloudflare Web Analytics
- **Vercel OG Image** → Use Cloudflare Images or self-hosted solution
- **Vercel Edge Config** → Use Cloudflare KV

---

## From Netlify

### Similarities

- Both use `_headers` and `_redirects` files
- Git-based deployments
- Preview deployments
- Build plugins architecture
- Free tier available

### Key Differences

| Feature | Netlify | Cloudflare Pages |
|---------|---------|------------------|
| **Build minutes** | 300/month (Free) | 500/month (Free) |
| **Bandwidth** | 100GB/month | Unlimited |
| **Form handling** | Built-in | Use Workers/external |
| **Functions** | Netlify Functions | Cloudflare Workers |
| **Configuration** | `netlify.toml` | `wrangler.toml` |

### Migration Steps

1. **Files are mostly compatible**:
   - `_headers` → Copy as-is ✅
   - `_redirects` → Copy as-is ✅
   - `netlify.toml` → Convert to `wrangler.toml`

2. **Convert `netlify.toml`**:

   **Netlify (`netlify.toml`):**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

   **Cloudflare (`wrangler.toml`):**
   ```toml
   name = "alojamento-insight-analyzer"
   pages_build_output_dir = "dist"

   [build]
     command = "npm run build:production"
   ```

3. **Replace Netlify-specific features**:
   - **Forms** → Use Cloudflare Workers or external service
   - **Identity** → Use Supabase Auth or Auth0
   - **Functions** → Convert to Cloudflare Workers

4. **Export environment variables**:
   ```bash
   # From Netlify UI
   # Site Settings > Environment variables > Export
   ```

5. **Deploy to Cloudflare** and test

6. **Update DNS** when ready

### Netlify-Specific Features

- **Netlify Forms** → Use Formspree, Basin, or Cloudflare Workers
- **Netlify Identity** → Use Supabase Auth, Auth0, or Clerk
- **Netlify Functions** → Migrate to Cloudflare Workers
- **Build Plugins** → Use Cloudflare Build configuration

---

## From GitHub Pages

### Key Differences

| Feature | GitHub Pages | Cloudflare Pages |
|---------|--------------|------------------|
| **Build system** | Jekyll only (or pre-built) | Any framework |
| **Custom domains** | CNAME file | Dashboard config |
| **Environment vars** | Not supported | Fully supported |
| **Dynamic routes** | Limited | Full support |
| **Build time** | ~1 minute | ~2-3 minutes |

### Migration Steps

1. **No special configuration to migrate** - GitHub Pages is simpler

2. **Replace `CNAME` file** with Cloudflare domain config

3. **If using Jekyll**:
   - Keep Jekyll if you want
   - Or migrate to Vite/React (modern alternative)

4. **Add build command**:
   - GitHub Pages: Auto-build Jekyll or manual build
   - Cloudflare: `npm run build:production`

5. **Deploy to Cloudflare**

6. **Update DNS**:
   - Remove GitHub Pages DNS (A records or CNAME)
   - Add Cloudflare DNS

---

## From AWS S3/CloudFront

### Key Differences

| Feature | AWS S3/CloudFront | Cloudflare Pages |
|---------|-------------------|------------------|
| **Setup complexity** | High (manual) | Low (automated) |
| **Cost** | Pay per use | Free tier generous |
| **Configuration** | AWS Console (complex) | Simple dashboard |
| **Deployments** | Manual or CI/CD | Git-based auto |
| **SSL certificates** | AWS Certificate Manager | Automatic |

### Migration Steps

1. **Much simpler setup** on Cloudflare

2. **No S3 bucket configuration needed**

3. **No CloudFront distribution setup**

4. **No AWS Certificate Manager**

5. **Replace deployment scripts**:

   **AWS (old):**
   ```bash
   aws s3 sync dist/ s3://bucket-name
   aws cloudfront create-invalidation
   ```

   **Cloudflare (new):**
   ```bash
   git push origin main  # That's it!
   ```

6. **Update DNS** from Route 53 to Cloudflare

### Cost Comparison

**AWS (typical monthly cost):**
- S3: $1-5
- CloudFront: $1-10
- Route 53: $0.50
- **Total**: ~$3-15/month

**Cloudflare:**
- Free tier: $0
- Pro (optional): $20/month

---

## General Migration Steps

### Pre-Migration

1. **Document current setup**:
   - Domain configuration
   - Environment variables
   - Build commands
   - Custom configurations

2. **Test build locally**:
   ```bash
   npm run build:production
   npm run preview
   ```

3. **Export environment variables**:
   - Save all variables from current platform
   - Document which are sensitive (encrypted)

4. **Note custom domain settings**:
   - DNS records
   - SSL certificate info
   - CDN settings

### During Migration

1. **Deploy to Cloudflare** (see [CLOUDFLARE_QUICKSTART.md](./CLOUDFLARE_QUICKSTART.md))

2. **Configure environment variables**

3. **Test on Cloudflare preview URL**:
   - Verify all features work
   - Check API integrations
   - Test authentication
   - Verify performance

4. **Set up custom domain** on Cloudflare (don't update DNS yet)

5. **Run both platforms in parallel** for testing

### DNS Migration

**Zero-Downtime Migration:**

1. **Lower TTL** on current DNS (24-48 hours before):
   ```
   TTL: 300 seconds (5 minutes)
   ```

2. **Update DNS records** to point to Cloudflare:
   ```
   Old: your-app.vercel.app
   New: your-app.pages.dev
   ```

3. **Monitor both platforms** for 24 hours

4. **Verify new platform** getting traffic (Cloudflare Analytics)

5. **Decommission old platform** after confirming success

### Post-Migration

1. **Monitor for 48 hours**:
   - Check error rates
   - Verify analytics
   - Review performance
   - Check user reports

2. **Update documentation**:
   - Deployment process
   - Environment variables
   - Team access

3. **Clean up old platform**:
   - Export any logs/analytics you need
   - Cancel subscription
   - Delete project

---

## Post-Migration Checklist

### Functionality

- [ ] Site loads correctly
- [ ] All routes accessible
- [ ] Forms submit correctly
- [ ] Authentication works
- [ ] Database connections work
- [ ] API integrations work
- [ ] File uploads work (if applicable)

### Performance

- [ ] Page load time acceptable
- [ ] Images load correctly
- [ ] Assets cached properly
- [ ] No performance regression
- [ ] Mobile experience good

### DNS & Domain

- [ ] Custom domain resolves correctly
- [ ] SSL certificate valid
- [ ] HTTPS redirect working
- [ ] WWW redirect working (if configured)
- [ ] Email delivery not affected (if on same domain)

### Monitoring

- [ ] Analytics tracking works
- [ ] Error monitoring works
- [ ] Logs accessible
- [ ] Alerts configured

### Team

- [ ] Team has access to Cloudflare
- [ ] Team knows how to deploy
- [ ] Documentation updated
- [ ] Rollback plan documented

---

## Platform Comparison Table

| Feature | Vercel | Netlify | GitHub Pages | AWS | Cloudflare Pages |
|---------|--------|---------|--------------|-----|------------------|
| **Free bandwidth** | 100GB | 100GB | 100GB | Pay-per-use | Unlimited |
| **Build minutes** | 6,000 | 300 | Unlimited | N/A | 500 |
| **Edge locations** | ~15 | ~15 | ~1 | ~400 | ~275 |
| **Setup time** | 5 min | 5 min | 5 min | 30-60 min | 5 min |
| **Serverless** | Functions | Functions | No | Lambda | Workers |
| **Environment vars** | Yes | Yes | No | Yes | Yes |
| **Preview deploys** | Yes | Yes | No | Manual | Yes |
| **Custom domains** | Yes | Yes | Yes | Yes | Yes |
| **SSL** | Auto | Auto | Auto | Manual | Auto |
| **Git integration** | Yes | Yes | Yes | No | Yes |

---

## Troubleshooting Common Migration Issues

### Issue: Build fails on Cloudflare but works locally

**Solution:**
- Check Node version matches (use `.node-version` file)
- Verify all dependencies in `package.json`
- Check build command is correct
- Review build logs for specific errors

### Issue: Environment variables not working

**Solution:**
- Ensure variables start with `VITE_` prefix (for Vite apps)
- Check they're set for correct environment (Production/Preview)
- Verify encryption toggle if sensitive
- Redeploy after adding variables

### Issue: Custom domain not resolving

**Solution:**
- Wait for DNS propagation (up to 48 hours)
- Check DNS records are correct
- Use `nslookup` or `dig` to verify
- Ensure old DNS records are removed

### Issue: Slower than previous platform

**Solution:**
- Enable Cloudflare caching features
- Check `_headers` file has correct cache rules
- Review bundle size
- Enable compression in Cloudflare dashboard

### Issue: API calls failing

**Solution:**
- Check CORS headers
- Verify API endpoints are accessible
- Check environment variables are set
- Review security headers (CSP)

---

## Cost Comparison

### Vercel vs Cloudflare

**Vercel Pro: $20/month**
- 100GB bandwidth
- Unlimited team members

**Cloudflare Pages Free: $0**
- Unlimited bandwidth
- 500 build minutes
- Unlimited team members

**Savings: $20/month = $240/year**

### Netlify vs Cloudflare

**Netlify Pro: $19/month**
- 100GB bandwidth

**Cloudflare Pages Free: $0**
- Unlimited bandwidth

**Savings: $19/month = $228/year**

### AWS vs Cloudflare

**AWS (typical): $10/month**
- S3 + CloudFront + Route 53

**Cloudflare Pages Free: $0**

**Savings: $10/month = $120/year**

---

## Getting Help

### Migration Support

- **Cloudflare Community**: [community.cloudflare.com](https://community.cloudflare.com/)
- **Discord**: [discord.gg/cloudflaredev](https://discord.gg/cloudflaredev)
- **Documentation**: [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages/)

### Platform-Specific Guides

- **Vercel Migration**: [developers.cloudflare.com/pages/migrations/vercel](https://developers.cloudflare.com/pages/migrations/vercel)
- **Netlify Migration**: [developers.cloudflare.com/pages/migrations/netlify](https://developers.cloudflare.com/pages/migrations/netlify)

---

**Estimated Migration Time**:
- Simple app: 15-30 minutes
- Complex app: 1-2 hours
- With custom domain: Add 24-48 hours for DNS

**Success Rate**: ~95% of migrations are straightforward

**Rollback Time**: Instant (just revert DNS)

# Cloudflare Pages - Command Reference

Quick reference for common Cloudflare Pages operations.

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build:production

# Build for preview
npm run build:preview

# Preview production build locally
npm run preview

# Run tests
npm run test:run

# Run linter
npm run lint
```

## Wrangler CLI

### Installation

```bash
# Install globally
npm install -g wrangler

# Or use via npx (no installation)
npx wrangler --version
```

### Authentication

```bash
# Login to Cloudflare
wrangler login

# Logout
wrangler logout

# Check authentication status
wrangler whoami
```

### Deployment

```bash
# Deploy to production
npm run build:production
wrangler pages deploy dist

# Deploy with custom name
wrangler pages deploy dist --project-name=alojamento-insight-analyzer

# Deploy to specific branch
wrangler pages deploy dist --branch=staging

# Deploy with commit message
wrangler pages deploy dist --commit-message="Deploy v1.0.0"
```

### Project Management

```bash
# List all projects
wrangler pages project list

# Create new project
wrangler pages project create alojamento-insight-analyzer

# Delete project (careful!)
wrangler pages project delete alojamento-insight-analyzer
```

### Deployment Management

```bash
# List deployments
wrangler pages deployment list

# View specific deployment
wrangler pages deployment view <deployment-id>

# Tail deployment logs (real-time)
wrangler pages deployment tail

# Tail logs with filter
wrangler pages deployment tail --status=error
```

### Environment Variables

```bash
# List environment variables
wrangler pages secret list

# Add secret (encrypted)
wrangler pages secret put VITE_SUPABASE_ANON_KEY

# Delete secret
wrangler pages secret delete VITE_SUPABASE_ANON_KEY
```

## GitHub CLI (gh)

### Installation

```bash
# Install GitHub CLI
# macOS
brew install gh

# Windows
winget install --id GitHub.cli

# Linux
# See: https://github.com/cli/cli#installation
```

### Authentication

```bash
# Login to GitHub
gh auth login

# Check status
gh auth status
```

### Workflow Management

```bash
# List workflows
gh workflow list

# View workflow runs
gh run list

# View specific run
gh run view <run-id>

# View latest run
gh run view --web

# Cancel workflow run
gh run cancel <run-id>

# Re-run workflow
gh run rerun <run-id>

# Manually trigger workflow
gh workflow run cloudflare-pages.yml

# Watch workflow run
gh run watch
```

### Secrets Management

```bash
# List secrets
gh secret list

# Set secret
gh secret set CLOUDFLARE_API_TOKEN

# Set secret from file
gh secret set CLOUDFLARE_API_TOKEN < token.txt

# Delete secret
gh secret delete CLOUDFLARE_API_TOKEN
```

## Git Commands

```bash
# Check status
git status

# Add all files
git add .

# Commit changes
git commit -m "Deploy to Cloudflare"

# Push to main (triggers production deploy)
git push origin main

# Create and push feature branch (triggers preview deploy)
git checkout -b feature/new-feature
git push origin feature/new-feature

# Tag release
git tag v1.0.0
git push origin v1.0.0
```

## Build Analysis

```bash
# Analyze bundle size
npm run build:production
npx vite-bundle-visualizer

# Check bundle size
npm run build:production
du -sh dist/*

# List largest files
npm run build:production
find dist -type f -exec du -h {} + | sort -rh | head -20
```

## Testing

```bash
# Run all tests
npm run test:all

# Run unit tests
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Environment Variables

```bash
# Copy example env file
cp .env.cloudflare.example .env.local

# View environment variables (locally)
cat .env.local

# Test with specific env file
NODE_ENV=production npm run build
```

## DNS & Domain

```bash
# Check DNS propagation
nslookup yourdomain.com

# Check DNS with dig
dig yourdomain.com

# Check DNS with multiple servers
dig @1.1.1.1 yourdomain.com
dig @8.8.8.8 yourdomain.com

# Check CNAME record
dig CNAME yourdomain.com

# Check with all details
dig +trace yourdomain.com
```

## Performance Testing

```bash
# Test page load speed (using curl)
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com

# Where curl-format.txt contains:
# time_namelookup:  %{time_namelookup}\n
# time_connect:  %{time_connect}\n
# time_starttransfer:  %{time_starttransfer}\n
# time_total:  %{time_total}\n

# Or use httpstat
npm install -g httpstat
httpstat https://yourdomain.com

# Lighthouse CLI
npm install -g @lhci/cli
lhci autorun --collect.url=https://yourdomain.com
```

## Security Testing

```bash
# Check security headers
curl -I https://yourdomain.com

# Check SSL certificate
openssl s_client -connect yourdomain.com:443

# Check SSL grade (using SSL Labs API)
curl "https://api.ssllabs.com/api/v3/analyze?host=yourdomain.com"

# Test CSP
curl -I https://yourdomain.com | grep -i "content-security-policy"
```

## Debugging

```bash
# View build logs locally
npm run build:production 2>&1 | tee build.log

# Check for console errors in production
# (Open browser DevTools and run)
# console.log('Check for errors...')

# View source maps
npm run build:production
ls -la dist/assets/*.map

# Test production build locally
npm run build:production && npm run preview
```

## Useful One-Liners

```bash
# Build and deploy in one command
npm run build:production && wrangler pages deploy dist

# Build, test, and deploy
npm run test:run && npm run build:production && wrangler pages deploy dist

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json && npm install

# Check build size
npm run build:production && du -sh dist

# Find all TODO comments
grep -r "TODO" src/

# Count lines of code
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l

# Check for unused dependencies
npx depcheck
```

## CI/CD Triggers

```bash
# Trigger GitHub Actions manually
gh workflow run cloudflare-pages.yml

# Trigger with specific branch
gh workflow run cloudflare-pages.yml --ref feature/new-feature

# Empty commit to trigger deployment
git commit --allow-empty -m "Trigger deployment"
git push
```

## Cloudflare API (Advanced)

```bash
# List zones (requires API token)
curl -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# List deployments
curl -X GET \
  "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/pages/projects/PROJECT_NAME/deployments" \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Get project details
curl -X GET \
  "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/pages/projects/PROJECT_NAME" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

## Cleanup

```bash
# Remove build artifacts
rm -rf dist

# Remove node_modules
rm -rf node_modules

# Remove all generated files
rm -rf dist node_modules .vite

# Git clean (careful!)
git clean -fdx
```

## Maintenance

```bash
# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Update to latest versions (careful!)
npx npm-check-updates -u
npm install

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Monitoring

```bash
# Watch deployment in real-time
wrangler pages deployment tail --follow

# Filter error logs only
wrangler pages deployment tail --status=error --follow

# View logs for specific deployment
wrangler pages deployment tail --deployment-id=DEPLOYMENT_ID
```

## Rollback

```bash
# Via Cloudflare Dashboard
# 1. Go to Deployments
# 2. Click on deployment to rollback to
# 3. Click "Rollback to this deployment"

# Via Git (create revert commit)
git revert HEAD
git push origin main

# Via Git (force push - dangerous!)
git reset --hard HEAD~1
git push --force origin main
```

## Backup

```bash
# Backup environment variables (local)
cp .env.local .env.backup

# Export from Cloudflare (manual process)
# Go to Settings > Environment variables > Download

# Backup deployment settings
# Screenshot or document your Cloudflare settings
```

## Quick Checks

```bash
# Is site up?
curl -I https://yourdomain.com

# Check response time
time curl -s -o /dev/null https://yourdomain.com

# Check if specific route works
curl -I https://yourdomain.com/dashboard

# Check if API is accessible
curl https://yourdomain.com/api/health

# Verify security headers
curl -I https://yourdomain.com | grep -i "x-frame-options\|content-security-policy\|strict-transport-security"
```

## Emergency Commands

```bash
# Quick rollback to previous commit
git reset --hard HEAD~1 && git push --force

# Emergency maintenance mode
# Create public/maintenance.html, then update _redirects:
# /* /maintenance.html 503

# Disable GitHub Actions (in emergency)
gh workflow disable cloudflare-pages.yml

# Re-enable GitHub Actions
gh workflow enable cloudflare-pages.yml
```

---

## Cheat Sheet

Most common commands:

```bash
# Local development
npm install
npm run dev

# Build & test
npm run build:production
npm run test:run

# Deploy via Wrangler
wrangler login
wrangler pages deploy dist

# Deploy via Git
git add .
git commit -m "message"
git push origin main

# View logs
wrangler pages deployment tail

# Rollback
# (Use Cloudflare dashboard)
```

---

## Resources

- [Wrangler Docs](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub CLI Docs](https://cli.github.com/manual/)
- [Cloudflare API Docs](https://developers.cloudflare.com/api/)

---

**Tip**: Add commonly used commands as npm scripts in `package.json` for easier access!

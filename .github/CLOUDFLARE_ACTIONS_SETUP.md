# GitHub Actions Setup for Cloudflare Pages

This guide walks you through setting up automated deployments using GitHub Actions.

## Why Use GitHub Actions?

- ✅ Automatic deployments on push to main
- ✅ Preview deployments for pull requests
- ✅ Run tests before deploying
- ✅ Upload source maps to Sentry
- ✅ Comment deployment URLs on PRs
- ✅ Full control over CI/CD pipeline

## Prerequisites

- GitHub repository with admin access
- Cloudflare account
- API tokens from Cloudflare

## Step 1: Get Cloudflare API Token

### Create API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click on your profile (top right) > **My Profile**
3. Navigate to **API Tokens** tab
4. Click **Create Token**
5. Use the **Edit Cloudflare Workers** template (or create custom)
6. Configure permissions:
   ```
   Account > Cloudflare Pages > Edit
   ```
7. (Optional) Set IP filtering for extra security
8. Click **Continue to summary** > **Create Token**
9. **Copy the token immediately** (shown only once!)

### Get Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select any domain or go to **Workers & Pages**
3. Look in the right sidebar for **Account ID**
4. Copy the Account ID

## Step 2: Add GitHub Secrets

### Navigate to Repository Settings

1. Go to your GitHub repository
2. Click **Settings** tab
3. Go to **Secrets and variables** > **Actions**
4. Click **New repository secret**

### Add Required Secrets

Add these secrets one by one:

#### Cloudflare Credentials

```
Name: CLOUDFLARE_API_TOKEN
Value: <paste your API token>

Name: CLOUDFLARE_ACCOUNT_ID
Value: <paste your account ID>
```

#### Application Environment Variables

Add all your application environment variables:

```
Name: VITE_SUPABASE_URL
Value: https://your-project.supabase.co

Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGc...

Name: VITE_HUGGINGFACE_API_KEY
Value: hf_...

Name: VITE_APIFY_API_KEY
Value: apify_api_...

Name: VITE_RESEND_API_KEY (optional)
Value: re_...

Name: VITE_GA4_MEASUREMENT_ID (optional)
Value: G-XXXXXXXXXX

Name: VITE_SENTRY_DSN (optional)
Value: https://...@sentry.io/...

Name: VITE_SENTRY_AUTH_TOKEN (optional)
Value: sntrys_...

Name: VITE_SENTRY_ORG (optional)
Value: your-org

Name: VITE_SENTRY_PROJECT (optional)
Value: your-project
```

## Step 3: Verify Workflow File

The workflow file is already created at `.github/workflows/cloudflare-pages.yml`.

### Workflow Features

- **Runs on**: Push to main, Pull requests
- **Test Job**: Runs linter and unit tests
- **Deploy Job**: Builds and deploys to Cloudflare
- **Sentry**: Uploads source maps (if configured)
- **PR Comments**: Posts deployment URL on PRs

### Customize Workflow (Optional)

Edit `.github/workflows/cloudflare-pages.yml` to:

- Change Node version (default: 20)
- Add/remove test steps
- Modify build commands
- Add notifications (Slack, Discord, etc.)

## Step 4: Test the Workflow

### Trigger Deployment

1. Make a commit and push to main:
   ```bash
   git add .
   git commit -m "Test GitHub Actions deployment"
   git push origin main
   ```

2. Watch the workflow:
   - Go to your repo on GitHub
   - Click **Actions** tab
   - See the running workflow

### Expected Workflow Steps

1. ✅ Checkout code
2. ✅ Setup Node.js
3. ✅ Install dependencies
4. ✅ Run linter
5. ✅ Run unit tests
6. ✅ Build application
7. ✅ Deploy to Cloudflare Pages
8. ✅ Upload source maps to Sentry (if configured)

## Step 5: Test Preview Deployments

### Create a Pull Request

1. Create a new branch:
   ```bash
   git checkout -b feature/test-preview
   ```

2. Make a change and push:
   ```bash
   git add .
   git commit -m "Test preview deployment"
   git push origin feature/test-preview
   ```

3. Create a Pull Request on GitHub

4. Check for:
   - ✅ Workflow runs on PR
   - ✅ Tests pass
   - ✅ Preview deployment created
   - ✅ Comment with deployment URL posted on PR

## Troubleshooting

### Workflow Not Running?

**Check workflow permissions:**
1. Go to **Settings** > **Actions** > **General**
2. Under **Workflow permissions**, select:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

### Deployment Failing?

**Check secrets:**
1. Verify all secrets are set correctly
2. Re-create API token if needed
3. Check Account ID is correct

**View logs:**
1. Go to **Actions** tab
2. Click on failed workflow
3. Expand failed step to see error

### Tests Failing?

**Update test configuration:**
1. Check test scripts in `package.json`
2. Ensure test environment variables are set
3. Skip E2E tests if not needed (comment out in workflow)

### Sentry Upload Failing?

**Optional step - can be disabled:**
1. Comment out Sentry upload step in workflow
2. Or add Sentry credentials to GitHub Secrets

## Advanced Configuration

### Add Slack Notifications

Add to workflow after deploy step:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment completed!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

### Add Deploy to Staging

Modify workflow to deploy staging from develop branch:

```yaml
on:
  push:
    branches:
      - main
      - develop
```

Update deploy step:

```yaml
- name: Deploy
  run: |
    if [ "${{ github.ref }}" == "refs/heads/main" ]; then
      wrangler pages deploy dist --project-name=app-prod
    else
      wrangler pages deploy dist --project-name=app-staging
    fi
```

### Add Bundle Size Check

Add before deploy:

```yaml
- name: Check bundle size
  run: |
    npm run build:production
    npx bundlesize
```

## Security Best Practices

1. **API Tokens**:
   - Use minimal permissions
   - Set IP restrictions if possible
   - Rotate tokens regularly

2. **Secrets**:
   - Never commit secrets to repo
   - Use GitHub Secrets for all sensitive data
   - Use different secrets for prod/preview if possible

3. **Workflow**:
   - Don't expose secrets in logs
   - Use encrypted secrets only
   - Review workflow changes carefully

## Monitoring

### View Deployment History

1. Go to **Actions** tab
2. See all workflow runs
3. Click on any run for details

### Check Deployment Status

```bash
# Using Wrangler CLI
wrangler pages deployment list

# Check specific deployment
wrangler pages deployment tail
```

## Cost

GitHub Actions free tier:
- **Public repos**: Unlimited
- **Private repos**: 2,000 minutes/month

Typical deployment uses ~5 minutes per run.

## Useful Commands

```bash
# Run workflow locally (using act)
npm install -g @github/act
act -j deploy

# Validate workflow syntax
npx action-validator .github/workflows/cloudflare-pages.yml

# List all workflows
gh workflow list

# View workflow runs
gh run list

# View specific workflow run
gh run view <run-id>

# Cancel workflow run
gh run cancel <run-id>

# Manually trigger workflow
gh workflow run cloudflare-pages.yml
```

## Next Steps

After setup:

1. ✅ Test production deployment
2. ✅ Test preview deployment
3. ✅ Configure branch protection rules
4. ✅ Add status checks to PRs
5. ✅ Set up notifications (optional)
6. ✅ Monitor deployment performance

## Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Cloudflare Wrangler Action](https://github.com/cloudflare/wrangler-action)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)

---

**Setup Time**: ~10 minutes
**Maintenance**: Minimal
**Benefits**: Automated, tested, reliable deployments

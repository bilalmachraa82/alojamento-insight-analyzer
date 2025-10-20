# Quick Start - Security Setup

Get the security system running in 5 minutes!

## 1. Install Dependencies (1 minute)

```bash
cd maria_faz_analytics/app
npm install
```

## 2. Configure Environment (2 minutes)

```bash
# Copy environment template
cp .env.example .env.local
```

Edit `.env.local` and set these REQUIRED variables:

```env
# Generate these with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
API_SECRET="paste-generated-secret-here"
APP_ENCRYPTION_KEY="paste-generated-key-here"
NEXTAUTH_SECRET="paste-generated-secret-here"

# Get these from https://upstash.com (free tier available)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"

# Your database
DATABASE_URL="postgresql://user:password@localhost:5432/db"
```

## 3. Run Migrations (1 minute)

```bash
# Prisma migrations
npx prisma migrate dev

# Supabase migrations (if using Supabase)
cd ../../supabase
npx supabase db push
cd ../maria_faz_analytics/app
```

## 4. Start Development Server (1 minute)

```bash
npm run dev
```

Visit http://localhost:3000

## 5. Verify Security (30 seconds)

Open browser DevTools (F12) → Network tab → Refresh page → Check response headers:

You should see:
- ✅ `X-Frame-Options: DENY`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Strict-Transport-Security`
- ✅ `Content-Security-Policy`

## Done! 🎉

Your app now has enterprise-grade security!

## Next Steps

1. **Test rate limiting:** Make 6+ rapid requests to any API endpoint
2. **Enable 2FA:** Go to settings and set up 2FA for your account
3. **Review documentation:** See `SECURITY_README.md` for full guide
4. **Run tests:** `npm run test:security`

## Need Help?

- 📖 Full Setup Guide: `SECURITY_SETUP.md`
- 🔐 Security Policy: `SECURITY.md`
- 🚨 Incident Response: `INCIDENT_RESPONSE.md`
- 📋 Deployment Checklist: `DEPLOYMENT_CHECKLIST.md`

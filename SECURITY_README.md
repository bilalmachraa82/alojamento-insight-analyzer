# Security Implementation - Alojamento Insight Analyzer

## Overview

This document provides an overview of the comprehensive security implementation for the Alojamento Insight Analyzer platform. The security system follows OWASP Top 10 guidelines and implements industry best practices.

## Table of Contents

1. [Architecture](#architecture)
2. [Security Features](#security-features)
3. [File Structure](#file-structure)
4. [Quick Start](#quick-start)
5. [Usage Examples](#usage-examples)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

## Architecture

```
┌─────────────────┐
│   Client        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Middleware    │ ◄─── Security Headers, IP Filter, Rate Limit
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Routes     │ ◄─── Input Validation, Authentication, CSRF
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Business Logic │ ◄─── Authorization, Data Sanitization
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database       │ ◄─── RLS Policies, Encryption, Audit Logs
└─────────────────┘

         │
         ▼
┌─────────────────┐
│  Redis Cache    │ ◄─── Rate Limiting, Session Management
└─────────────────┘

         │
         ▼
┌─────────────────┐
│  Monitoring     │ ◄─── Security Events, Alerts, Metrics
└─────────────────┘
```

## Security Features

### 1. Rate Limiting ✅
- **Upstash Redis-based** distributed rate limiting
- Sliding window algorithm for accuracy
- Endpoint-specific limits:
  - Diagnostic: 5/hour
  - API: 100/minute
  - PDF: 10/hour
  - Auth: 5/15min
- Admin whitelist support
- 429 responses with Retry-After headers

**Files:**
- `lib/security/rateLimiter.ts`

### 2. Authentication & Authorization ✅
- **2FA (TOTP)** with backup codes
- **Account lockout** after 5 failed attempts
- **Session timeout** (30 minutes inactivity)
- Password requirements (12+ chars, complexity)
- Bcrypt hashing (cost 12)
- Email verification required
- Password reset flow
- Multi-device session tracking

**Files:**
- `lib/security/auth.ts`
- `lib/auth.ts`

### 3. Input Validation & Sanitization ✅
- **Zod schemas** for type-safe validation
- **DOMPurify** for XSS prevention
- SQL injection prevention
- NoSQL injection prevention
- SSRF protection
- Command injection prevention
- Disposable email detection

**Files:**
- `lib/security/validation.ts`
- `lib/security/inputSanitizer.ts`

### 4. Security Headers ✅
- Content Security Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Referrer-Policy: no-referrer
- Permissions-Policy

**Files:**
- `lib/security/headers.ts`
- `middleware.ts`

### 5. IP Filtering ✅
- IP blacklist/whitelist
- Suspicious activity tracking
- Auto-blacklist after violations
- IP reputation checking (extensible)
- Request pattern analysis

**Files:**
- `lib/security/ipFilter.ts`

### 6. API Security ✅
- API key generation & management
- Request signing (HMAC-SHA256)
- Webhook signature verification
- Nonce-based replay protection
- API key rotation
- Permission-based access control

**Files:**
- `lib/security/apiSecurity.ts`

### 7. Database Security ✅
- Row Level Security (RLS) policies
- Check constraints for data integrity
- Audit logging triggers
- Encrypted sensitive fields
- Prepared statements (Prisma ORM)
- Connection pooling

**Files:**
- `supabase/migrations/20251020000001_security_enhancements.sql`
- `supabase/migrations/20251016000004_create_rls_policies.sql`

### 8. Monitoring & Alerting ✅
- Security event logging
- Real-time alerts (Slack/Email)
- Anomaly detection
- Security metrics dashboard
- Audit trail (30 days)
- Failed login tracking

**Files:**
- `lib/security/monitoring.ts`

### 9. CSRF Protection ✅
- Token-based CSRF protection
- Automatic token generation
- SameSite cookie attribute
- Double-submit cookie pattern

**Files:**
- `lib/security/auth.ts`

### 10. CORS ✅
- Strict origin whitelist
- Credentials support for trusted origins
- Preflight request handling
- Configurable allowed methods/headers

**Files:**
- `lib/security/headers.ts`
- `middleware.ts`

## File Structure

```
maria_faz_analytics/app/
├── lib/
│   └── security/
│       ├── rateLimiter.ts       # Rate limiting logic
│       ├── headers.ts           # Security headers & CORS
│       ├── inputSanitizer.ts    # Input sanitization
│       ├── validation.ts        # Zod validation schemas
│       ├── auth.ts              # 2FA, sessions, passwords
│       ├── ipFilter.ts          # IP filtering & reputation
│       ├── apiSecurity.ts       # API keys, signing, webhooks
│       └── monitoring.ts        # Security monitoring & alerts
├── middleware.ts                # Next.js middleware
├── __tests__/
│   └── security/
│       └── security.test.ts     # Security tests
├── app/
│   └── api/
│       └── example-secure/
│           └── route.ts         # Example secure API

supabase/
└── migrations/
    └── 20251020000001_security_enhancements.sql

Root:
├── SECURITY.md                  # Security policy
├── INCIDENT_RESPONSE.md         # Incident response plan
├── SECURITY_SETUP.md           # Setup guide
└── SECURITY_README.md          # This file
```

## Quick Start

### 1. Install Dependencies
```bash
cd maria_faz_analytics/app
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
UPSTASH_REDIS_REST_URL="your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
API_SECRET="your-32-char-secret"
NEXTAUTH_SECRET="your-nextauth-secret"
```

### 3. Run Migrations
```bash
npx prisma migrate dev
cd ../../supabase
npx supabase db push
```

### 4. Start Development Server
```bash
cd maria_faz_analytics/app
npm run dev
```

### 5. Verify Security
Visit http://localhost:3000 and check:
- Security headers in browser DevTools
- Rate limiting works (make 6+ rapid requests)
- 2FA enrollment available
- CSRF tokens present in forms

## Usage Examples

### Protect an API Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/security/rateLimiter';
import { safeValidate, yourSchema } from '@/lib/security/validation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  return withRateLimit(request, 'api', async () => {
    // 1. Authenticate
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate input
    const body = await request.json();
    const validation = safeValidate(yourSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // 3. Your business logic
    const result = await yourBusinessLogic(validation.data);

    return NextResponse.json(result);
  });
}
```

### Enable 2FA for User

```typescript
import { generate2FASecret, verify2FACode, enable2FA } from '@/lib/security/auth';

// Generate secret
const { secret, qrCode, backupCodes } = await generate2FASecret(
  userId,
  email
);

// Show QR code to user
// User scans and enters code from app

// Verify code
const isValid = verify2FACode(secret, userEnteredCode);

if (isValid) {
  // Enable 2FA
  await enable2FA(userId, secret, backupCodes);
}
```

### Create API Key

```typescript
import { generateAPIKey } from '@/lib/security/apiSecurity';

const apiKey = await generateAPIKey(
  userId,
  'My API Key',
  ['read', 'write']
);

// Show key.key to user ONCE
// Store key.id for management
```

### Verify API Key

```typescript
import { verifyAPIKey } from '@/lib/security/apiSecurity';

const apiKey = request.headers.get('x-api-key');
const result = await verifyAPIKey(apiKey);

if (!result.valid) {
  return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
}

// Check permissions
if (!result.permissions?.includes('write')) {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
}
```

### Log Security Event

```typescript
import { logSecurityEvent, SecurityEventType } from '@/lib/security/monitoring';

await logSecurityEvent(SecurityEventType.FAILED_LOGIN, {
  ip: getClientIP(request),
  email: attemptedEmail,
  reason: 'Invalid password',
});
```

## Testing

### Run Security Tests
```bash
npm test -- __tests__/security/security.test.ts
```

### Manual Testing Checklist
- [ ] XSS prevention (try `<script>alert(1)</script>`)
- [ ] SQL injection (try `' OR '1'='1`)
- [ ] Rate limiting (exceed limits)
- [ ] 2FA enrollment and login
- [ ] Account lockout (5 failed logins)
- [ ] Session timeout (wait 30 min)
- [ ] CSRF protection
- [ ] API key authentication
- [ ] Security headers present

### Penetration Testing
Use OWASP ZAP or Burp Suite to scan:
```bash
# Run ZAP in daemon mode
docker run -p 8080:8080 owasp/zap2docker-stable zap.sh -daemon

# Point to your app
# Run automated scan
```

## Deployment

### Production Checklist
- [ ] `NODE_ENV=production`
- [ ] All secrets rotated
- [ ] SSL/TLS configured
- [ ] Database backups enabled
- [ ] Monitoring alerts configured
- [ ] Rate limits tuned
- [ ] IP whitelist configured
- [ ] Security tests passing
- [ ] Incident response team ready

### Environment Variables
See `.env.example` for full list. Required:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `API_SECRET`
- `NEXTAUTH_SECRET`
- `DATABASE_URL`

### SSL/TLS
Ensure TLS 1.2+ is enforced:
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
```

## Monitoring

### Security Dashboard
Access at `/admin/security/dashboard` to view:
- Failed login attempts
- Rate limit violations
- Blocked IPs
- Security events
- Active sessions
- API usage

### Metrics
Track these KPIs:
- Mean Time to Detect (MTTD): < 15 min
- Mean Time to Respond (MTTR): < 1 hour
- Failed login rate: < 1%
- Rate limit violations: Monitor trend
- Security events: Categorize by severity

### Alerts
Alerts are sent for:
- HIGH/CRITICAL events → Slack
- CRITICAL events → Email
- 10+ failed logins from single IP
- SQL/XSS injection attempts
- Account lockouts

## Troubleshooting

### Rate Limiting Not Working
```bash
# Check Redis connection
curl "$UPSTASH_REDIS_REST_URL" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
  -d '["PING"]'
```

### 2FA Issues
```typescript
// Disable 2FA for user (emergency)
await disable2FA(userId);
```

### Session Timeout Too Short
Adjust in `.env`:
```env
SESSION_TIMEOUT_MS="3600000" # 1 hour
```

### IP Blocked Incorrectly
```typescript
import { removeFromBlacklist } from '@/lib/security/ipFilter';
await removeFromBlacklist('192.168.1.100');
```

### High Memory Usage (Redis)
Check Redis memory:
```bash
# View memory usage
curl "$UPSTASH_REDIS_REST_URL" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
  -d '["INFO", "memory"]'

# Clear old keys
# Adjust TTLs in code if needed
```

## Best Practices

1. **Never commit secrets** to Git
2. **Rotate secrets** regularly (quarterly)
3. **Update dependencies** weekly
4. **Run security tests** in CI/CD
5. **Monitor alerts** daily
6. **Review audit logs** weekly
7. **Conduct drills** quarterly
8. **Update documentation** when changing security

## Support

- **Security Issues:** security@alojamento-insight.com
- **Documentation:** See `SECURITY.md`, `INCIDENT_RESPONSE.md`
- **Monitoring:** `/admin/security/dashboard`

## License

Proprietary - All Rights Reserved

## Version

Last Updated: 2025-10-20
Version: 1.0.0

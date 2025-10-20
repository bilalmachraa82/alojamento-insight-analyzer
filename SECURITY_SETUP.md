# Security Setup Guide

This guide walks you through setting up all security features for the Alojamento Insight Analyzer.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (via Upstash or self-hosted)
- Supabase account (or self-hosted)

## 1. Environment Configuration

### Step 1: Copy environment template
```bash
cp maria_faz_analytics/app/.env.example maria_faz_analytics/app/.env.local
```

### Step 2: Configure required variables

#### Upstash Redis Setup
1. Sign up at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the REST URL and token to `.env.local`:
```env
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

#### Generate API Secrets
```bash
# Generate API secret (32 bytes hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key (32 bytes hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env.local`:
```env
API_SECRET="your-generated-secret"
APP_ENCRYPTION_KEY="your-generated-key"
NEXTAUTH_SECRET="your-nextauth-secret"
```

#### Configure Supabase
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## 2. Database Setup

### Step 1: Run security migrations
```bash
cd maria_faz_analytics/app
npx prisma migrate dev
```

### Step 2: Apply Supabase security migration
```bash
cd ../../supabase
npx supabase db push
```

### Step 3: Verify security policies
Connect to your database and verify RLS policies are enabled:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`.

## 3. Prisma Schema Updates

Add these fields to your Prisma schema (`prisma/schema.model`):

```prisma
model User {
  id                    String    @id @default(uuid())
  email                 String    @unique
  password              String?
  firstName             String?
  lastName              String?
  role                  String    @default("user")
  credits               Int       @default(0)

  // Security fields
  emailVerified         DateTime?
  twoFactorEnabled      Boolean   @default(false)
  twoFactorSecret       String?
  twoFactorBackupCodes  String?
  failedLoginAttempts   Int       @default(0)
  lockedUntil           DateTime?
  passwordChangedAt     DateTime?
  passwordHistory       String[] // Store hashes of last 5 passwords

  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // Relations
  apiKeys               ApiKey[]
  sessions              UserSession[]
  auditLogs             SecurityAuditLog[]
}

model ApiKey {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  keyHash     String    @unique
  name        String
  permissions String    @default("{\"read\"}")
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  revoked     Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@index([keyHash])
}

model UserSession {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionToken  String   @unique
  ipAddress     String?
  userAgent     String?
  lastActivity  DateTime @default(now())
  expiresAt     DateTime
  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([sessionToken])
}

model SecurityAuditLog {
  id          String   @id @default(uuid())
  eventType   String
  userId      String?
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  ipAddress   String?
  userAgent   String?
  requestPath String?
  requestMethod String?
  statusCode  Int?
  details     String?  // JSON string
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([eventType])
  @@index([createdAt])
}
```

Run migration:
```bash
npx prisma migrate dev --name add_security_fields
npx prisma generate
```

## 4. Install Dependencies

```bash
cd maria_faz_analytics/app
npm install
```

All security dependencies are already listed in package.json.

## 5. Security Middleware Setup

The middleware is already configured in `middleware.ts`. Verify it's working:

```bash
npm run dev
```

Visit `http://localhost:3000/api/health` and check response headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`
- `Content-Security-Policy`

## 6. Rate Limiting Verification

Test rate limiting:

```bash
# Test diagnostic endpoint (5 requests/hour limit)
for i in {1..6}; do
  curl http://localhost:3000/api/diagnostic
  sleep 1
done
```

The 6th request should return `429 Too Many Requests`.

## 7. Enable Security Monitoring

### Slack Alerts
1. Create a Slack webhook at [api.slack.com/messaging/webhooks](https://api.slack.com/messaging/webhooks)
2. Add to `.env.local`:
```env
SLACK_SECURITY_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### Email Alerts
Configure SMTP settings in `.env.local`:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SECURITY_ALERT_EMAIL="security@yourdomain.com"
```

## 8. Admin Configuration

### Whitelist Admin Users
Add admin user IDs to bypass rate limits:
```env
ADMIN_WHITELIST="user-id-1,user-id-2"
```

### Whitelist Admin IPs
```env
IP_WHITELIST="192.168.1.100,10.0.0.5"
```

## 9. CORS Configuration

Add allowed origins:
```env
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com,https://app.yourdomain.com"
```

## 10. Testing Security Features

### Run Security Tests
```bash
npm test -- __tests__/security/security.test.ts
```

### Manual Testing Checklist

#### Authentication
- [ ] Sign up with weak password (should fail)
- [ ] Sign up with strong password (should succeed)
- [ ] Login with wrong password 5 times (should lock account)
- [ ] Wait 30 minutes or unlock manually
- [ ] Enable 2FA
- [ ] Login with 2FA code
- [ ] Use backup code

#### Rate Limiting
- [ ] Exceed diagnostic submission limit (5/hour)
- [ ] Exceed API limit (100/minute)
- [ ] Verify admin users are whitelisted

#### Input Validation
- [ ] Submit XSS payload (should be sanitized)
- [ ] Submit SQL injection (should be rejected)
- [ ] Submit SSRF URL (localhost, should be rejected)
- [ ] Submit disposable email (should be rejected)

#### Session Management
- [ ] Login and verify session timeout after 30 minutes
- [ ] Change password and verify all sessions invalidated
- [ ] Check session tracking in database

#### Security Headers
- [ ] Verify CSP header
- [ ] Verify HSTS header
- [ ] Verify X-Frame-Options
- [ ] Test CORS with different origins

## 11. Production Deployment

### Pre-deployment Checklist
- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Security tests passing
- [ ] Rate limits configured
- [ ] Monitoring alerts configured
- [ ] SSL/TLS certificate installed
- [ ] Backup system tested
- [ ] Incident response plan reviewed

### Production Environment Variables
```env
NODE_ENV="production"
ENABLE_2FA="true"
ENABLE_EMAIL_VERIFICATION="true"
ENABLE_RATE_LIMITING="true"
ENABLE_IP_FILTERING="true"
DEV_DISABLE_RATE_LIMIT="false"
DEV_DISABLE_2FA="false"
```

### SSL/TLS Configuration
Ensure your deployment platform (Vercel, AWS, etc.) has SSL/TLS enabled:
- TLS 1.2 minimum
- Strong cipher suites
- HSTS enabled
- Certificate auto-renewal

### Database Configuration
- Enable SSL connections
- Restrict database access by IP
- Regular backups (daily minimum)
- Point-in-time recovery enabled

### Redis Configuration
- Enable authentication
- Use TLS connections
- Set appropriate memory limits
- Configure eviction policy

## 12. Monitoring Setup

### Security Dashboard
Access at: `/admin/security/dashboard`

Monitor:
- Failed login attempts
- Rate limit violations
- Blocked IPs
- Security events
- Active sessions

### Metrics to Track
- Mean Time to Detect (MTTD)
- Mean Time to Respond (MTTR)
- Failed login rate
- Rate limit violations
- Security events per day

### Set Up Alerts
Configure alerts for:
- 10+ failed logins from single IP
- 5+ rate limit violations
- Any SQL injection attempts
- Account lockouts
- Critical security events

## 13. Regular Maintenance

### Daily
- [ ] Review security alerts
- [ ] Check monitoring dashboard
- [ ] Verify backup completion

### Weekly
- [ ] Review audit logs
- [ ] Update IP blacklist
- [ ] Check for failed jobs
- [ ] Review rate limit violations

### Monthly
- [ ] Security dependency updates
- [ ] Review and rotate API keys
- [ ] Audit user permissions
- [ ] Review security policies
- [ ] Generate security report

### Quarterly
- [ ] Penetration testing
- [ ] Security policy review
- [ ] Incident response drill
- [ ] Update security documentation
- [ ] Staff security training

## 14. Troubleshooting

### Rate Limit Issues
```bash
# Check Redis connection
curl $UPSTASH_REDIS_REST_URL \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
  -d '["PING"]'

# Check rate limit counters
curl $UPSTASH_REDIS_REST_URL \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
  -d '["KEYS", "ratelimit:*"]'
```

### Session Issues
```sql
-- Check active sessions
SELECT * FROM user_sessions WHERE expires_at > NOW();

-- Clear expired sessions
DELETE FROM user_sessions WHERE expires_at < NOW();
```

### 2FA Issues
```sql
-- Disable 2FA for user (emergency)
UPDATE users
SET two_factor_enabled = false,
    two_factor_secret = NULL,
    two_factor_backup_codes = NULL
WHERE email = 'user@example.com';
```

### Unlock Account
```sql
-- Unlock user account
UPDATE users
SET failed_login_attempts = 0,
    locked_until = NULL
WHERE email = 'user@example.com';
```

## 15. Security Contacts

- **Security Team:** security@alojamento-insight.com
- **On-call:** [PagerDuty/Phone]
- **Incident Hotline:** [Internal]

## 16. Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## Version

Last updated: 2025-10-20
Version: 1.0

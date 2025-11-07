# Security Deployment Checklist

Use this checklist before deploying the security-hardened application to production.

## Pre-Deployment

### Environment Configuration
- [ ] Copy `.env.example` to `.env.local` and configure all variables
- [ ] Generate secure API secrets (32+ characters, hex)
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Set `NODE_ENV=production`
- [ ] Configure Upstash Redis URL and token
- [ ] Set NextAuth secret
- [ ] Configure database URL with SSL
- [ ] Set admin whitelist (user IDs and IPs)
- [ ] Configure allowed CORS origins
- [ ] Set up Slack webhook for security alerts (optional)
- [ ] Configure email SMTP settings for alerts

### Database Setup
- [ ] Run all Prisma migrations
  ```bash
  npx prisma migrate deploy
  ```
- [ ] Apply Supabase security migration
  ```bash
  npx supabase db push
  ```
- [ ] Verify RLS policies are enabled on all tables
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  ```
- [ ] Test database connections with SSL
- [ ] Enable point-in-time recovery
- [ ] Configure automated daily backups
- [ ] Set up backup retention policy (30+ days)

### Dependencies
- [ ] Install all dependencies
  ```bash
  npm install
  ```
- [ ] Run security audit
  ```bash
  npm audit
  ```
- [ ] Fix critical/high vulnerabilities
  ```bash
  npm audit fix
  ```
- [ ] Verify no known vulnerabilities remain
- [ ] Update outdated dependencies
  ```bash
  npm outdated
  npm update
  ```

### Security Testing
- [ ] Run all security tests
  ```bash
  npm run test:security
  ```
- [ ] All tests passing
- [ ] Manual XSS testing completed
- [ ] Manual SQL injection testing completed
- [ ] Rate limiting tested and working
- [ ] 2FA enrollment and login tested
- [ ] Account lockout tested (5 failed attempts)
- [ ] Session timeout tested (30 minutes)
- [ ] CSRF protection verified
- [ ] API key authentication tested
- [ ] Security headers verified in browser

### Code Quality
- [ ] Run linter
  ```bash
  npm run lint
  ```
- [ ] Fix all linting errors
- [ ] Code review completed
- [ ] Security-focused code review completed
- [ ] No secrets in code or commits
- [ ] `.env` files in `.gitignore`

## Infrastructure

### SSL/TLS
- [ ] Valid SSL certificate installed
- [ ] Certificate auto-renewal configured
- [ ] TLS 1.2+ enforced (no TLS 1.0/1.1)
- [ ] Strong cipher suites configured
- [ ] HSTS header enabled
- [ ] Certificate chain complete
- [ ] Test SSL configuration: https://www.ssllabs.com/ssltest/

### Reverse Proxy / Load Balancer
- [ ] Configure trusted proxy headers
- [ ] Set X-Forwarded-For correctly
- [ ] Set X-Real-IP header
- [ ] Configure request size limits (10MB max)
- [ ] Set timeouts appropriately
- [ ] Enable HTTP/2 if available

### DNS
- [ ] DNS records configured correctly
- [ ] CAA records set for SSL
- [ ] SPF/DKIM/DMARC for email domain

### Firewall
- [ ] Database port (5432) only accessible from app servers
- [ ] Redis port (6379) only accessible from app servers
- [ ] SSH port changed from default (or restricted)
- [ ] Rate limiting at firewall level
- [ ] DDoS protection enabled

## Application Configuration

### Rate Limiting
- [ ] Upstash Redis connected and working
- [ ] Test diagnostic endpoint limit (5/hour)
- [ ] Test API endpoint limit (100/minute)
- [ ] Test PDF download limit (10/hour)
- [ ] Test auth endpoint limit (5/15min)
- [ ] Verify admin whitelist working
- [ ] Check 429 responses include Retry-After header

### Authentication & Authorization
- [ ] 2FA mandatory for admin accounts
- [ ] Password requirements enforced (12+ chars)
- [ ] Account lockout working (5 attempts, 30 min)
- [ ] Session timeout working (30 minutes)
- [ ] Email verification required
- [ ] Password reset flow working
- [ ] CSRF tokens on all forms
- [ ] Session invalidation on password change

### Monitoring & Alerting
- [ ] Security dashboard accessible
- [ ] Slack alerts configured (if enabled)
- [ ] Email alerts configured (if enabled)
- [ ] Test alert delivery
- [ ] Verify security events logging
- [ ] Audit logs being written to database
- [ ] Metrics being collected
- [ ] Set up uptime monitoring
- [ ] Configure error tracking (Sentry, etc.)

### Logging
- [ ] Application logs configured
- [ ] Sensitive data NOT logged (passwords, tokens, etc.)
- [ ] Log rotation configured
- [ ] Centralized log aggregation (optional)
- [ ] Log retention policy set (90+ days)

## Security Hardening

### Headers
Verify these headers are present on all responses:
- [ ] `Content-Security-Policy`
- [ ] `Strict-Transport-Security`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: no-referrer`
- [ ] `Permissions-Policy`

### CORS
- [ ] Only trusted origins in ALLOWED_ORIGINS
- [ ] Credentials only for trusted origins
- [ ] Preflight requests handled correctly

### API Security
- [ ] API keys hashed before storage
- [ ] API key format: `sk_<32-chars>`
- [ ] Request signing working (HMAC-SHA256)
- [ ] Webhook signatures verified
- [ ] Nonce-based replay protection working
- [ ] API responses sanitized (no sensitive data)

### Database Security
- [ ] RLS policies enforced
- [ ] Users can only access their own data
- [ ] Admin access policies working
- [ ] Encryption at rest enabled
- [ ] Sensitive fields encrypted (if applicable)
- [ ] Audit triggers working
- [ ] Database connections use SSL
- [ ] Connection pooling configured

### IP Filtering
- [ ] IP whitelist configured (if needed)
- [ ] IP blacklist working
- [ ] Suspicious activity tracking working
- [ ] Auto-blacklist after violations working

## Documentation

- [ ] `SECURITY.md` reviewed and accurate
- [ ] `INCIDENT_RESPONSE.md` reviewed
- [ ] `SECURITY_SETUP.md` followed successfully
- [ ] `SECURITY_README.md` accessible to team
- [ ] Environment variables documented
- [ ] API documentation includes security requirements
- [ ] Runbook for common issues created
- [ ] Team trained on security features

## Incident Response

- [ ] Incident response team identified
- [ ] Contact information up to date
- [ ] Slack channel created (#security-incident)
- [ ] Emergency procedures documented
- [ ] Incident response plan reviewed by team
- [ ] Tabletop exercise completed
- [ ] Backup contact methods established

## Compliance

### GDPR (if applicable)
- [ ] Privacy policy updated
- [ ] Cookie consent implemented
- [ ] Data retention policies set
- [ ] Right to erasure implemented
- [ ] Data portability implemented
- [ ] Breach notification process documented
- [ ] DPO or contact designated

### SOC 2 (if applicable)
- [ ] Access controls documented
- [ ] Audit logging enabled
- [ ] Incident response documented
- [ ] Change management process
- [ ] Vendor management process

## Performance

- [ ] Load testing completed
- [ ] Performance benchmarks established
- [ ] Database query performance optimized
- [ ] Redis performance acceptable
- [ ] CDN configured (if applicable)
- [ ] Static assets optimized
- [ ] Image optimization enabled

## Backup & Recovery

- [ ] Database backups automated (daily minimum)
- [ ] Backup restoration tested
- [ ] Backup retention policy (30+ days)
- [ ] Off-site backup storage
- [ ] Recovery Time Objective (RTO) defined
- [ ] Recovery Point Objective (RPO) defined
- [ ] Disaster recovery plan documented

## Monitoring & Alerting Thresholds

### Configure alerts for:
- [ ] 10+ failed logins from single IP in 5 minutes
- [ ] 5+ rate limit violations in 1 minute
- [ ] Any SQL injection attempts
- [ ] Any XSS attempts
- [ ] Account lockout events
- [ ] Database connection failures
- [ ] Redis connection failures
- [ ] High memory usage (>80%)
- [ ] High CPU usage (>80%)
- [ ] Disk space low (<20%)
- [ ] SSL certificate expiring soon (<30 days)

## Post-Deployment

### Immediate (0-24 hours)
- [ ] Monitor error rates
- [ ] Monitor security alerts
- [ ] Check all services healthy
- [ ] Verify backups completed
- [ ] Test critical user flows
- [ ] Monitor performance metrics
- [ ] Review logs for errors

### Short-term (1-7 days)
- [ ] Review security metrics daily
- [ ] Monitor rate limit violations
- [ ] Check for false positives
- [ ] Tune rate limits if needed
- [ ] Review audit logs
- [ ] Check IP blacklist
- [ ] Monitor user feedback

### Ongoing
- [ ] Daily security dashboard review
- [ ] Weekly audit log review
- [ ] Weekly security report
- [ ] Monthly dependency updates
- [ ] Monthly security policy review
- [ ] Quarterly penetration testing
- [ ] Quarterly incident response drill
- [ ] Quarterly team security training

## Rollback Plan

If critical issues are discovered:

1. **Immediate Actions**
   - [ ] Revert to previous deployment
   - [ ] Notify stakeholders
   - [ ] Begin incident investigation

2. **Communication**
   - [ ] Internal team notification
   - [ ] User notification (if affected)
   - [ ] Status page update

3. **Investigation**
   - [ ] Identify root cause
   - [ ] Document findings
   - [ ] Create fix plan

4. **Prevention**
   - [ ] Update tests to catch issue
   - [ ] Update deployment checklist
   - [ ] Schedule post-mortem

## Sign-off

### Team Approvals Required

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering Lead | __________ | ______ | __________ |
| Security Lead | __________ | ______ | __________ |
| DevOps Lead | __________ | ______ | __________ |
| Product Manager | __________ | ______ | __________ |

### Final Verification

- [ ] All checklist items completed
- [ ] All tests passing
- [ ] All stakeholders notified
- [ ] Deployment window scheduled
- [ ] Rollback plan ready
- [ ] Monitoring dashboards ready
- [ ] On-call engineer assigned

## Deployment

**Scheduled Date/Time:** _______________

**Deployed By:** _______________

**Deployment Status:** [ ] Success [ ] Failed

**Notes:**
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________

## Post-Deployment Verification

- [ ] Application accessible
- [ ] All services healthy
- [ ] No error spikes
- [ ] Security features working
- [ ] Monitoring operational
- [ ] Backups running

**Verification Completed By:** _______________

**Date/Time:** _______________

---

**Document Version:** 1.0
**Last Updated:** 2025-10-20
**Next Review:** Before each production deployment

# Security Policy

## Overview

This document outlines the security measures, policies, and procedures for the Alojamento Insight Analyzer project. We take security seriously and have implemented comprehensive protections against common vulnerabilities.

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** create a public GitHub issue
2. Email security reports to: security@alojamento-insight.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fixes (if any)

We will acknowledge receipt within 24 hours and provide a detailed response within 72 hours.

## Security Measures

### 1. Authentication & Authorization

#### Password Security
- **Minimum 12 characters** with complexity requirements:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- Passwords hashed with **bcrypt** (cost factor 12)
- No password reuse (last 5 passwords tracked)
- Password strength meter for user feedback

#### Two-Factor Authentication (2FA)
- TOTP-based 2FA using Google Authenticator or similar apps
- 10 backup codes generated and securely stored
- Required for admin accounts
- Optional but recommended for all users

#### Account Lockout
- **5 failed login attempts** trigger account lockout
- Lockout duration: **30 minutes**
- Email notification sent on lockout
- Manual unlock available for legitimate users

#### Session Management
- Session timeout: **30 minutes of inactivity**
- Secure, HTTP-only cookies
- Session invalidation on password change
- Multi-device session tracking
- Logout from all devices option

### 2. Rate Limiting

Rate limits are enforced per IP address or authenticated user:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Diagnostic Submissions | 5 requests | 1 hour |
| API Endpoints | 100 requests | 1 minute |
| PDF Downloads | 10 requests | 1 hour |
| Authentication | 5 attempts | 15 minutes |
| Signup | 3 requests | 1 hour |
| Password Reset | 3 requests | 1 hour |

Admin users are whitelisted and exempt from rate limits.

### 3. Input Validation & Sanitization

All user inputs are validated and sanitized:

#### XSS Prevention
- DOMPurify for HTML sanitization
- Content Security Policy (CSP) headers
- Escape output in templates
- Whitelist allowed HTML tags

#### SQL Injection Prevention
- Parameterized queries throughout
- ORM (Prisma) for database access
- Input validation with Zod schemas
- No dynamic SQL construction

#### NoSQL Injection Prevention
- MongoDB operator filtering
- Input sanitization for NoSQL queries
- Type checking on all inputs

#### SSRF Prevention
- URL validation and whitelist
- Block localhost and private IP ranges
- Timeout on external requests

### 4. Security Headers

All responses include security headers:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'...
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 5. CORS Configuration

Strict CORS policy:
- Whitelist of allowed origins
- Credentials support only for trusted origins
- Preflight request handling
- Exposed headers controlled

### 6. API Security

#### API Keys
- Format: `sk_<32-character-nanoid>`
- Hashed before storage (bcrypt)
- Expiration dates supported
- Permission-based access control
- Usage tracking and analytics

#### Request Signing
- HMAC-SHA256 signatures
- Timestamp validation (5-minute window)
- Nonce-based replay protection
- Constant-time comparison

#### Webhook Security
- Signature verification
- Secret per webhook
- Event filtering
- Retry logic with exponential backoff

### 7. Database Security

#### Row Level Security (RLS)
- Enabled on all tables
- Users can only access their own data
- Policy-based access control
- Helper functions for ownership checks

#### Data Integrity
- Check constraints on all tables
- Foreign key constraints
- Not-null constraints where appropriate
- Data type validation

#### Encryption
- Sensitive fields encrypted at rest
- pgcrypto extension for PostgreSQL
- AES-256-GCM encryption
- Secure key management

#### Audit Logging
- All data changes logged
- Security events tracked
- 30-day retention period
- Queryable audit trail

### 8. IP Filtering

#### Blacklist
- Automatic blacklisting after suspicious activity
- Manual blacklist management
- Temporary and permanent blocks
- Reason tracking

#### Whitelist
- Admin IP whitelist
- Bypass rate limiting
- Bypass security checks (where appropriate)

#### Reputation Checking
- Integration with IP reputation services
- Automated threat detection
- Proactive blocking

### 9. Monitoring & Alerting

#### Security Event Monitoring
- Real-time event tracking
- Anomaly detection
- Threshold-based alerts
- Dashboard for security metrics

#### Alert Channels
- Slack notifications (HIGH/CRITICAL)
- Email alerts (CRITICAL only)
- In-app notifications
- Security dashboard

#### Events Monitored
- Failed login attempts
- Account lockouts
- Rate limit violations
- SQL injection attempts
- XSS attempts
- Suspicious IP activity
- Data breach attempts
- API key misuse

### 10. Data Protection

#### Personal Data
- GDPR compliant
- Right to erasure
- Data portability
- Privacy by design

#### Sensitive Data
- Encrypted at rest
- Encrypted in transit (TLS 1.3)
- Access logging
- Retention policies

## Security Best Practices for Developers

### Code Review
- Security-focused code reviews
- Automated security scanning
- Dependency vulnerability checks
- SAST/DAST tools

### Dependencies
- Regular dependency updates
- `npm audit` checks
- Known vulnerability scanning
- Minimal dependency principle

### Secrets Management
- Never commit secrets to Git
- Use environment variables
- Rotate secrets regularly
- Use secret management tools (e.g., Vault)

### Logging
- Never log sensitive data
- Sanitize logs in production
- Centralized log management
- Log retention policies

### Error Handling
- Generic error messages in production
- Detailed errors only in logs
- No stack traces to users
- Error monitoring (Sentry)

## Compliance

This application follows security guidelines from:

- OWASP Top 10 (2021)
- CWE Top 25
- NIST Cybersecurity Framework
- GDPR (Data Protection)
- SOC 2 Type II controls

## Incident Response

See [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) for our incident response plan.

## Security Testing

### Automated Testing
- Unit tests for security functions
- Integration tests for auth flows
- E2E tests for critical paths
- CI/CD security checks

### Manual Testing
- Penetration testing (quarterly)
- Security audits (bi-annually)
- Bug bounty program
- Red team exercises

### Tools Used
- Jest for unit testing
- OWASP ZAP for scanning
- npm audit for dependencies
- Snyk for vulnerability scanning

## Updates & Changes

This security policy is reviewed and updated quarterly. Last updated: 2025-10-20

## Contact

For security-related questions or concerns:
- Email: security@alojamento-insight.com
- Security Dashboard: (internal only)
- Incident Hotline: (internal only)

## Acknowledgments

We thank the security researchers and developers who have helped make this application more secure.

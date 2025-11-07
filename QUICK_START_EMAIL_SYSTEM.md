# Email System - Quick Start Guide

## 🚀 What's Been Implemented

A complete, production-ready email notification system with:

✅ **4 Beautiful Email Templates** (React-based, responsive)
- Welcome Email
- Report Ready Email
- Payment Confirmation Email
- Password Reset Email

✅ **Email Service** with retry logic and rate limiting
✅ **Edge Function** for backend email sending
✅ **Database Tables** for tracking and preferences
✅ **Test Page** at `/test-emails` for previewing and testing
✅ **Complete Documentation**

## 📁 File Structure

```
src/
├── emails/
│   ├── WelcomeEmail.tsx              # Welcome email template
│   ├── ReportReadyEmail.tsx          # Report ready template
│   ├── PaymentConfirmationEmail.tsx  # Payment confirmation template
│   ├── PasswordResetEmail.tsx        # Password reset template
│   └── index.ts                      # Email exports
├── services/
│   └── emailService.ts               # Main email service
└── pages/
    └── TestEmails.tsx                # Email testing page (/test-emails)

supabase/
├── functions/
│   └── send-diagnostic-email/
│       └── index.ts                  # Complete edge function
└── migrations/
    └── 20251020000001_create_notifications_table.sql

README_EMAIL_SYSTEM.md                # Comprehensive documentation
QUICK_START_EMAIL_SYSTEM.md          # This file
```

## ⚡ Quick Setup (5 minutes)

### 1. Run Database Migration

```bash
# Navigate to project directory
cd /home/user/alojamento-insight-analyzer

# Apply migration to create email tables
supabase db push
```

### 2. Get Resend API Key

1. Go to [resend.com](https://resend.com) and sign up (free tier available)
2. Create an API key
3. Copy the key (starts with `re_`)

### 3. Configure Environment

**For Frontend** - Create/update `.env`:
```env
VITE_RESEND_API_KEY=re_your_api_key_here
```

**For Edge Functions** - Set in Supabase Dashboard:
1. Go to Supabase Dashboard
2. Project Settings → Edge Functions → Secrets
3. Add secret: `RESEND_API_KEY=re_your_api_key_here`

### 4. Test It!

```bash
# Start development server
npm run dev

# Visit http://localhost:5173/test-emails
# Send test emails and preview templates
```

## 💡 Usage Examples

### Frontend - Send Welcome Email

```typescript
import { emailService } from '@/services/emailService';

const result = await emailService.sendWelcomeEmail({
  id: user.id,
  email: 'user@example.com',
  name: 'John Doe',
});

if (result.success) {
  console.log('Email sent!');
} else {
  console.error('Failed:', result.error);
}
```

### Frontend - Send Report Ready Email

```typescript
await emailService.sendReportReadyEmail(
  { id: user.id, email: user.email, name: user.name },
  {
    id: 'SUB-123',
    propertyName: 'Villa do Mar',
    reportUrl: 'https://app.example.com/report/123',
    reportType: 'premium',
  }
);
```

### Backend - Call Edge Function

```typescript
const response = await supabase.functions.invoke('send-diagnostic-email', {
  body: {
    email: 'user@example.com',
    name: 'John Doe',
    submissionId: 'SUB-123',
    propertyName: 'Villa do Mar',
    emailType: 'report_ready',
    language: 'en',
  },
});
```

## 🎨 Email Templates Preview

Access the test page at: **`/test-emails`**

Features:
- Live preview of all email templates
- Send test emails to any address
- Copy HTML source code
- Configure test data
- View template properties

## 📊 Database Tables

### email_notifications
Tracks all sent emails:
- Email status (sent, failed, pending)
- Retry count
- Error messages
- Resend ID for tracking

### email_preferences
User email preferences:
- Opt-in/opt-out for different email types
- Unsubscribe functionality
- Per-user settings

## 🔧 Email Service Features

**Automatic Retry Logic**
- Retries failed emails up to 3 times
- Exponential backoff: 1s → 5s → 15s

**Rate Limiting**
- 1 email per second to prevent throttling

**Email Preferences**
- Check user preferences before sending
- Respect opt-out settings
- Always send security emails (password reset)

**Delivery Tracking**
- Track sent, failed, and pending emails
- Store error messages for debugging
- Integration with Resend API

## 🧪 Testing

### Test Page
1. Visit `/test-emails`
2. Enter test email and name
3. Click "Send Test Email" for any template
4. Check your inbox!

### Manual Edge Function Test
```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/send-diagnostic-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "emailType": "diagnostic_submission"
  }'
```

### Check Email History
```sql
-- View all sent emails
SELECT * FROM email_notifications
ORDER BY created_at DESC
LIMIT 10;

-- Check failed emails
SELECT * FROM email_notifications
WHERE status = 'failed';
```

## 🐛 Troubleshooting

### Emails not sending?

**Check API Key**
```bash
# Frontend - check browser console
console.log(import.meta.env.VITE_RESEND_API_KEY);

# Backend - check Supabase logs
```

**Check Email Logs**
```sql
SELECT email, status, error_message
FROM email_notifications
WHERE status = 'failed'
ORDER BY created_at DESC;
```

**Retry Failed Emails**
```typescript
const result = await emailService.retryFailedEmails();
console.log(`Retried: ${result.retriedCount}, Success: ${result.successCount}`);
```

### Domain Verification (Production)

For production, verify your domain in Resend:
1. Add domain in Resend dashboard
2. Add DNS records (DKIM, SPF, DMARC)
3. Update `from` email address in templates

## 📱 Email Types

| Type | When Sent | Respects Opt-out |
|------|-----------|------------------|
| Welcome | User signs up | Yes |
| Report Ready | Analysis complete | Yes |
| Payment Confirmation | Payment success | Yes |
| Password Reset | Password reset request | No (security) |
| Diagnostic Submission | Form submitted | Yes |

## 🔐 Security

- RLS policies protect user data
- Password reset emails always sent (security)
- Unsubscribe links in all emails
- Service role required for backend operations
- Email preferences respect privacy

## 📈 Next Steps

1. **Set up Resend account** and get API key
2. **Run database migration** to create tables
3. **Configure environment variables**
4. **Test on `/test-emails` page**
5. **Integrate into your application workflow**
6. **Monitor delivery in database**

## 📚 Full Documentation

See `README_EMAIL_SYSTEM.md` for:
- Detailed API reference
- Advanced configuration
- Email preference management
- Monitoring and analytics
- Best practices
- Troubleshooting guide

## 🎯 Integration Points

### When to send emails:

**Welcome Email**
```typescript
// After user signup
await emailService.sendWelcomeEmail(user);
```

**Report Ready**
```typescript
// After report generation completes
await emailService.sendReportReadyEmail(user, report);
```

**Payment Confirmation**
```typescript
// After successful payment
await emailService.sendPaymentConfirmationEmail(user, payment);
```

**Password Reset**
```typescript
// When user requests password reset
await emailService.sendPasswordResetEmail(user, resetToken);
```

## ✅ Checklist

- [ ] Install dependencies (`@react-email/components`, `@react-email/render`)
- [ ] Run database migration
- [ ] Get Resend API key
- [ ] Configure environment variables (frontend & backend)
- [ ] Test on `/test-emails` page
- [ ] Send your first test email
- [ ] Integrate into application workflow
- [ ] Set up domain verification (production)
- [ ] Monitor email delivery

## 🎉 You're Ready!

The email system is complete and production-ready. Visit `/test-emails` to see it in action!

For questions or issues, check:
1. Browser console for errors
2. Supabase logs for edge function errors
3. `email_notifications` table for delivery status
4. Full documentation in `README_EMAIL_SYSTEM.md`

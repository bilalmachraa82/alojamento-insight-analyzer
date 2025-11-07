# Email Notification System

Complete email notification system for the Alojamento Insight Analyzer project.

## Features

- **Resend API Integration**: Modern, developer-friendly email service
- **Beautiful Email Templates**: Responsive React-based email templates
- **Retry Logic**: Automatic retry with exponential backoff (1s, 5s, 15s)
- **Rate Limiting**: Prevents API throttling (1 email per second)
- **Email Preferences**: User opt-in/opt-out management
- **Delivery Tracking**: Track sent, failed, opened, and clicked emails
- **Multi-language Support**: English and Portuguese templates
- **Error Handling**: Comprehensive error logging and tracking

## Components

### 1. Email Service (`src/services/emailService.ts`)

Main service for sending emails with the following functions:

```typescript
emailService.sendWelcomeEmail(user)
emailService.sendReportReadyEmail(user, report)
emailService.sendPaymentConfirmationEmail(user, payment)
emailService.sendPasswordResetEmail(user, token)
emailService.retryFailedEmails()
```

**Features**:
- Automatic retry logic (up to 3 retries)
- Rate limiting (1 email per second)
- Email preference checking
- Delivery tracking in database
- Graceful degradation if API key is missing

### 2. Email Templates (`src/emails/`)

Four beautifully designed, responsive email templates:

#### WelcomeEmail.tsx
- Sent when a new user creates an account
- Includes getting started guide
- Call-to-action button to login

#### ReportReadyEmail.tsx
- Sent when a property analysis report is completed
- Displays submission ID and property name
- Link to view the report
- Premium report features highlighted

#### PaymentConfirmationEmail.tsx
- Sent after a successful payment
- Shows transaction details and amount
- Link to download invoice
- Payment method and date

#### PasswordResetEmail.tsx
- Sent when a user requests a password reset
- Security-focused design
- Reset link with expiry warning
- Security recommendations

### 3. Edge Function (`supabase/functions/send-diagnostic-email/index.ts`)

Complete edge function for sending emails from the backend:

```typescript
// Request payload
{
  email: string;
  name: string;
  submissionId?: string;
  propertyName?: string;
  reportUrl?: string;
  language?: 'en' | 'pt';
  emailType?: 'diagnostic_submission' | 'report_ready';
  userId?: string;
}
```

**Features**:
- Email preference checking
- Template rendering
- Notification tracking
- Error handling
- CORS support

### 4. Database Tables

#### email_notifications
Tracks all email delivery:
- `id`: Unique identifier
- `user_id`: User reference
- `email`: Recipient email
- `email_type`: Type of email (welcome, report_ready, etc.)
- `subject`: Email subject
- `template_data`: JSON data used in template
- `status`: pending, sent, failed, bounced, opened, clicked
- `resend_id`: Resend API email ID
- `error_message`: Error details if failed
- `sent_at`, `opened_at`, `clicked_at`: Timestamps
- `retry_count`: Number of retry attempts
- `max_retries`: Maximum retry limit (default: 3)

#### email_preferences
User email preferences:
- `id`: Unique identifier
- `user_id`: User reference
- `email`: User email
- `marketing_emails`: Boolean
- `product_updates`: Boolean
- `report_notifications`: Boolean
- `payment_notifications`: Boolean
- `security_alerts`: Boolean
- `unsubscribed_at`: Timestamp if unsubscribed

### 5. Test Page (`/test-emails`)

Interactive testing page to:
- Preview all email templates
- Send test emails
- Copy HTML source
- Configure test data
- View template properties

Access at: `http://localhost:5173/test-emails`

## Setup

### 1. Install Dependencies

```bash
npm install @react-email/components @react-email/render
```

### 2. Configure Environment Variables

**Frontend** (`.env`):
```env
VITE_RESEND_API_KEY=re_your_api_key_here
```

**Backend** (Supabase Secrets):
```bash
# Set in Supabase Dashboard > Project Settings > Edge Functions > Secrets
RESEND_API_KEY=re_your_api_key_here
```

### 3. Run Database Migration

```bash
# Apply the migration to create email_notifications and email_preferences tables
supabase db push
```

Or manually run:
```bash
supabase migration up --db-url YOUR_DATABASE_URL
```

### 4. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Create a new API key
3. Verify your domain (or use the free testing domain)
4. Add the API key to your environment

## Usage

### Frontend Usage

```typescript
import { emailService } from '@/services/emailService';

// Send welcome email
await emailService.sendWelcomeEmail({
  id: user.id,
  email: user.email,
  name: user.name,
});

// Send report ready email
await emailService.sendReportReadyEmail(
  { id: user.id, email: user.email, name: user.name },
  {
    id: submission.id,
    propertyName: 'Villa do Mar',
    reportUrl: 'https://app.example.com/report/123',
    reportType: 'premium',
  }
);

// Send payment confirmation
await emailService.sendPaymentConfirmationEmail(
  { id: user.id, email: user.email, name: user.name },
  {
    amount: 29.99,
    currency: 'EUR',
    transactionId: 'txn_123',
    planName: 'Premium Plan',
    paymentMethod: 'Credit Card ending in 4242',
    invoiceUrl: 'https://app.example.com/invoice/123',
  }
);

// Send password reset
await emailService.sendPasswordResetEmail(
  { id: user.id, email: user.email, name: user.name },
  'reset_token_abc123'
);
```

### Backend Usage (Edge Function)

```typescript
// From another edge function
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/send-diagnostic-email`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email: 'user@example.com',
      name: 'John Doe',
      submissionId: 'SUB-123',
      propertyName: 'Villa do Mar',
      reportUrl: 'https://app.example.com/report/123',
      language: 'en',
      emailType: 'report_ready',
      userId: 'user-uuid',
    }),
  }
);

const result = await response.json();
console.log('Email sent:', result.success);
```

### Database Functions

#### Check if user wants to receive email
```sql
SELECT should_send_email('user@example.com', 'report_ready');
-- Returns: true/false
```

#### Retry failed emails
```sql
SELECT * FROM retry_failed_emails();
-- Returns: List of retried emails
```

## Email Types

| Type | Description | Respects Opt-out |
|------|-------------|------------------|
| `welcome` | New user welcome | Yes (product_updates) |
| `report_ready` | Report completion | Yes (report_notifications) |
| `payment_confirmation` | Payment success | Yes (payment_notifications) |
| `password_reset` | Password reset | No (always sent) |
| `diagnostic_submission` | Submission confirmation | Yes (report_notifications) |

## Email Preferences Management

### Update User Preferences

```typescript
import { supabase } from '@/integrations/supabase/client';

// Update preferences
await supabase
  .from('email_preferences')
  .upsert({
    user_id: userId,
    email: userEmail,
    marketing_emails: false,
    product_updates: true,
    report_notifications: true,
    payment_notifications: true,
    security_alerts: true,
  });

// Unsubscribe from all emails (except security)
await supabase
  .from('email_preferences')
  .upsert({
    user_id: userId,
    email: userEmail,
    unsubscribed_at: new Date().toISOString(),
  });
```

## Testing

### 1. Test Page
Visit `/test-emails` to:
- Preview all email templates
- Send test emails to any address
- Copy HTML source
- View template data

### 2. Manual Testing

```bash
# Test the edge function directly
curl -X POST https://your-project.supabase.co/functions/v1/send-diagnostic-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "submissionId": "TEST-123",
    "emailType": "diagnostic_submission",
    "language": "en"
  }'
```

### 3. Retry Logic Testing

```typescript
// Manually test retry logic
const result = await emailService.retryFailedEmails();
console.log(`Retried: ${result.retriedCount}, Success: ${result.successCount}`);
```

## Monitoring

### View Email Statistics

```sql
-- Overall statistics
SELECT
  email_type,
  status,
  COUNT(*) as count
FROM email_notifications
GROUP BY email_type, status
ORDER BY email_type, status;

-- Failed emails
SELECT *
FROM email_notifications
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Recent emails
SELECT *
FROM email_notifications
ORDER BY created_at DESC
LIMIT 10;

-- User email history
SELECT *
FROM email_notifications
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;
```

## Troubleshooting

### Emails not sending

1. **Check API Key**: Ensure `RESEND_API_KEY` is set correctly
2. **Check Domain**: Verify your domain in Resend dashboard
3. **Check Logs**: View browser console and Supabase logs
4. **Check Database**: Verify email_notifications table exists

### Failed Emails

```sql
-- Check failed emails with errors
SELECT
  email,
  email_type,
  error_message,
  retry_count,
  created_at
FROM email_notifications
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Retry Failed Emails

```typescript
// Automatically retry all eligible failed emails
const result = await emailService.retryFailedEmails();
console.log(`Retried ${result.retriedCount} emails, ${result.successCount} succeeded`);
```

Or via SQL:
```sql
SELECT * FROM retry_failed_emails();
```

## Security

- Password reset emails are always sent (cannot be opted out)
- Unsubscribe links included in all emails
- Row-level security (RLS) policies protect user data
- Service role required for backend operations
- Email addresses are validated before sending

## Best Practices

1. **Always check email preferences** before sending marketing emails
2. **Track delivery status** in the database
3. **Retry failed emails** periodically
4. **Monitor bounce rates** and update email list
5. **Test templates** before deploying to production
6. **Use plain text fallback** for better deliverability
7. **Include unsubscribe links** in all emails
8. **Log errors** for debugging

## Future Enhancements

- [ ] Track email open rates with pixel tracking
- [ ] Track click rates with link tracking
- [ ] Add email scheduling
- [ ] Add email templates for more events
- [ ] Add email analytics dashboard
- [ ] Support for attachments
- [ ] A/B testing for email content
- [ ] Webhook integration for delivery events

## License

This email system is part of the Alojamento Insight Analyzer project.

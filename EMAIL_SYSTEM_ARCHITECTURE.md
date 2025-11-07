# Email System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ALOJAMENTO INSIGHT ANALYZER                      │
│                         Email Notification System                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   User Actions       │
│  - Sign Up           │
│  - Submit Property   │
│  - Make Payment      │
│  - Reset Password    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Email Service (src/services/emailService.ts)                   │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │  • sendWelcomeEmail()                                      │  │    │
│  │  │  • sendReportReadyEmail()                                  │  │    │
│  │  │  • sendPaymentConfirmationEmail()                          │  │    │
│  │  │  • sendPasswordResetEmail()                                │  │    │
│  │  │  • retryFailedEmails()                                     │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                   │    │
│  │  Features:                                                        │    │
│  │  ✓ Retry Logic (3 attempts: 1s, 5s, 15s)                        │    │
│  │  ✓ Rate Limiting (1 email/second)                               │    │
│  │  ✓ Email Preference Checking                                    │    │
│  │  ✓ Delivery Tracking                                            │    │
│  │  ✓ Error Handling                                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Email Templates (src/emails/)                                  │    │
│  │  ┌───────────────┐ ┌────────────────┐ ┌──────────────────┐     │    │
│  │  │ WelcomeEmail  │ │ ReportReady    │ │ PaymentConfirm   │     │    │
│  │  │   .tsx        │ │    Email.tsx   │ │    Email.tsx     │     │    │
│  │  └───────────────┘ └────────────────┘ └──────────────────┘     │    │
│  │  ┌───────────────┐                                              │    │
│  │  │ PasswordReset │                                              │    │
│  │  │   Email.tsx   │                                              │    │
│  │  └───────────────┘                                              │    │
│  │                                                                   │    │
│  │  Features:                                                        │    │
│  │  ✓ React Email Components                                       │    │
│  │  ✓ Responsive Design                                            │    │
│  │  ✓ Multi-language (EN/PT)                                       │    │
│  │  ✓ Beautiful Styling                                            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Test Page (/test-emails)                                       │    │
│  │  • Preview all templates                                         │    │
│  │  • Send test emails                                              │    │
│  │  • Copy HTML source                                              │    │
│  │  • Configure test data                                           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Check Email   │
                    │  Preferences   │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Render Email  │
                    │  Template      │
                    └────────┬───────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      RESEND API (Email Service)                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  POST https://api.resend.com/emails                             │    │
│  │  {                                                                │    │
│  │    "from": "Alojamento Insight <noreply@...>",                  │    │
│  │    "to": ["user@example.com"],                                  │    │
│  │    "subject": "...",                                             │    │
│  │    "html": "..."                                                 │    │
│  │  }                                                                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Features:                                                               │
│  ✓ Reliable delivery                                                    │
│  ✓ Email tracking                                                       │
│  ✓ Bounce handling                                                      │
│  ✓ Developer-friendly API                                               │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   Email Sent   │
                    └────────┬───────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      DATABASE (Supabase PostgreSQL)                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  email_notifications                                             │    │
│  │  ┌────────────────────────────────────────────────────────────┐ │    │
│  │  │ id                 UUID                                     │ │    │
│  │  │ user_id            UUID                                     │ │    │
│  │  │ email              TEXT                                     │ │    │
│  │  │ email_type         TEXT (enum)                              │ │    │
│  │  │ subject            TEXT                                     │ │    │
│  │  │ template_data      JSONB                                    │ │    │
│  │  │ status             TEXT (sent/failed/pending)               │ │    │
│  │  │ resend_id          TEXT                                     │ │    │
│  │  │ error_message      TEXT                                     │ │    │
│  │  │ sent_at            TIMESTAMPTZ                              │ │    │
│  │  │ retry_count        INTEGER                                  │ │    │
│  │  │ max_retries        INTEGER (default: 3)                     │ │    │
│  │  │ created_at         TIMESTAMPTZ                              │ │    │
│  │  │ updated_at         TIMESTAMPTZ                              │ │    │
│  │  └────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  email_preferences                                               │    │
│  │  ┌────────────────────────────────────────────────────────────┐ │    │
│  │  │ id                      UUID                                │ │    │
│  │  │ user_id                 UUID (unique)                       │ │    │
│  │  │ email                   TEXT (unique)                       │ │    │
│  │  │ marketing_emails        BOOLEAN (default: true)             │ │    │
│  │  │ product_updates         BOOLEAN (default: true)             │ │    │
│  │  │ report_notifications    BOOLEAN (default: true)             │ │    │
│  │  │ payment_notifications   BOOLEAN (default: true)             │ │    │
│  │  │ security_alerts         BOOLEAN (default: true)             │ │    │
│  │  │ unsubscribed_at         TIMESTAMPTZ                         │ │    │
│  │  │ created_at              TIMESTAMPTZ                         │ │    │
│  │  │ updated_at              TIMESTAMPTZ                         │ │    │
│  │  └────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Functions                                                       │    │
│  │  • should_send_email(email, type) → BOOLEAN                     │    │
│  │  • retry_failed_emails() → TABLE                                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Row Level Security (RLS)                                        │    │
│  │  • Users can view their own data                                │    │
│  │  • Users can manage their own preferences                       │    │
│  │  • Service role has full access                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                   BACKEND (Supabase Edge Functions)                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  send-diagnostic-email (Deno)                                   │    │
│  │  ┌────────────────────────────────────────────────────────────┐ │    │
│  │  │  POST /functions/v1/send-diagnostic-email                  │ │    │
│  │  │  {                                                          │ │    │
│  │  │    "email": "user@example.com",                            │ │    │
│  │  │    "name": "John Doe",                                     │ │    │
│  │  │    "submissionId": "SUB-123",                              │ │    │
│  │  │    "propertyName": "Villa do Mar",                         │ │    │
│  │  │    "reportUrl": "https://...",                             │ │    │
│  │  │    "language": "en",                                       │ │    │
│  │  │    "emailType": "report_ready",                            │ │    │
│  │  │    "userId": "uuid"                                        │ │    │
│  │  │  }                                                          │ │    │
│  │  └────────────────────────────────────────────────────────────┘ │    │
│  │                                                                   │    │
│  │  Features:                                                        │    │
│  │  ✓ Email preference checking                                    │    │
│  │  ✓ Template rendering                                           │    │
│  │  ✓ Resend API integration                                       │    │
│  │  ✓ Database tracking                                            │    │
│  │  ✓ Error handling                                               │    │
│  │  ✓ CORS support                                                 │    │
│  │  ✓ Multi-language support                                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Email Sending Flow

```
1. User Action (e.g., Sign Up)
   │
   ▼
2. Frontend calls emailService.sendWelcomeEmail(user)
   │
   ▼
3. Check email preferences in database
   │  ├─→ User opted out? → Return early
   │  └─→ User wants email? → Continue
   │
   ▼
4. Render email template with React
   │
   ▼
5. Send to Resend API
   │  ├─→ Success? → Record in database (status: sent)
   │  └─→ Failed? → Retry with backoff
   │                 │
   │                 ▼
   │              Retry #1 (after 1s)
   │                 │
   │                 ├─→ Success? → Record success
   │                 └─→ Failed? → Continue
   │                                 │
   │                                 ▼
   │                              Retry #2 (after 5s)
   │                                 │
   │                                 ├─→ Success? → Record success
   │                                 └─→ Failed? → Continue
   │                                                 │
   │                                                 ▼
   │                                              Retry #3 (after 15s)
   │                                                 │
   │                                                 ├─→ Success? → Record success
   │                                                 └─→ Failed? → Record failure
   │
   ▼
6. Track in email_notifications table
   - Email ID from Resend
   - Status (sent/failed)
   - Error message (if failed)
   - Retry count
```

### Edge Function Flow

```
1. Backend event (e.g., Report Complete)
   │
   ▼
2. Call edge function with payload
   │
   ▼
3. Validate request & check preferences
   │
   ▼
4. Render inline HTML template
   │
   ▼
5. Send via Resend API
   │
   ▼
6. Track in database
   │
   ▼
7. Return success/failure response
```

## Email Types & Triggers

| Email Type | Trigger | Frontend/Backend | Opt-out |
|-----------|---------|------------------|---------|
| Welcome | User signup | Frontend | Yes |
| Report Ready | Analysis complete | Backend (Edge Function) | Yes |
| Payment Confirmation | Payment success | Frontend | Yes |
| Password Reset | Reset request | Frontend | No (security) |
| Diagnostic Submission | Form submit | Backend (Edge Function) | Yes |

## Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND                                               │
│  • React 18                                             │
│  • TypeScript                                           │
│  • @react-email/components (Email templates)            │
│  • @react-email/render (HTML generation)                │
│  • Vite (Build tool)                                    │
│  • shadcn/ui (UI components)                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  BACKEND                                                │
│  • Deno (Edge function runtime)                         │
│  • Supabase Edge Functions                              │
│  • PostgreSQL (Database)                                │
│  • Row Level Security (RLS)                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  EMAIL SERVICE                                          │
│  • Resend API (Email delivery)                          │
│  • Modern REST API                                      │
│  • Webhook support (future)                             │
└─────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND                                               │
│  • User authentication required                         │
│  • VITE_RESEND_API_KEY (env variable)                  │
│  • Client-side preference checks                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  DATABASE                                               │
│  • Row Level Security (RLS) policies                    │
│  • Users can only view their own notifications          │
│  • Users can only update their own preferences          │
│  • Service role has full access                         │
│  • Encrypted connections (SSL/TLS)                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  EDGE FUNCTIONS                                         │
│  • Service role authentication                          │
│  • RESEND_API_KEY (secret)                             │
│  • CORS headers                                         │
│  • Input validation                                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  RESEND API                                             │
│  • API key authentication                               │
│  • Rate limiting                                        │
│  • TLS/SSL encryption                                   │
└─────────────────────────────────────────────────────────┘
```

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────┐
│  EMAIL TRACKING                                         │
│                                                         │
│  Database: email_notifications                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  • Total emails sent                           │    │
│  │  • Failed emails (with error messages)         │    │
│  │  • Pending emails                              │    │
│  │  • Retry counts                                │    │
│  │  • Success/failure rates                       │    │
│  │  • Email type distribution                     │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  Queries:                                               │
│  • Email statistics by type and status                  │
│  • Failed email analysis                               │
│  • User email history                                  │
│  • Recent email activity                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  USER PREFERENCES                                       │
│                                                         │
│  Database: email_preferences                            │
│  ┌────────────────────────────────────────────────┐    │
│  │  • Opt-out statistics                          │    │
│  │  • Preference distribution                     │    │
│  │  • Unsubscribe tracking                        │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  LOGS                                                   │
│                                                         │
│  • Frontend: Browser console                            │
│  • Backend: Supabase Edge Function logs                 │
│  • Database: PostgreSQL logs                            │
│  • Resend: Dashboard analytics                          │
└─────────────────────────────────────────────────────────┘
```

## Scalability

```
┌─────────────────────────────────────────────────────────┐
│  RATE LIMITING                                          │
│  • 1 email per second (frontend)                        │
│  • Prevents API throttling                              │
│  • Can be adjusted based on Resend tier                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  RETRY LOGIC                                            │
│  • Automatic retries for failed sends                   │
│  • Exponential backoff (1s, 5s, 15s)                   │
│  • Maximum 3 retries per email                          │
│  • Manual retry for old failed emails                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  DATABASE                                               │
│  • Indexed columns for fast queries                     │
│  • Efficient JSONB storage for template data            │
│  • Automatic cleanup of old records (future)            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  EDGE FUNCTIONS                                         │
│  • Serverless, auto-scaling                             │
│  • Deploy close to users                                │
│  • Isolated execution environments                      │
└─────────────────────────────────────────────────────────┘
```

## Future Enhancements

```
┌─────────────────────────────────────────────────────────┐
│  ANALYTICS                                              │
│  • Email open rate tracking (pixel)                     │
│  • Click-through rate tracking (link wrapping)          │
│  • Conversion tracking                                  │
│  • A/B testing for subject lines                        │
│  • Engagement analytics dashboard                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  AUTOMATION                                             │
│  • Scheduled email campaigns                            │
│  • Drip email sequences                                 │
│  • Re-engagement campaigns                              │
│  • Abandoned cart emails                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ADVANCED FEATURES                                      │
│  • Email attachments (PDF reports)                      │
│  • Dynamic content personalization                      │
│  • Segmentation and targeting                           │
│  • Webhook integration for delivery events              │
│  • Email template builder UI                            │
└─────────────────────────────────────────────────────────┘
```

---

**Architecture designed for:**
- ✓ Reliability
- ✓ Scalability
- ✓ Security
- ✓ Maintainability
- ✓ Observability
- ✓ User privacy

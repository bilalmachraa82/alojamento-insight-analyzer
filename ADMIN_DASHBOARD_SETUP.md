# Admin Dashboard Setup Guide

This guide will help you set up and use the comprehensive admin dashboard for the alojamento-insight-analyzer project.

## Overview

The admin dashboard provides:
- Real-time system health monitoring
- Submission analytics and metrics
- User management and analytics
- Error tracking and resolution
- Performance monitoring
- API usage and quota tracking
- Revenue metrics (when payment provider is integrated)

## Setup Instructions

### 1. Run Database Migrations

Apply the admin infrastructure migration:

```bash
# Using Supabase CLI
supabase db reset  # This will apply all migrations including the admin one

# Or apply just the admin migration
psql -h your-database-host -U postgres -d your-database -f supabase/migrations/20251020000001_create_admin_infrastructure.sql
```

### 2. Create an Admin User

After authentication is set up, you need to create an admin user profile:

```sql
-- First, create a user through Supabase Auth (via your app UI)
-- Then, insert their profile with admin role:

INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
VALUES (
  'USER_UUID_FROM_AUTH',
  'admin@example.com',
  'Admin User',
  'admin',  -- or 'super_admin' for full access
  true
);
```

### 3. Deploy Edge Functions

Deploy the admin edge functions to Supabase:

```bash
# Deploy all admin functions
supabase functions deploy admin/get-system-health
supabase functions deploy admin/get-error-logs
supabase functions deploy admin/reprocess-all-failed
supabase functions deploy admin/cleanup-old-data
```

### 4. Set Environment Variables

Ensure these environment variables are set in your `.env` file:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Accessing the Admin Dashboard

1. Log in to your application with an admin account
2. Navigate to `/admin` in your browser
3. The dashboard will verify your admin role automatically

If you're not an admin, you'll be redirected to the home page.

## Features

### 1. System Health Monitoring

**Location:** Overview tab > System Health Card

Monitors:
- Database connectivity and response time
- Edge Functions status
- Storage service health
- External API services (Apify, Claude, Resend)

**Auto-refresh:** Every 30 seconds

### 2. Submission Metrics

**Location:** Submissions tab

Tracks:
- Total submissions (last 30 days)
- Success rate percentage
- Average processing time
- Failed submission count
- Pending submissions
- Daily submission trends

### 3. User Analytics

**Location:** Users tab

Displays:
- Total user count
- Active users (last 30 days)
- New signups today
- Churn rate
- Admin count
- User activity trends

### 4. Error Tracking

**Location:** Errors tab

Features:
- Real-time error logs
- Error severity filtering (critical, error, warning, info)
- Error resolution workflow
- Stack traces and context
- Error summary by type
- Affected users count

**Actions:**
- Mark errors as resolved
- View detailed stack traces
- Filter by severity and status

### 5. Performance Monitoring

**Location:** Performance tab

Metrics:
- Response time trends
- P95 latency
- Error rate over time
- Request throughput
- Database performance

### 6. API Usage & Quota

**Location:** Overview tab > API Quota Card

Tracks:
- API costs per service
- Total API calls
- Success rates
- Quota usage (with alerts)
- Token usage (for Claude API)

**Alerts:**
- Warning when usage exceeds 80% of quota
- Critical alert when quota is exceeded

### 7. Admin Actions

**Quick Actions (Top of dashboard):**

1. **Reprocess Failed Submissions**
   - Automatically requeues all failed submissions
   - Only reprocesses submissions with < 3 retry attempts
   - Logs action in audit logs

2. **Cleanup Old Data**
   - Removes old error logs (default: 90 days)
   - Cleans system health checks (default: 30 days)
   - Purges old API usage logs (default: 90 days)
   - Anonymizes old completed submissions (default: 180 days)
   - Requires confirmation

3. **Export Data**
   - Export dashboard data (CSV/JSON)
   - Coming in future update

## Security Features

### Row-Level Security (RLS)

All admin tables have RLS policies that:
- Only allow admins to view sensitive data
- Log all admin actions in audit logs
- Prevent unauthorized access

### Audit Logging

Every admin action is logged with:
- Admin user ID
- Action type
- Resource affected
- Old and new values
- IP address (when available)
- Timestamp

View audit logs:

```sql
SELECT * FROM public.admin_audit_logs
ORDER BY created_at DESC
LIMIT 100;
```

### IP Whitelisting (Optional)

To enable IP whitelisting for admin access:

1. Update the admin edge functions to check IP addresses
2. Maintain a whitelist in environment variables or database
3. Reject requests from non-whitelisted IPs

## Error Logging Utility

Use the error logger utility in your code to automatically log errors:

```typescript
import { logError, logApiUsage } from '@/utils/errorLogger';

// Log an error
try {
  // Your code
} catch (error) {
  await logError({
    errorType: 'SUBMISSION_PROCESSING_ERROR',
    errorMessage: error.message,
    stackTrace: error.stack,
    submissionId: submission.id,
    severity: 'error',
    context: { additionalInfo: 'value' },
  });
}

// Log API usage
await logApiUsage({
  serviceName: 'claude',
  operation: 'generate-analysis',
  tokensUsed: 1500,
  costUsd: 0.045,
  submissionId: submission.id,
  success: true,
});
```

## Monitoring Best Practices

1. **Check System Health Daily**
   - Review overall system status
   - Investigate any degraded services

2. **Monitor Error Logs**
   - Resolve critical errors immediately
   - Track error trends to identify issues

3. **Track API Costs**
   - Monitor quota usage
   - Optimize API calls to reduce costs
   - Set up alerts for cost thresholds

4. **Review Performance Metrics**
   - Identify slow endpoints
   - Optimize processing times
   - Monitor error rates

5. **User Activity**
   - Track user growth
   - Monitor churn rate
   - Analyze engagement patterns

## Troubleshooting

### Dashboard won't load
- Verify you're logged in with an admin account
- Check browser console for errors
- Verify database migrations have been applied

### System health shows "down"
- Check Supabase dashboard for service status
- Review edge function logs
- Verify environment variables

### Error logs not appearing
- Ensure `logError` utility is being used in code
- Check RLS policies are correctly configured
- Verify admin role in user_profiles table

### API quota not tracking
- Ensure `logApiUsage` is called after API requests
- Check api_usage_logs table permissions
- Review edge function logs for insertion errors

## Future Enhancements

- Email notifications for critical errors
- Slack/Discord webhooks for alerts
- Advanced data export (CSV, JSON, PDF reports)
- Custom dashboard widgets
- Multi-factor authentication for admin access
- Advanced user management (block, refund, etc.)
- Revenue integration with Stripe

## Support

For issues or questions:
1. Check the error logs in the admin dashboard
2. Review edge function logs in Supabase
3. Check database logs for query errors
4. Contact the development team

---

**Note:** This admin dashboard handles sensitive data. Always follow security best practices:
- Use strong passwords
- Enable MFA when available
- Regularly review audit logs
- Limit admin access to trusted users
- Keep dependencies updated

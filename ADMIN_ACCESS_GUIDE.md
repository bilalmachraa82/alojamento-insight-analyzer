# 🔐 Admin Dashboard Access Guide

## Overview

The Maria Faz admin dashboard provides comprehensive monitoring and management capabilities for the entire platform. This guide explains how to access and use the admin features.

---

## 1️⃣ Prerequisites

### Required Setup
- ✅ Active user account in the system
- ✅ Admin role assigned to your user
- ✅ Lovable Cloud database access

### Database Schema
The admin system uses these key tables:
- `user_roles` - Role assignments (user, admin, super_admin)
- `error_logs` - System error tracking
- `api_usage_logs` - API cost monitoring
- `system_health_checks` - Service health status
- `admin_audit_logs` - Admin action audit trail

---

## 2️⃣ Promoting a User to Admin

### Method 1: Using SQL (Recommended for First Admin)

```sql
-- Get your user ID first
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Promote user to admin
SELECT promote_to_admin('YOUR_USER_ID_HERE');
```

### Method 2: Using Super Admin Account

If you already have a super admin:
1. Log in with super admin credentials
2. Access the admin dashboard
3. Navigate to User Management (coming soon)
4. Assign admin role to target user

### Method 3: Direct Insert (Development Only)

```sql
-- Insert admin role for user
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### Role Types

- **user** (default) - Regular user access
- **admin** - Full admin dashboard access
- **super_admin** - All admin privileges + user management

---

## 3️⃣ Accessing the Dashboard

### Login Process

1. **Navigate to Homepage**
   ```
   https://your-domain.com/
   ```

2. **Authenticate** (if not logged in)
   - Use email/password authentication
   - OAuth providers (if configured)

3. **Access Admin Dashboard**
   ```
   https://your-domain.com/admin
   ```

### Access Verification

The system automatically:
- ✅ Verifies user authentication
- ✅ Checks admin role via `is_admin()` function
- ✅ Logs access attempts
- ❌ Redirects non-admins to homepage

---

## 4️⃣ Dashboard Navigation

### Main Tabs

#### **📊 Overview Tab**
- **System Health Card** - Real-time service status
- **API Quota Card** - Usage and cost tracking
- **Submission Metrics** - Processing statistics
- **User Metrics** - User activity overview
- **Revenue Metrics** - Financial data (if configured)

#### **📝 Submissions Tab**
- Recent submissions list
- Processing time analytics
- Success/failure rates
- Performance charts

#### **👥 Users Tab**
- User activity statistics
- Registration trends
- Churn rate analysis

#### **🐛 Errors Tab**
- Real-time error logs
- Severity filtering (info, warning, error, critical)
- Resolution workflow
- Stack trace viewer

#### **⚡ Performance Tab**
- Response time trends
- System health monitoring
- API usage patterns
- P95 latency metrics

---

## 5️⃣ Key Features

### Quick Actions (Top of Dashboard)

#### 🔄 Reprocess Failed Submissions
**Purpose:** Retry all submissions that failed processing

**Criteria:**
- Status = 'failed' or 'pending_manual_review'
- Retry count < 3
- Created within last 30 days

**Process:**
1. Click "Reprocess Failed Submissions"
2. System automatically queues submissions
3. Edge function triggers reprocessing
4. Monitor progress in Submissions tab

#### 🧹 Cleanup Old Data
**Purpose:** Remove old logs and anonymize data per retention policies

**Default Retention:**
- Error logs: 90 days
- System health checks: 30 days
- API usage logs: 90 days
- Completed submissions (anonymized): 180 days

**Process:**
1. Click "Cleanup Old Data"
2. Confirm action (irreversible!)
3. System executes cleanup
4. Summary shows records removed

#### 📥 Export Data
**Purpose:** Export dashboard data for external analysis

**Formats:**
- CSV (Excel-compatible)
- JSON (API integration)
- PDF Reports (coming soon)

**Status:** Coming in future update

---

## 6️⃣ Monitoring Best Practices

### Daily Checks
- [ ] Review System Health Card for degraded services
- [ ] Check critical errors in Error Log
- [ ] Monitor API quota usage
- [ ] Review submission success rate

### Weekly Tasks
- [ ] Analyze performance trends
- [ ] Review user activity patterns
- [ ] Check API cost optimization opportunities
- [ ] Resolve all unresolved errors

### Monthly Tasks
- [ ] Export and archive analytics data
- [ ] Run cleanup for old data
- [ ] Review and update admin access
- [ ] Performance optimization review

---

## 7️⃣ Security Features

### Row-Level Security (RLS)
All admin tables have strict RLS policies:
- Only admins can view sensitive data
- All queries filtered by `is_admin()` function
- Prevents privilege escalation attacks

### Audit Logging
Every admin action is logged:
```sql
SELECT * FROM admin_audit_logs
WHERE admin_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 50;
```

**Logged Actions:**
- User role promotions
- Failed submissions reprocessed
- Data cleanup operations
- Configuration changes

### Security Best Practices
- 🔒 Use strong, unique passwords
- 🔐 Enable 2FA (when available)
- 📝 Regularly review audit logs
- 🚫 Never share admin credentials
- ⏰ Log out after each session

---

## 8️⃣ Troubleshooting

### Dashboard Won't Load
**Symptoms:** Blank page or loading spinner

**Solutions:**
1. Verify you're logged in
2. Check browser console for errors
3. Confirm admin role assignment:
   ```sql
   SELECT * FROM user_roles WHERE user_id = auth.uid();
   ```
4. Clear browser cache and cookies
5. Try incognito/private browsing mode

### "Access Denied" Error
**Symptoms:** Redirected to homepage with error toast

**Solutions:**
1. Verify admin role exists:
   ```sql
   SELECT public.is_admin(auth.uid());
   ```
2. Re-assign admin role if missing
3. Check RLS policies are enabled
4. Verify edge functions are deployed

### System Health Shows "Down"
**Symptoms:** Services marked as unhealthy

**Solutions:**
1. Check Lovable Cloud dashboard
2. Review edge function logs
3. Verify database connectivity
4. Check API keys (Apify, Claude, Resend)

### Error Logs Not Appearing
**Symptoms:** Error log tab is empty

**Solutions:**
1. Verify `logError()` utility is being used in code
2. Check RLS policies on `error_logs` table
3. Manually insert test error:
   ```sql
   INSERT INTO error_logs (error_type, error_message, severity)
   VALUES ('test_error', 'Test error message', 'info');
   ```

### API Quota Not Tracking
**Symptoms:** API usage shows zero

**Solutions:**
1. Verify `logApiUsage()` is called after API requests
2. Check `api_usage_logs` table permissions
3. Review edge function logs for insertion errors

---

## 9️⃣ Advanced Features

### Dark Mode
Toggle between light/dark themes:
- Click sun/moon icon in top-right
- Choose: Light, Dark, or System
- Preference persists across sessions

### Auto-Refresh
Dashboard auto-refreshes every 30-60 seconds:
- System health: 30s
- Submissions: 30s
- Errors: 30s
- Performance: 60s

**To disable:** Click "Disable" in auto-refresh alert

### Custom Queries
For advanced analysis, use direct SQL:

```sql
-- Recent submission trends
SELECT 
  DATE(created_at) as date,
  COUNT(*) as submissions,
  COUNT(*) FILTER (WHERE status = 'completed') as completed
FROM diagnostic_submissions
WHERE created_at >= now() - interval '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- API cost by service
SELECT * FROM admin_api_usage_summary
ORDER BY total_cost_usd DESC;

-- Critical errors requiring attention
SELECT * FROM error_logs
WHERE severity = 'critical' AND NOT resolved
ORDER BY created_at DESC;
```

---

## 🔟 Support & Resources

### Documentation
- [Admin Dashboard Setup](./ADMIN_DASHBOARD_SETUP.md)
- [Admin Implementation Details](./ADMIN_DASHBOARD_IMPLEMENTATION.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)

### Getting Help
1. Check error logs in admin dashboard
2. Review edge function logs in Lovable Cloud
3. Check database logs for query errors
4. Contact development team

### Monitoring Queries
See [MONITORING_QUERIES.sql](./MONITORING_QUERIES.sql) for useful SQL queries.

---

## 📋 Quick Reference

### Important URLs
```
Homepage:        /
Admin Dashboard: /admin
Debug Page:      /debug
```

### Key Functions
```sql
-- Check if user is admin
SELECT is_admin(auth.uid());

-- Promote user to admin
SELECT promote_to_admin('user-id-here');

-- Check user's roles
SELECT role FROM user_roles WHERE user_id = auth.uid();
```

### Edge Functions
```
admin/get-system-health       - System status
admin/get-error-logs          - Error tracking
admin/reprocess-all-failed    - Retry failures
admin/cleanup-old-data        - Data retention
```

---

## ⚠️ Important Notes

1. **Never hardcode admin checks** - Always use `is_admin()` function
2. **Review audit logs regularly** - Track suspicious activity
3. **Limit admin access** - Only trusted users should be admins
4. **Keep credentials secure** - Never share or expose admin passwords
5. **Monitor API costs** - Set up alerts for quota thresholds
6. **Regular backups** - Export data periodically
7. **Stay updated** - Keep dependencies and database schema current

---

**Last Updated:** 2025-01-12  
**Version:** 1.0.0  
**Status:** Production Ready ✅
# Admin Dashboard Setup Guide

## Quick Setup (5 minutes)

### Step 1: Promote First Admin User

1. **Get your User ID from Lovable Cloud UI:**
   - Click "Cloud" tab in Lovable
   - Go to "Users & Authentication"
   - Find your user and copy the UUID

2. **Or get it via SQL query:**
   ```sql
   SELECT id, email, created_at 
   FROM auth.users 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

3. **Promote user to admin:**
   ```sql
   SELECT promote_to_admin('YOUR_USER_ID_HERE');
   ```

4. **Verify admin role:**
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID_HERE';
   ```

### Step 2: Access Admin Dashboard

1. Navigate to: **https://your-app.lovable.app/admin**
2. You should see the admin dashboard
3. If redirected to homepage, check step 1 was completed

### Step 3: Test Dark Mode

1. Click the Sun/Moon icon in top-right corner
2. Theme should toggle between light/dark
3. Theme persists across page reloads
4. System theme detection works automatically

---

## Dashboard Features

### Overview Tab
- **System Health Card**: Real-time status of all services
- **API Quota Card**: Usage and costs for Apify/Claude/Resend
- **Submission Metrics**: Success/fail rates, processing times
- **User Metrics**: User growth, activity trends
- **Revenue Metrics**: Financial tracking (future)

### Submissions Tab
- View all diagnostic submissions
- Filter by status (pending, completed, failed)
- See processing times and retry counts
- Reprocess failed submissions

### Users Tab
- User registration trends
- Active user statistics
- Retention metrics

### Errors Tab
- View all system errors
- Filter by severity (critical, error, warning)
- Mark errors as resolved
- View error context and stack traces

### Performance Tab
- System health monitoring
- API performance metrics
- Response time trends
- Success rate charts

---

## Quick Actions

### Reprocess Failed Submissions
- **What it does**: Retries all failed submissions (max 3 retries)
- **When to use**: After fixing a bug or API issue
- **How to use**: Click "Reprocess Failed Submissions" button
- **Expected result**: Toast showing success/fail counts

### Cleanup Old Data
- **What it does**: Removes old logs per retention policy
- **When to use**: When database grows too large
- **How to use**: Click "Cleanup Old Data" (confirmation required)
- **Retention periods**:
  - Error logs: 90 days (resolved only)
  - Health checks: 30 days
  - API logs: 90 days
  - Audit logs: 1 year
  - Submissions: anonymized after 180 days

---

## Troubleshooting

### Issue: "Access Denied"
**Solution:**
```sql
-- Verify user has admin role
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- If no role found, promote user
SELECT promote_to_admin(auth.uid());
```

### Issue: "Failed to verify admin access"
**Possible causes:**
1. Database connection issue
2. RLS policies not applied
3. `is_admin()` function missing

**Solution:**
```sql
-- Check if is_admin function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'is_admin';

-- If missing, run the migration again
-- (Contact support if issue persists)
```

### Issue: Dark mode colors look wrong
**Solution:**
1. Check `index.css` has dark mode CSS variables
2. Clear browser localStorage: `localStorage.clear()`
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Issue: Dashboard shows no data
**Possible causes:**
1. No submissions yet (expected on new install)
2. RLS policies blocking access
3. Edge functions not deployed

**Solution:**
1. Check if edge functions are deployed (should be automatic)
2. Submit a test diagnostic to populate data
3. Check browser console for errors

---

## Security Notes

### Authentication
- Admin access requires valid JWT token
- All edge functions verify admin role server-side
- Client-side checks are for UX only (server validates)

### Authorization
- Role checks use security definer functions (prevents RLS recursion)
- Audit logs track all admin actions
- RLS policies protect all admin tables

### Best Practices
- **Don't share admin credentials**
- **Regularly review audit logs**
- **Monitor error logs for security issues**
- **Use cleanup function to maintain database size**

---

## Promoting Additional Admins

To promote another user to admin:

```sql
-- Get user ID from email
SELECT id FROM auth.users WHERE email = 'user@example.com';

-- Promote to admin
SELECT promote_to_admin('USER_ID_HERE');
```

To demote an admin (manual):
```sql
DELETE FROM user_roles 
WHERE user_id = 'USER_ID_HERE' 
AND role = 'admin';
```

---

## Monitoring Checklist

### Daily
- [ ] Check error logs for critical issues
- [ ] Verify system health (all services "healthy")
- [ ] Review failed submissions

### Weekly
- [ ] Review API usage and costs
- [ ] Check submission success rates
- [ ] Analyze performance trends
- [ ] Review audit logs for unusual activity

### Monthly
- [ ] Run cleanup-old-data function
- [ ] Export and backup audit logs
- [ ] Review user growth metrics
- [ ] Optimize database if needed

---

## API Endpoints

All admin edge functions are at:
```
https://your-project.supabase.co/functions/v1/admin/...
```

### Available Endpoints
1. **GET /admin/get-system-health** - System health status
2. **GET /admin/get-error-logs?limit=100&severity=error** - Error logs
3. **POST /admin/reprocess-all-failed** - Retry failed submissions
4. **POST /admin/cleanup-old-data** - Remove old logs

All require `Authorization: Bearer <JWT_TOKEN>` header.

---

## Next Steps

After setup:
1. ✅ Confirm admin access works
2. ✅ Test dark mode toggle
3. ⏳ Run E2E test (see `E2E_TEST_EXECUTION_LOG.md`)
4. ⏳ Submit first real diagnostic
5. ⏳ Monitor dashboard for 24 hours

---

## Support

If you encounter issues:
1. Check `ADMIN_DASHBOARD_IMPLEMENTATION.md` for technical details
2. Review `TROUBLESHOOTING.md` (if exists)
3. Check Supabase edge function logs
4. Contact support with error details

---

**Admin Dashboard Version**: 1.0.0  
**Last Updated**: 2025-01-12  
**Status**: Production Ready

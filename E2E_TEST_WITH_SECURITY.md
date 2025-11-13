# 🔒 E2E Test with New Security Policies

**Test Date:** 2025-01-12  
**Environment:** Production with New Security  
**Changes:** Implemented secure RLS policies for diagnostic_submissions and premium-reports storage

---

## 🚨 Security Changes Implemented

### 1. diagnostic_submissions Table
- ❌ Removed public INSERT/UPDATE/SELECT policies
- ✅ Added service-role-only INSERT/UPDATE policies
- ✅ Added authenticated user SELECT (by email ownership)
- ✅ Added admin SELECT/UPDATE/DELETE policies
- ✅ Created `submit-diagnostic` edge function for secure submissions

### 2. premium-reports Storage Bucket
- ❌ Made bucket private (was public)
- ❌ Removed public read access policy
- ✅ Added authenticated user download policy (ownership verification)
- ✅ Added admin download policy (full access)
- ✅ Added service-role upload/update/delete policies

---

## 📋 Pre-Test Checklist

### Edge Functions Deployed
- [ ] submit-diagnostic (NEW - handles form submissions)
- [ ] process-diagnostic
- [ ] analyze-property-claude
- [ ] generate-premium-pdf
- [ ] send-diagnostic-email
- [ ] admin/get-system-health
- [ ] admin/get-error-logs
- [ ] admin/reprocess-all-failed
- [ ] admin/cleanup-old-data

### Database Verification
```sql
-- Verify RLS policies on diagnostic_submissions
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'diagnostic_submissions';

-- Expected policies:
-- Service role can insert submissions (INSERT, service_role)
-- Service role can update submissions (UPDATE, service_role)
-- Users can view own submissions by email (SELECT, authenticated)
-- Admins can view all submissions (SELECT, authenticated)
-- Admins can update all submissions (UPDATE, authenticated)
-- Admins can delete submissions (DELETE, authenticated)
```

### Storage Verification
```sql
-- Verify premium-reports bucket is private
SELECT name, public FROM storage.buckets WHERE name = 'premium-reports';
-- Expected: public = false

-- Verify storage.objects policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%premium%';

-- Expected policies:
-- Users can download own premium reports (SELECT, authenticated)
-- Service role can upload premium reports (INSERT, service_role)
-- Service role can update premium reports (UPDATE, service_role)
-- Service role can delete premium reports (DELETE, service_role)
```

---

## 🧪 Test 1: Form Submission Flow (Public User)

### Test Data
```
Name: Test User Security
Email: security.test@example.com
Property URL: https://www.booking.com/hotel/pt/pestana-palace-lisboa.pt-pt.html
Platform: Booking.com
```

### Steps

#### 1.1 Submit Form (Unauthenticated)
**Action:** Fill and submit the diagnostic form  
**Expected:** Form submits successfully via `submit-diagnostic` edge function

**Verification:**
```sql
SELECT id, email, status, created_at
FROM diagnostic_submissions
WHERE email = 'security.test@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

**Results:**
- [ ] Submission created with status 'pending'
- [ ] Submission ID: `_______________`
- [ ] No errors in console

---

#### 1.2 Check Status (Unauthenticated User Cannot Query)
**Action:** Try to query the submission directly (should fail)  

**Test Query (Will Fail):**
```sql
-- This should return empty or error for unauthenticated users
SELECT * FROM diagnostic_submissions 
WHERE email = 'security.test@example.com';
```

**Expected:** ❌ No results (RLS blocks access for unauthenticated users)  
**Actual:** [ ] PASS / [ ] FAIL

---

#### 1.3 Processing Completes
**Action:** Wait for processing to complete (~3-5 minutes)

**Verification:**
```sql
-- Use service role or admin account
SELECT 
  id, 
  status, 
  premium_report_url,
  report_generated_at
FROM diagnostic_submissions
WHERE email = 'security.test@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

**Results:**
- [ ] Status: completed
- [ ] Premium report URL populated
- [ ] PDF URL: `_______________`

---

#### 1.4 Test PDF Access (Unauthenticated)
**Action:** Try to access the PDF URL directly (should fail)

**Expected:** ❌ Access denied or requires authentication  
**Actual:** [ ] PASS / [ ] FAIL

**Why:** Bucket is now private, and the old public read policy is removed.

---

## 🧪 Test 2: Admin Access Test

### Prerequisites
```sql
-- Ensure you have an admin user
SELECT user_id, role FROM user_roles WHERE role = 'admin';
```

### Steps

#### 2.1 Login as Admin
**Action:** Login with admin credentials and navigate to `/admin`

**Expected:**
- [ ] Dashboard loads successfully
- [ ] No access denied errors
- [ ] All admin components visible

---

#### 2.2 View All Submissions
**Action:** Check submission metrics on admin dashboard

**Expected:**
- [ ] Test submission visible in metrics
- [ ] Total submissions count includes test
- [ ] Can see submission details

---

#### 2.3 Query Database as Admin
**Action:** Run admin queries

```sql
-- As authenticated admin user, this should work
SELECT id, email, status, premium_report_url
FROM diagnostic_submissions
WHERE email = 'security.test@example.com'
ORDER BY created_at DESC;
```

**Expected:** ✅ Returns results (admin has full access)  
**Actual:** [ ] PASS / [ ] FAIL

---

#### 2.4 Download PDF as Admin
**Action:** Try to download the premium report PDF

**Expected:** ✅ PDF downloads successfully (admin policy allows access)  
**Actual:** [ ] PASS / [ ] FAIL

---

## 🧪 Test 3: Authenticated User Access (With Auth)

### Prerequisites
**Note:** This test requires implementing user authentication. Currently, the app doesn't have signup/login.

**Action:** Create a test user account with email: `security.test@example.com`

### Steps

#### 3.1 Login as Submission Owner
**Action:** Login with the email used for the submission

---

#### 3.2 Query Own Submission
**Action:** Try to query own submission

```sql
-- As authenticated user with matching email
SELECT id, email, status, premium_report_url
FROM diagnostic_submissions
WHERE email = auth.email()
ORDER BY created_at DESC;
```

**Expected:** ✅ Returns user's own submissions only  
**Actual:** [ ] PASS / [ ] FAIL

---

#### 3.3 Download Own PDF
**Action:** Try to download the premium report PDF

**Expected:** ✅ PDF downloads successfully (ownership verified)  
**Actual:** [ ] PASS / [ ] FAIL

---

#### 3.4 Try to Access Other User's Submission
**Action:** Try to query another user's submission

```sql
-- Try to access submission with different email
SELECT * FROM diagnostic_submissions
WHERE email != auth.email();
```

**Expected:** ❌ Returns empty (RLS blocks access)  
**Actual:** [ ] PASS / [ ] FAIL

---

## 🧪 Test 4: Security Validation

### 4.1 Verify No Public Access to Submissions
```sql
-- Connect as anon user (no auth)
SELECT * FROM diagnostic_submissions LIMIT 1;
```

**Expected:** ❌ Returns empty or access denied  
**Actual:** [ ] PASS / [ ] FAIL

---

### 4.2 Verify No Public Write Access
```sql
-- Try to insert as anon user (should fail)
INSERT INTO diagnostic_submissions (name, email, property_url, platform, status)
VALUES ('Hacker', 'hacker@test.com', 'https://evil.com', 'booking', 'pending');
```

**Expected:** ❌ Permission denied error  
**Actual:** [ ] PASS / [ ] FAIL

---

### 4.3 Verify No Public Storage Access
**Action:** Try to list or access files in premium-reports bucket

**Test with Supabase client:**
```javascript
const { data, error } = await supabase.storage
  .from('premium-reports')
  .list();
```

**Expected:** ❌ Permission denied or empty result  
**Actual:** [ ] PASS / [ ] FAIL

---

### 4.4 Verify Storage Upload Blocked
**Action:** Try to upload a file as non-service-role user

```javascript
const { data, error } = await supabase.storage
  .from('premium-reports')
  .upload('test.pdf', new Blob(['test']));
```

**Expected:** ❌ Permission denied  
**Actual:** [ ] PASS / [ ] FAIL

---

## 🧪 Test 5: Edge Function Security

### 5.1 Test submit-diagnostic Input Validation
**Action:** Submit invalid data to edge function

**Test Cases:**
```javascript
// Missing required fields
await supabase.functions.invoke('submit-diagnostic', {
  body: { name: 'Test' } // missing email, property_url, platform
});
// Expected: 400 error with "Missing required fields"

// Invalid email
await supabase.functions.invoke('submit-diagnostic', {
  body: { 
    name: 'Test', 
    email: 'not-an-email', 
    property_url: 'https://booking.com/hotel/test',
    platform: 'booking'
  }
});
// Expected: 400 error with "Invalid email format"

// Invalid platform
await supabase.functions.invoke('submit-diagnostic', {
  body: { 
    name: 'Test', 
    email: 'test@test.com', 
    property_url: 'https://booking.com/hotel/test',
    platform: 'evil-platform'
  }
});
// Expected: 400 error with "Invalid platform"
```

**Results:**
- [ ] Missing fields validation works
- [ ] Email validation works
- [ ] Platform validation works

---

## 📊 Test Results Summary

### Security Posture: [ ] PASS / [ ] FAIL

**Critical Security Tests:**
- [ ] Public users cannot read submissions
- [ ] Public users cannot write submissions
- [ ] Public users cannot access premium PDFs
- [ ] Public users cannot upload to storage
- [ ] Authenticated users can only access own data
- [ ] Admins have full access
- [ ] Input validation working on edge functions

### Functional Tests:
- [ ] Form submission works via edge function
- [ ] Processing pipeline completes
- [ ] PDF generation works
- [ ] Admin dashboard works
- [ ] Dark mode works

### Issues Found:
```
Issue 1: _______________________________________________
Issue 2: _______________________________________________
Issue 3: _______________________________________________
```

---

## 🔧 Post-Test Actions

### If Tests Fail:
1. Check edge function logs: `supabase functions logs submit-diagnostic`
2. Check database logs for RLS violations
3. Verify RLS policies are correctly applied
4. Check storage bucket configuration

### If Tests Pass:
1. ✅ Document the test results
2. ✅ Update E2E_TEST_EXECUTION_LOG.md with security validation
3. ✅ Monitor production for any access issues
4. ✅ Consider implementing user authentication for enhanced security

---

## 🚀 Next Steps After Successful E2E

1. **Implement User Authentication** (currently missing)
   - Add signup/login functionality
   - Allow users to view their submission history
   - Enable authenticated PDF downloads

2. **Add Monitoring**
   - Track failed access attempts
   - Monitor RLS policy violations
   - Alert on suspicious activity

3. **Performance Testing**
   - Test with high submission volume
   - Monitor edge function cold starts
   - Check database query performance with RLS

4. **User Experience**
   - Provide submission tracking by ID
   - Email users when PDF is ready with secure download link
   - Create user portal for submission history

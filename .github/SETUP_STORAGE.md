# Storage Bucket Setup Guide

## Overview
The `premium-reports` storage bucket stores generated HTML/PDF analysis reports that are created by the `generate-premium-pdf` edge function.

## Automated Setup (Recommended)

The migration `20251016140000_create_premium_reports_bucket.sql` automatically creates the bucket and RLS policies when applied.

### Via Supabase Dashboard
1. Go to: https://app.supabase.com/project/[YOUR_PROJECT]/database/migrations
2. The migration should auto-apply
3. Verify by checking: https://app.supabase.com/project/[YOUR_PROJECT]/storage/buckets

### Via Supabase CLI
```bash
# Apply all pending migrations
supabase db push

# Verify bucket was created
supabase storage ls
```

## Manual Setup (Fallback)

If the migration fails or you need to create the bucket manually:

### Step 1: Create the Bucket
1. Go to: https://app.supabase.com/project/[YOUR_PROJECT]/storage/buckets
2. Click **"New bucket"**
3. Configure:
   - **Name:** `premium-reports`
   - **Public:** ✅ Yes (reports need public URLs)
   - **File size limit:** 10 MB
   - **Allowed MIME types:**
     - `text/html`
     - `application/pdf`
4. Click **"Create bucket"**

### Step 2: Configure RLS Policies

Navigate to: Storage → premium-reports → Policies

#### Policy 1: Public Read Access
```sql
CREATE POLICY "Public read access to premium reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'premium-reports');
```

#### Policy 2: Service Role Upload
```sql
CREATE POLICY "Service role can upload premium reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'premium-reports'
  AND auth.role() = 'service_role'
);
```

#### Policy 3: Service Role Update
```sql
CREATE POLICY "Service role can update premium reports"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'premium-reports'
  AND auth.role() = 'service_role'
);
```

#### Policy 4: Service Role Delete
```sql
CREATE POLICY "Service role can delete premium reports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'premium-reports'
  AND auth.role() = 'service_role'
);
```

## Verification

### Test Upload (via SQL Editor)
```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'premium-reports';

-- Expected result:
-- id: premium-reports
-- name: premium-reports
-- public: true
-- file_size_limit: 10485760
-- allowed_mime_types: {text/html, application/pdf}
```

### Test Public Access
1. Generate a test report via `/test-pdf` page
2. Copy the generated URL (should look like: `https://[project-ref].supabase.co/storage/v1/object/public/premium-reports/relatorio_premium_*.html`)
3. Open in incognito window (unauthenticated)
4. ✅ Report should load without authentication

### Test Edge Function Upload
```bash
# Via Supabase CLI
curl -X POST "https://[project-ref].supabase.co/functions/v1/generate-premium-pdf" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"submissionId": "[test-uuid]", "analysisData": {...}}'
```

## Troubleshooting

### Error: "Bucket not found"
**Cause:** Migration didn't run or failed
**Fix:**
```bash
supabase db push --dry-run  # Check for errors
supabase db push            # Apply migration
```

### Error: "Row level security policy violation"
**Cause:** RLS policies not applied correctly
**Fix:**
1. Go to Storage → premium-reports → Policies
2. Verify all 4 policies exist
3. If missing, run the SQL commands from Step 2 above

### Error: "File size exceeds limit"
**Cause:** Generated report > 10MB
**Fix:**
```sql
-- Increase limit to 50MB
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'premium-reports';
```

### Error: "MIME type not allowed"
**Cause:** Trying to upload unsupported file type
**Fix:**
```sql
-- Add new MIME type (e.g., for Word docs)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['text/html', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
WHERE id = 'premium-reports';
```

## Cleanup (Optional)

To delete old reports and free up storage:

```sql
-- Delete reports older than 90 days
DELETE FROM storage.objects
WHERE bucket_id = 'premium-reports'
  AND created_at < NOW() - INTERVAL '90 days';

-- Or via Supabase CLI
supabase storage rm premium-reports/relatorio_premium_old_file.html
```

## Security Notes

- ✅ **Public read access is intentional** - users need direct URLs to download reports
- ✅ **Only service_role can write** - prevents unauthorized report uploads
- ✅ **MIME type restrictions** - prevents abuse (e.g., uploading executables)
- ✅ **File size limits** - prevents DoS via large file uploads

## Related Documentation

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [RLS Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [Edge Function: generate-premium-pdf](../supabase/functions/generate-premium-pdf/index.ts)

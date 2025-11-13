-- ============================================
-- SECURITY FIX: Fix storage.objects RLS Policies for premium-reports
-- ============================================

-- Drop the public read policy that allows anyone to download reports
DROP POLICY IF EXISTS "Allow public read access to premium reports" ON storage.objects;

-- Drop the authenticated upload policy (we want service role only for uploads)
DROP POLICY IF EXISTS "Allow authenticated uploads to premium reports" ON storage.objects;

-- Keep the service role policy for managing reports (already exists)
-- This allows edge functions to upload/manage files

-- Create policy for authenticated users to download their own reports
-- Users can download if they own a submission with that report URL
CREATE POLICY "Users can download own premium reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'premium-reports' AND
  (
    -- Check if user owns a submission with this report
    EXISTS (
      SELECT 1 
      FROM public.diagnostic_submissions
      WHERE diagnostic_submissions.premium_report_url LIKE '%' || storage.objects.name
        AND diagnostic_submissions.email = (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
    )
    -- OR user is an admin
    OR public.is_admin(auth.uid())
  )
);

-- Create policy for service role to upload/update reports
CREATE POLICY "Service role can upload premium reports"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'premium-reports');

CREATE POLICY "Service role can update premium reports"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'premium-reports')
WITH CHECK (bucket_id = 'premium-reports');

CREATE POLICY "Service role can delete premium reports"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'premium-reports');
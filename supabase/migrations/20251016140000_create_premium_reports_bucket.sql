-- Migration: Create premium-reports storage bucket
-- Purpose: Store generated HTML/PDF premium analysis reports
-- Created: 2025-10-16

-- =====================================================
-- CREATE STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'premium-reports',
  'premium-reports',
  true, -- Public access for generated reports
  10485760, -- 10MB file size limit
  ARRAY['text/html', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Policy: Anyone can view premium reports (public bucket)
CREATE POLICY "Public read access to premium reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'premium-reports');

-- Policy: Only authenticated service role can upload reports
CREATE POLICY "Service role can upload premium reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'premium-reports'
  AND auth.role() = 'service_role'
);

-- Policy: Only authenticated service role can update reports
CREATE POLICY "Service role can update premium reports"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'premium-reports'
  AND auth.role() = 'service_role'
);

-- Policy: Only authenticated service role can delete reports
CREATE POLICY "Service role can delete premium reports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'premium-reports'
  AND auth.role() = 'service_role'
);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Public read access to premium reports"
ON storage.objects IS
'Allow public read access to generated premium reports - users receive direct URLs';

COMMENT ON POLICY "Service role can upload premium reports"
ON storage.objects IS
'Only edge functions with service role can upload new reports';

-- =====================================================
-- VERIFICATION QUERIES (Run these to test)
-- =====================================================

-- Check bucket exists:
-- SELECT * FROM storage.buckets WHERE id = 'premium-reports';

-- Check policies are applied:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%premium%';

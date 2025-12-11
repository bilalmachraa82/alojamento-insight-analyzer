-- Update premium-reports bucket to allow HTML files
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['application/pdf', 'text/html']::text[]
WHERE id = 'premium-reports';
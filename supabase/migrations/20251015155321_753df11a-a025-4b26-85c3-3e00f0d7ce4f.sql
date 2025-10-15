-- Create storage bucket for premium reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'premium-reports',
  'premium-reports',
  true,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for premium reports bucket
CREATE POLICY "Allow public read access to premium reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'premium-reports');

CREATE POLICY "Allow authenticated uploads to premium reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'premium-reports' AND (storage.foldername(name))[1] != '');

CREATE POLICY "Allow service role to manage premium reports"
ON storage.objects FOR ALL
USING (bucket_id = 'premium-reports');
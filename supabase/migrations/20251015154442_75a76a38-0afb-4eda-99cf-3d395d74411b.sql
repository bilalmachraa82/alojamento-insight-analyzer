-- Create diagnostic_submissions table
CREATE TABLE IF NOT EXISTS public.diagnostic_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  property_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submission_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  property_data JSONB,
  analysis_result JSONB,
  actor_run_id TEXT,
  actor_id TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  premium_report_url TEXT,
  report_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on diagnostic_submissions
ALTER TABLE public.diagnostic_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to diagnostic_submissions"
  ON public.diagnostic_submissions
  FOR SELECT
  USING (true);

-- Create policy to allow public insert
CREATE POLICY "Allow public insert to diagnostic_submissions"
  ON public.diagnostic_submissions
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow public update
CREATE POLICY "Allow public update to diagnostic_submissions"
  ON public.diagnostic_submissions
  FOR UPDATE
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_email ON public.diagnostic_submissions(email);
CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_status ON public.diagnostic_submissions(status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_created_at ON public.diagnostic_submissions(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_diagnostic_submissions_updated_at ON public.diagnostic_submissions;
CREATE TRIGGER update_diagnostic_submissions_updated_at
  BEFORE UPDATE ON public.diagnostic_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
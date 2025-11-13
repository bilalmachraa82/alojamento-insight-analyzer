-- ============================================
-- SECURITY FIX: Remove Public Access to diagnostic_submissions
-- ============================================

-- Drop all public RLS policies
DROP POLICY IF EXISTS "Allow public insert to diagnostic_submissions" ON public.diagnostic_submissions;
DROP POLICY IF EXISTS "Allow public read access to diagnostic_submissions" ON public.diagnostic_submissions;
DROP POLICY IF EXISTS "Allow public update to diagnostic_submissions" ON public.diagnostic_submissions;

-- Create service role policy for INSERT (edge functions only)
CREATE POLICY "Service role can insert submissions"
ON public.diagnostic_submissions
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create service role policy for UPDATE (edge functions only)
CREATE POLICY "Service role can update submissions"
ON public.diagnostic_submissions
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Create authenticated user policy for SELECT (users can view their own submissions by email)
CREATE POLICY "Users can view own submissions by email"
ON public.diagnostic_submissions
FOR SELECT
TO authenticated
USING (email = auth.email());

-- Create admin policy for SELECT (admins can view all submissions)
CREATE POLICY "Admins can view all submissions"
ON public.diagnostic_submissions
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create admin policy for UPDATE (admins can update all submissions)
CREATE POLICY "Admins can update all submissions"
ON public.diagnostic_submissions
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Create admin policy for DELETE (admins can delete submissions)
CREATE POLICY "Admins can delete submissions"
ON public.diagnostic_submissions
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- ============================================
-- SECURITY FIX: Make premium-reports Bucket Private
-- ============================================

-- Make the premium-reports bucket private
UPDATE storage.buckets 
SET public = false 
WHERE name = 'premium-reports';
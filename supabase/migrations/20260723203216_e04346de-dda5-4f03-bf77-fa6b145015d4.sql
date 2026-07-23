
-- 1. Restrict SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.promote_to_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.batch_reset_stuck_submissions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_all_kpi_views() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
-- has_role and is_admin remain executable (used inline by RLS policies for authenticated users)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;

-- 2. Remove overly permissive public policy on fact_pricing_recommendations
-- service_role bypasses RLS, so no replacement policy is needed
DROP POLICY IF EXISTS "Service role can manage pricing recommendations" ON public.fact_pricing_recommendations;

-- 3. Remove overly permissive public policy on storage.objects for premium-reports
DROP POLICY IF EXISTS "Allow service role to manage premium reports" ON storage.objects;

-- 4. Replace email-based ownership check with user_id-based check for premium report downloads
DROP POLICY IF EXISTS "Users can download own premium reports" ON storage.objects;
CREATE POLICY "Users can download own premium reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'premium-reports'
  AND (
    EXISTS (
      SELECT 1 FROM public.diagnostic_submissions ds
      WHERE ds.premium_report_url LIKE ('%' || storage.objects.name)
        AND ds.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  )
);

-- 5. Drop redundant service_role policies with always-true expressions
-- service_role bypasses RLS, so these policies are unnecessary
DROP POLICY IF EXISTS "Service role can manage all properties" ON public.dim_property;
DROP POLICY IF EXISTS "Service role can insert health checks" ON public.system_health_checks;
DROP POLICY IF EXISTS "Service role can insert api usage logs" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Service role can insert submissions" ON public.diagnostic_submissions;
DROP POLICY IF EXISTS "Service role can update submissions" ON public.diagnostic_submissions;

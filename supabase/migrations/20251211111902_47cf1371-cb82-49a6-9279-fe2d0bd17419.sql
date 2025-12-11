-- Fix Security Definer Views issue by recreating public wrapper views with SECURITY INVOKER
-- These views already filter by user_id via auth.uid(), so they're secure

-- 1. Drop and recreate KPI views with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.kpi_daily;
CREATE OR REPLACE VIEW public.kpi_daily
WITH (security_invoker = true) AS
SELECT 
    property_id,
    date,
    rooms_available,
    rooms_sold,
    bookings,
    cancellations,
    occupancy_rate,
    adr,
    revpar,
    trevpar,
    alos,
    drr,
    lbr,
    cancellation_rate
FROM analytics.kpi_daily kd
WHERE EXISTS (
    SELECT 1 FROM dim_property dp 
    WHERE dp.id = kd.property_id 
    AND dp.user_id = auth.uid()
);

DROP VIEW IF EXISTS public.kpi_comp_set_daily;
CREATE OR REPLACE VIEW public.kpi_comp_set_daily
WITH (security_invoker = true) AS
SELECT 
    property_id,
    date,
    ari,
    mpi,
    rgi
FROM analytics.kpi_comp_set_daily kc
WHERE EXISTS (
    SELECT 1 FROM dim_property dp 
    WHERE dp.id = kc.property_id 
    AND dp.user_id = auth.uid()
);

DROP VIEW IF EXISTS public.kpi_channel_daily;
CREATE OR REPLACE VIEW public.kpi_channel_daily
WITH (security_invoker = true) AS
SELECT 
    property_id,
    date,
    channel_id,
    channel_name,
    channel_type,
    room_revenue,
    bookings,
    cancellations,
    acquisition_cost,
    nrevpar
FROM analytics.kpi_channel_daily kch
WHERE EXISTS (
    SELECT 1 FROM dim_property dp 
    WHERE dp.id = kch.property_id 
    AND dp.user_id = auth.uid()
);

-- 2. Fix admin views - restrict to admins only
DROP VIEW IF EXISTS public.admin_submissions_summary;
CREATE OR REPLACE VIEW public.admin_submissions_summary
WITH (security_invoker = true) AS
SELECT 
    count(*) FILTER (WHERE created_at >= now() - interval '30 days') AS total_submissions_30d,
    count(*) FILTER (WHERE status = 'completed' AND created_at >= now() - interval '30 days') AS successful_30d,
    count(*) FILTER (WHERE status = 'failed' AND created_at >= now() - interval '30 days') AS failed_30d,
    count(*) FILTER (WHERE status IN ('pending', 'scraping', 'analyzing')) AS pending_count,
    round(avg(EXTRACT(epoch FROM (updated_at - created_at)) / 60), 2) AS avg_processing_time_minutes
FROM diagnostic_submissions
WHERE created_at >= now() - interval '30 days'
AND public.is_admin(auth.uid());

DROP VIEW IF EXISTS public.admin_error_summary;
CREATE OR REPLACE VIEW public.admin_error_summary
WITH (security_invoker = true) AS
SELECT 
    count(*) FILTER (WHERE severity = 'critical') AS critical_count,
    count(*) FILTER (WHERE severity = 'error') AS error_count,
    count(*) FILTER (WHERE severity = 'warning') AS warning_count,
    count(*) FILTER (WHERE NOT resolved) AS unresolved_count,
    count(DISTINCT error_type) AS unique_error_types
FROM error_logs
WHERE created_at >= now() - interval '7 days'
AND public.is_admin(auth.uid());

DROP VIEW IF EXISTS public.admin_api_usage_summary;
CREATE OR REPLACE VIEW public.admin_api_usage_summary
WITH (security_invoker = true) AS
SELECT 
    service_name,
    count(*) AS total_calls,
    count(*) FILTER (WHERE success) AS successful_calls,
    sum(tokens_used) AS total_tokens,
    sum(cost_usd) AS total_cost_usd,
    round(avg(cost_usd), 6) AS avg_cost_per_call
FROM api_usage_logs
WHERE created_at >= now() - interval '30 days'
AND public.is_admin(auth.uid())
GROUP BY service_name;

-- 3. Create function to batch reprocess stuck submissions
CREATE OR REPLACE FUNCTION public.batch_reset_stuck_submissions()
RETURNS TABLE (
    submission_id uuid,
    old_status text,
    new_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow admins
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can reprocess submissions';
    END IF;

    RETURN QUERY
    UPDATE diagnostic_submissions
    SET 
        status = 'pending',
        error_message = NULL,
        retry_count = 0,
        updated_at = now()
    WHERE status = 'pending_manual_review'
    AND error_message LIKE '%actor%'  -- Only Apify-related failures
    RETURNING 
        id as submission_id,
        'pending_manual_review' as old_status,
        'pending' as new_status;
END;
$$;

-- Grant execute to authenticated users (function checks admin internally)
GRANT EXECUTE ON FUNCTION public.batch_reset_stuck_submissions() TO authenticated;
-- Create user profiles table with roles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create error logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES public.user_profiles(id),
  submission_id UUID REFERENCES public.diagnostic_submissions(id),
  context JSONB DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create admin audit logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.user_profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create API usage tracking table
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL CHECK (service_name IN ('apify', 'claude', 'resend', 'supabase')),
  operation TEXT NOT NULL,
  tokens_used INTEGER,
  cost_usd NUMERIC(10, 4),
  submission_id UUID REFERENCES public.diagnostic_submissions(id),
  user_id UUID REFERENCES public.user_profiles(id),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create system health checks table
CREATE TABLE IF NOT EXISTS public.system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL CHECK (service_name IN ('database', 'edge_functions', 'storage', 'apify', 'claude', 'resend')),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all admin tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON public.user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for error_logs
CREATE POLICY "Only admins can view error logs"
  ON public.error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update error logs"
  ON public.error_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for admin_audit_logs
CREATE POLICY "Only admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for api_usage_logs
CREATE POLICY "Only admins can view API usage logs"
  ON public.api_usage_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert API usage logs"
  ON public.api_usage_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for system_health_checks
CREATE POLICY "Only admins can view system health checks"
  ON public.system_health_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert health checks"
  ON public.system_health_checks FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_service ON public.api_usage_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON public.api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_service ON public.system_health_checks(service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_checked_at ON public.system_health_checks(checked_at DESC);

-- Create admin views for metrics
CREATE OR REPLACE VIEW public.admin_submission_stats AS
SELECT
  DATE(submission_date) as date,
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds,
  COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as error_count,
  COUNT(CASE WHEN retry_count > 0 THEN 1 END) as retry_count
FROM public.diagnostic_submissions
WHERE submission_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(submission_date), status
ORDER BY date DESC, status;

CREATE OR REPLACE VIEW public.admin_error_summary AS
SELECT
  error_type,
  severity,
  COUNT(*) as total_count,
  COUNT(CASE WHEN resolved = false THEN 1 END) as unresolved_count,
  MAX(created_at) as last_occurrence,
  COUNT(DISTINCT user_id) as affected_users
FROM public.error_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY error_type, severity
ORDER BY total_count DESC;

CREATE OR REPLACE VIEW public.admin_user_activity AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT id) as new_signups,
  COUNT(DISTINCT CASE WHEN last_login_at >= CURRENT_DATE - INTERVAL '7 days' THEN id END) as active_users_7d,
  COUNT(DISTINCT CASE WHEN last_login_at >= CURRENT_DATE - INTERVAL '30 days' THEN id END) as active_users_30d,
  COUNT(CASE WHEN is_active = false THEN 1 END) as churned_users
FROM public.user_profiles
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW public.admin_api_usage_summary AS
SELECT
  DATE(created_at) as date,
  service_name,
  COUNT(*) as total_calls,
  COUNT(CASE WHEN success = true THEN 1 END) as successful_calls,
  COUNT(CASE WHEN success = false THEN 1 END) as failed_calls,
  SUM(tokens_used) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  AVG(cost_usd) as avg_cost_per_call
FROM public.api_usage_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), service_name
ORDER BY date DESC, service_name;

CREATE OR REPLACE VIEW public.admin_system_health_latest AS
SELECT DISTINCT ON (service_name)
  service_name,
  status,
  response_time_ms,
  error_message,
  checked_at
FROM public.system_health_checks
ORDER BY service_name, checked_at DESC;

-- Create function to update user profile updated_at
CREATE OR REPLACE FUNCTION public.update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_profile_updated_at();

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.admin_audit_logs (admin_id, action, resource_type, resource_id, old_value, new_value)
    VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      NEW.id::text,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get submission success rate
CREATE OR REPLACE FUNCTION public.get_submission_success_rate(days INTEGER DEFAULT 7)
RETURNS TABLE(
  date DATE,
  total_submissions BIGINT,
  successful_submissions BIGINT,
  failed_submissions BIGINT,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(submission_date) as date,
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_submissions,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_submissions,
    ROUND(
      COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100,
      2
    ) as success_rate
  FROM public.diagnostic_submissions
  WHERE submission_date >= CURRENT_DATE - (days || ' days')::INTERVAL
  GROUP BY DATE(submission_date)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON public.admin_submission_stats TO authenticated;
GRANT SELECT ON public.admin_error_summary TO authenticated;
GRANT SELECT ON public.admin_user_activity TO authenticated;
GRANT SELECT ON public.admin_api_usage_summary TO authenticated;
GRANT SELECT ON public.admin_system_health_latest TO authenticated;

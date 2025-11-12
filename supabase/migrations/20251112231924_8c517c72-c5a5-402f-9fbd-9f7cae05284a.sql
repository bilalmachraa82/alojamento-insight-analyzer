-- =====================================================
-- ADMIN INFRASTRUCTURE MIGRATION
-- Creates complete admin system with proper security
-- =====================================================

-- 1. Create app_role enum (CRITICAL: separate roles table)
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin');

-- 2. Create user_roles table (NEVER store roles in profiles!)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 3. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Create helper function to check if user is admin (any admin role)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'super_admin')
  )
$$;

-- 5. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 7. Create error_logs table
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submission_id UUID REFERENCES diagnostic_submissions(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  context JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_resolved ON public.error_logs(resolved);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all error logs"
  ON public.error_logs FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update error logs"
  ON public.error_logs FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 8. Create admin_audit_logs table
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 9. Create api_usage_logs table
CREATE TABLE public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  tokens_used INTEGER,
  cost_usd NUMERIC(10, 6),
  submission_id UUID REFERENCES diagnostic_submissions(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_usage_logs_service ON public.api_usage_logs(service_name);
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at DESC);

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view api usage logs"
  ON public.api_usage_logs FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can insert api usage logs"
  ON public.api_usage_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 10. Create system_health_checks table
CREATE TABLE public.system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_health_service ON public.system_health_checks(service_name);
CREATE INDEX idx_system_health_created_at ON public.system_health_checks(created_at DESC);

ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system health"
  ON public.system_health_checks FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can insert health checks"
  ON public.system_health_checks FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 11. Create function to automatically assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- 12. Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 13. Create function to promote user to admin (for manual use)
CREATE OR REPLACE FUNCTION public.promote_to_admin(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'User does not exist';
  END IF;

  -- Insert admin role (will be ignored if already exists due to UNIQUE constraint)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Log the action
  INSERT INTO public.admin_audit_logs (admin_id, action, resource_type, resource_id)
  VALUES (auth.uid(), 'promote_to_admin', 'user', _user_id);
END;
$$;

-- 14. Create views for admin dashboard

-- View: Recent submissions summary
CREATE OR REPLACE VIEW public.admin_submissions_summary AS
SELECT
  COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days') as total_submissions_30d,
  COUNT(*) FILTER (WHERE status = 'completed' AND created_at >= now() - interval '30 days') as successful_30d,
  COUNT(*) FILTER (WHERE status = 'failed' AND created_at >= now() - interval '30 days') as failed_30d,
  COUNT(*) FILTER (WHERE status = 'pending' OR status = 'scraping' OR status = 'analyzing') as pending_count,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60)::numeric, 2) as avg_processing_time_minutes
FROM diagnostic_submissions
WHERE created_at >= now() - interval '30 days';

-- View: Error logs summary
CREATE OR REPLACE VIEW public.admin_error_summary AS
SELECT
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
  COUNT(*) FILTER (WHERE severity = 'error') as error_count,
  COUNT(*) FILTER (WHERE severity = 'warning') as warning_count,
  COUNT(*) FILTER (WHERE NOT resolved) as unresolved_count,
  COUNT(DISTINCT error_type) as unique_error_types
FROM error_logs
WHERE created_at >= now() - interval '7 days';

-- View: API usage summary
CREATE OR REPLACE VIEW public.admin_api_usage_summary AS
SELECT
  service_name,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success) as successful_calls,
  SUM(tokens_used) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  ROUND(AVG(cost_usd)::numeric, 6) as avg_cost_per_call
FROM api_usage_logs
WHERE created_at >= now() - interval '30 days'
GROUP BY service_name;

-- 15. Update triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.admin_submissions_summary TO authenticated;
GRANT SELECT ON public.admin_error_summary TO authenticated;
GRANT SELECT ON public.admin_api_usage_summary TO authenticated;
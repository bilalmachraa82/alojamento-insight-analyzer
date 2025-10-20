-- This migration creates a function to easily create admin users
-- Usage: SELECT create_admin_user('email@example.com', 'Full Name', 'admin_user_uuid');

CREATE OR REPLACE FUNCTION public.create_admin_user(
  user_email TEXT,
  user_full_name TEXT DEFAULT NULL,
  user_id UUID DEFAULT NULL,
  user_role TEXT DEFAULT 'admin'
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Use provided UUID or generate new one
  new_user_id := COALESCE(user_id, gen_random_uuid());

  -- Insert or update user profile
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    is_active,
    credits
  )
  VALUES (
    new_user_id,
    user_email,
    COALESCE(user_full_name, user_email),
    user_role,
    true,
    100  -- Give admin users 100 credits by default
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    is_active = true,
    updated_at = now();

  -- Log the admin creation
  INSERT INTO public.admin_audit_logs (
    admin_id,
    action,
    resource_type,
    resource_id,
    new_value
  )
  VALUES (
    new_user_id,
    'CREATE_ADMIN',
    'user_profiles',
    new_user_id::text,
    jsonb_build_object(
      'email', user_email,
      'role', user_role
    )
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for initial setup)
GRANT EXECUTE ON FUNCTION public.create_admin_user(TEXT, TEXT, UUID, TEXT) TO authenticated;

-- Example: Create a test admin user
-- Uncomment and update with your actual user ID from Supabase Auth
-- SELECT create_admin_user('admin@example.com', 'Admin User', 'YOUR_AUTH_USER_UUID', 'super_admin');

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  role TEXT,
  is_admin BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id as user_id,
    up.email,
    up.role,
    (up.role IN ('admin', 'super_admin')) as is_admin
  FROM public.user_profiles up
  WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated;

-- Create a view for admin users (admins only can see this)
CREATE OR REPLACE VIEW public.admin_users AS
SELECT
  id,
  email,
  full_name,
  role,
  is_active,
  credits,
  created_at,
  updated_at,
  last_login_at
FROM public.user_profiles
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at DESC;

-- RLS policy for admin_users view
ALTER VIEW public.admin_users SET (security_barrier = true);

-- Only admins can view admin users
CREATE POLICY "Only admins can view admin users"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    role IN ('admin', 'super_admin') AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Function to promote user to admin (super_admin only)
CREATE OR REPLACE FUNCTION public.promote_to_admin(
  target_user_id UUID,
  new_role TEXT DEFAULT 'admin'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if current user is super_admin
  SELECT role INTO current_user_role
  FROM public.user_profiles
  WHERE id = auth.uid();

  IF current_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can promote users';
  END IF;

  -- Validate new role
  IF new_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin or super_admin';
  END IF;

  -- Update user role
  UPDATE public.user_profiles
  SET
    role = new_role,
    updated_at = now()
  WHERE id = target_user_id;

  -- Log the promotion
  INSERT INTO public.admin_audit_logs (
    admin_id,
    action,
    resource_type,
    resource_id,
    new_value
  )
  VALUES (
    auth.uid(),
    'PROMOTE_USER',
    'user_profiles',
    target_user_id::text,
    jsonb_build_object(
      'new_role', new_role
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.promote_to_admin(UUID, TEXT) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION public.create_admin_user IS 'Creates or updates a user profile with admin role. Logs the action in audit logs.';
COMMENT ON FUNCTION public.check_admin_access IS 'Returns current user information and admin status.';
COMMENT ON FUNCTION public.promote_to_admin IS 'Promotes a user to admin or super_admin role. Only super_admins can use this function.';

-- Allow NULL user_id for system-generated properties (from diagnostics)
ALTER TABLE dim_property 
ALTER COLUMN user_id DROP NOT NULL;

-- Add is_system flag to track auto-created properties
ALTER TABLE dim_property 
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- Update RLS policies to handle NULL user_id (system properties)
DROP POLICY IF EXISTS "Users can view own properties" ON dim_property;
CREATE POLICY "Users can view own properties"
ON dim_property FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_system = true);

DROP POLICY IF EXISTS "Users can insert own properties" ON dim_property;
CREATE POLICY "Users can insert own properties"
ON dim_property FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own properties" ON dim_property;
CREATE POLICY "Users can update own properties"
ON dim_property FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own properties" ON dim_property;
CREATE POLICY "Users can delete own properties"
ON dim_property FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Service role can manage ALL properties (including system ones)
DROP POLICY IF EXISTS "Service role can manage all properties" ON dim_property;
CREATE POLICY "Service role can manage all properties"
ON dim_property FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add helpful comments
COMMENT ON COLUMN dim_property.user_id IS 'User who owns this property. NULL for system-generated properties from diagnostics.';
COMMENT ON COLUMN dim_property.is_system IS 'True if property was auto-created from diagnostic submission (not owned by user).';
-- Add property_id link to diagnostic_submissions
ALTER TABLE diagnostic_submissions 
ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES dim_property(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_property_id 
ON diagnostic_submissions(property_id);

COMMENT ON COLUMN diagnostic_submissions.property_id IS 'Links diagnostic submission to the property in dim_property for analytics data';
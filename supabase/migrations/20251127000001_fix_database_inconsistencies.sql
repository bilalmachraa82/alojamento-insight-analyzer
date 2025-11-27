-- Migration: Fix Database Inconsistencies
-- Date: 2025-11-27
-- Description: Addresses identified gaps in database schema

-- 1. Fix sentiment_score range constraint (standardize to -1 to 1)
-- First check if the constraint exists before trying to modify
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fact_sentiment_topics_sentiment_score_check'
    AND table_name = 'fact_sentiment_topics'
  ) THEN
    ALTER TABLE fact_sentiment_topics
    DROP CONSTRAINT fact_sentiment_topics_sentiment_score_check;
  END IF;
END $$;

-- Add the corrected constraint (range -1 to 1)
ALTER TABLE fact_sentiment_topics
ADD CONSTRAINT fact_sentiment_topics_sentiment_score_check
CHECK (sentiment_score >= -1 AND sentiment_score <= 1);

-- 2. Add missing indexes for better query performance
-- Index for dim_date year_month queries
CREATE INDEX IF NOT EXISTS idx_dim_date_year_month
ON dim_date (year, month);

-- Index for fact_competitor_rates date queries
CREATE INDEX IF NOT EXISTS idx_fact_competitor_rates_date
ON fact_competitor_rates (date DESC);

-- Index for dim_channel active flag
CREATE INDEX IF NOT EXISTS idx_dim_channel_active
ON dim_channel (is_active) WHERE is_active = true;

-- Index for user_sessions active sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_active
ON user_sessions (user_id, expires_at)
WHERE expires_at > NOW();

-- 3. Fix CHECK constraint logic for occupancy (OR should be AND)
-- First remove the old constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chk_fact_daily_occupancy_range'
    AND table_name = 'fact_daily'
  ) THEN
    ALTER TABLE fact_daily
    DROP CONSTRAINT chk_fact_daily_occupancy_range;
  END IF;
END $$;

-- Add the corrected constraint (AND logic instead of OR)
ALTER TABLE fact_daily
ADD CONSTRAINT chk_fact_daily_occupancy_range
CHECK (
  rooms_sold IS NULL
  OR rooms_available IS NULL
  OR (rooms_sold >= 0 AND rooms_available >= 0 AND rooms_sold <= rooms_available)
);

-- 4. Add missing non-negative constraints
DO $$
BEGIN
  -- Add constraint for bookings >= 0 if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chk_fact_daily_bookings_non_negative'
    AND table_name = 'fact_daily'
  ) THEN
    ALTER TABLE fact_daily
    ADD CONSTRAINT chk_fact_daily_bookings_non_negative
    CHECK (bookings IS NULL OR bookings >= 0);
  END IF;
END $$;

-- 5. Ensure email format validation function exists
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Add comment documenting the updated_at trigger function choice
COMMENT ON FUNCTION update_updated_at_column() IS
'Trigger function to automatically update the updated_at column on row changes.
Uses SECURITY DEFINER as defined in migration 20251015155259.';

-- 7. Create helper function for RLS to improve performance
CREATE OR REPLACE FUNCTION user_owns_property(property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM dim_property
    WHERE id = property_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION user_owns_property(UUID) TO authenticated;

-- 8. Add index for diagnostic_submissions processing queries
CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_processing
ON diagnostic_submissions (status, created_at DESC)
WHERE status IN ('pending', 'processing', 'scraping', 'analyzing');

-- 9. Document rating scale standard
COMMENT ON COLUMN fact_reviews.rating IS
'Review rating on a 0-10 scale. Values should be normalized to this scale from platform-specific scales.';

COMMENT ON COLUMN fact_reviews.nps_score IS
'Net Promoter Score on standard 0-10 scale.';

-- 10. Add index for email notifications lookup
CREATE INDEX IF NOT EXISTS idx_email_notifications_lookup
ON email_notifications (email, email_type, created_at DESC);

-- Log the migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251127000001_fix_database_inconsistencies completed successfully';
END $$;

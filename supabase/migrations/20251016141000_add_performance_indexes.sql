-- Migration: Add Performance Indexes and Constraints
-- Purpose: Optimize query performance and enforce data integrity
-- Created: 2025-10-16

-- =====================================================
-- INDEXES: diagnostic_submissions
-- =====================================================

-- Status-based queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_status
ON diagnostic_submissions(status)
WHERE status IS NOT NULL;

-- Platform-based queries
CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_platform
ON diagnostic_submissions(platform)
WHERE platform IS NOT NULL;

-- Email lookups (for user dashboard)
CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_email
ON diagnostic_submissions(email);

-- Date-based queries (recent submissions)
CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_date
ON diagnostic_submissions(submission_date DESC);

-- Composite index for common query pattern (status + date)
CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_status_date
ON diagnostic_submissions(status, submission_date DESC)
WHERE status IS NOT NULL;

-- Updated_at for polling/tracking
CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_updated_at
ON diagnostic_submissions(updated_at DESC)
WHERE updated_at IS NOT NULL;

COMMENT ON INDEX idx_diagnostic_submissions_status IS
'Optimize filtering by status (pending, processing, completed, etc.)';

COMMENT ON INDEX idx_diagnostic_submissions_platform IS
'Optimize filtering by platform (airbnb, booking, vrbo)';

COMMENT ON INDEX idx_diagnostic_submissions_status_date IS
'Optimize dashboard queries showing recent submissions by status';

-- =====================================================
-- INDEXES: fact_daily
-- =====================================================

-- Property + Date composite (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_fact_daily_property_date
ON fact_daily(property_id, date DESC);

-- Date range queries (reporting)
CREATE INDEX IF NOT EXISTS idx_fact_daily_date
ON fact_daily(date DESC);

-- Property lookups
CREATE INDEX IF NOT EXISTS idx_fact_daily_property
ON fact_daily(property_id);

COMMENT ON INDEX idx_fact_daily_property_date IS
'Optimize KPI queries for a specific property over time';

-- =====================================================
-- INDEXES: fact_channel_daily
-- =====================================================

-- Property + Channel + Date (common analytics query)
CREATE INDEX IF NOT EXISTS idx_fact_channel_daily_property_channel_date
ON fact_channel_daily(property_id, channel_id, date DESC);

-- Channel performance queries
CREATE INDEX IF NOT EXISTS idx_fact_channel_daily_channel_date
ON fact_channel_daily(channel_id, date DESC);

COMMENT ON INDEX idx_fact_channel_daily_property_channel_date IS
'Optimize channel performance analysis queries';

-- =====================================================
-- INDEXES: fact_reviews
-- =====================================================

-- Property + Review date
CREATE INDEX IF NOT EXISTS idx_fact_reviews_property_date
ON fact_reviews(property_id, review_date DESC);

-- Rating-based queries (low ratings for alerts)
CREATE INDEX IF NOT EXISTS idx_fact_reviews_rating
ON fact_reviews(rating)
WHERE rating IS NOT NULL;

-- Sentiment analysis queries
CREATE INDEX IF NOT EXISTS idx_fact_reviews_sentiment
ON fact_reviews(sentiment_score DESC NULLS LAST)
WHERE sentiment_score IS NOT NULL;

COMMENT ON INDEX idx_fact_reviews_rating IS
'Optimize queries finding low-rated reviews for alerts';

-- =====================================================
-- INDEXES: dim_property
-- =====================================================

-- User ownership queries (RLS optimization)
CREATE INDEX IF NOT EXISTS idx_dim_property_user
ON dim_property(user_id)
WHERE user_id IS NOT NULL;

-- Active properties only
CREATE INDEX IF NOT EXISTS idx_dim_property_active
ON dim_property(is_active)
WHERE is_active = true;

-- Location-based queries
CREATE INDEX IF NOT EXISTS idx_dim_property_location
ON dim_property(location)
WHERE location IS NOT NULL;

COMMENT ON INDEX idx_dim_property_user IS
'Optimize RLS policy checks for user ownership';

-- =====================================================
-- CHECK CONSTRAINTS: Data Quality
-- =====================================================

-- Ensure ratings are in valid range (0-5 for 5-star scale)
ALTER TABLE fact_reviews
ADD CONSTRAINT IF NOT EXISTS chk_fact_reviews_rating_range
CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

-- Ensure occupancy is percentage (0-100)
ALTER TABLE fact_daily
ADD CONSTRAINT IF NOT EXISTS chk_fact_daily_occupancy_range
CHECK (rooms_sold IS NULL OR rooms_available IS NULL OR rooms_sold <= rooms_available);

-- Ensure revenue values are non-negative
ALTER TABLE fact_daily
ADD CONSTRAINT IF NOT EXISTS chk_fact_daily_revenue_positive
CHECK (
  (room_revenue IS NULL OR room_revenue >= 0) AND
  (total_revenue IS NULL OR total_revenue >= 0) AND
  (direct_revenue IS NULL OR direct_revenue >= 0)
);

-- Ensure bookings are non-negative
ALTER TABLE fact_daily
ADD CONSTRAINT IF NOT EXISTS chk_fact_daily_bookings_positive
CHECK (bookings IS NULL OR bookings >= 0);

-- Ensure channel revenue is non-negative
ALTER TABLE fact_channel_daily
ADD CONSTRAINT IF NOT EXISTS chk_fact_channel_daily_revenue_positive
CHECK (room_revenue IS NULL OR room_revenue >= 0);

COMMENT ON CONSTRAINT chk_fact_reviews_rating_range ON fact_reviews IS
'Enforce 5-star rating scale (0.0 to 5.0)';

COMMENT ON CONSTRAINT chk_fact_daily_revenue_positive ON fact_daily IS
'Prevent negative revenue values (data quality)';

-- =====================================================
-- FOREIGN KEY CONSTRAINTS (if not already present)
-- =====================================================

-- Note: These may already exist from previous migrations
-- Using DO blocks to add them only if missing

DO $$
BEGIN
  -- fact_daily -> dim_property
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_fact_daily_property'
  ) THEN
    ALTER TABLE fact_daily
    ADD CONSTRAINT fk_fact_daily_property
    FOREIGN KEY (property_id) REFERENCES dim_property(property_id)
    ON DELETE CASCADE;
  END IF;

  -- fact_channel_daily -> dim_property
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_fact_channel_daily_property'
  ) THEN
    ALTER TABLE fact_channel_daily
    ADD CONSTRAINT fk_fact_channel_daily_property
    FOREIGN KEY (property_id) REFERENCES dim_property(property_id)
    ON DELETE CASCADE;
  END IF;

  -- fact_channel_daily -> dim_channel
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_fact_channel_daily_channel'
  ) THEN
    ALTER TABLE fact_channel_daily
    ADD CONSTRAINT fk_fact_channel_daily_channel
    FOREIGN KEY (channel_id) REFERENCES dim_channel(id)
    ON DELETE RESTRICT;
  END IF;

  -- fact_reviews -> dim_property
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_fact_reviews_property'
  ) THEN
    ALTER TABLE fact_reviews
    ADD CONSTRAINT fk_fact_reviews_property
    FOREIGN KEY (property_id) REFERENCES dim_property(property_id)
    ON DELETE CASCADE;
  END IF;

END $$;

-- =====================================================
-- ANALYZE TABLES (update statistics for query planner)
-- =====================================================

ANALYZE diagnostic_submissions;
ANALYZE fact_daily;
ANALYZE fact_channel_daily;
ANALYZE fact_reviews;
ANALYZE dim_property;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check indexes were created:
-- SELECT tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('diagnostic_submissions', 'fact_daily', 'fact_channel_daily', 'fact_reviews', 'dim_property')
-- ORDER BY tablename, indexname;

-- Check constraints were created:
-- SELECT conname, contype, conrelid::regclass, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid IN ('fact_daily'::regclass, 'fact_reviews'::regclass, 'fact_channel_daily'::regclass)
-- ORDER BY conrelid::regclass::text, conname;

-- =====================================================
-- PERFORMANCE MONITORING
-- =====================================================

COMMENT ON SCHEMA public IS
'Indexes and constraints added for performance optimization and data integrity';

-- To monitor index usage over time, run:
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan,
--   idx_tup_read,
--   idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Migration: Row Level Security Policies
-- Phase 0: Security Layer
-- Created: 2025-10-16

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all dimension tables
ALTER TABLE dim_property ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_competitor ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_event ENABLE ROW LEVEL SECURITY;

-- Enable RLS on all fact tables
ALTER TABLE fact_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_channel_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_competitor_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_sentiment_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_goals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: dim_property
-- =====================================================

-- Users can view their own properties
CREATE POLICY "Users can view own properties"
ON dim_property FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own properties
CREATE POLICY "Users can insert own properties"
ON dim_property FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own properties
CREATE POLICY "Users can update own properties"
ON dim_property FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own properties
CREATE POLICY "Users can delete own properties"
ON dim_property FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- POLICIES: fact_daily
-- =====================================================

-- Users can view fact_daily for their properties
CREATE POLICY "Users can view own fact_daily"
ON fact_daily FOR SELECT
USING (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

-- Users can insert fact_daily for their properties
CREATE POLICY "Users can insert own fact_daily"
ON fact_daily FOR INSERT
WITH CHECK (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

-- Users can update fact_daily for their properties
CREATE POLICY "Users can update own fact_daily"
ON fact_daily FOR UPDATE
USING (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

-- Users can delete fact_daily for their properties
CREATE POLICY "Users can delete own fact_daily"
ON fact_daily FOR DELETE
USING (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- POLICIES: fact_channel_daily
-- =====================================================

CREATE POLICY "Users can view own fact_channel_daily"
ON fact_channel_daily FOR SELECT
USING (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own fact_channel_daily"
ON fact_channel_daily FOR INSERT
WITH CHECK (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update own fact_channel_daily"
ON fact_channel_daily FOR UPDATE
USING (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete own fact_channel_daily"
ON fact_channel_daily FOR DELETE
USING (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- POLICIES: fact_competitor_rates
-- =====================================================

CREATE POLICY "Users can view own fact_competitor_rates"
ON fact_competitor_rates FOR SELECT
USING (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own fact_competitor_rates"
ON fact_competitor_rates FOR INSERT
WITH CHECK (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- POLICIES: fact_reviews
-- =====================================================

CREATE POLICY "Users can view own fact_reviews"
ON fact_reviews FOR SELECT
USING (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own fact_reviews"
ON fact_reviews FOR INSERT
WITH CHECK (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update own fact_reviews"
ON fact_reviews FOR UPDATE
USING (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- POLICIES: fact_sentiment_topics
-- =====================================================

CREATE POLICY "Users can view own fact_sentiment_topics"
ON fact_sentiment_topics FOR SELECT
USING (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own fact_sentiment_topics"
ON fact_sentiment_topics FOR INSERT
WITH CHECK (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- POLICIES: fact_goals
-- =====================================================

CREATE POLICY "Users can view own fact_goals"
ON fact_goals FOR SELECT
USING (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own fact_goals"
ON fact_goals FOR INSERT
WITH CHECK (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
);

CREATE POLICY "Users can update own fact_goals"
ON fact_goals FOR UPDATE
USING (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
);

CREATE POLICY "Users can delete own fact_goals"
ON fact_goals FOR DELETE
USING (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
);

-- =====================================================
-- POLICIES: dim_competitor (Shared access)
-- =====================================================

-- Users can view competitors for their market
CREATE POLICY "Users can view competitors in their market"
ON dim_competitor FOR SELECT
USING (
    market_id IN (
        SELECT DISTINCT market_id FROM dim_property WHERE user_id = auth.uid()
    )
);

-- Users can add competitors to their market
CREATE POLICY "Users can insert competitors in their market"
ON dim_competitor FOR INSERT
WITH CHECK (
    market_id IN (
        SELECT DISTINCT market_id FROM dim_property WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- POLICIES: dim_event (Shared access)
-- =====================================================

-- Users can view events in their market
CREATE POLICY "Users can view events in their market"
ON dim_event FOR SELECT
USING (
    market_id IN (
        SELECT DISTINCT market_id FROM dim_property WHERE user_id = auth.uid()
    )
);

-- Users can add events to their market
CREATE POLICY "Users can insert events in their market"
ON dim_event FOR INSERT
WITH CHECK (
    market_id IN (
        SELECT DISTINCT market_id FROM dim_property WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- PUBLIC TABLES (No RLS needed)
-- =====================================================

-- dim_date is public (calendar data)
-- dim_channel is public (channel reference data)

-- =====================================================
-- HELPER FUNCTION: Check property ownership
-- =====================================================

CREATE OR REPLACE FUNCTION user_owns_property(p_property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM dim_property 
        WHERE property_id = p_property_id 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION user_owns_property IS 'Helper function to check if current user owns a property';

-- =====================================================
-- GRANTS: Public read access to reference tables
-- =====================================================

GRANT SELECT ON dim_date TO anon, authenticated;
GRANT SELECT ON dim_channel TO anon, authenticated;

-- =====================================================
-- GRANTS: Authenticated users can access their data
-- =====================================================

GRANT ALL ON dim_property TO authenticated;
GRANT ALL ON dim_competitor TO authenticated;
GRANT ALL ON dim_event TO authenticated;
GRANT ALL ON fact_daily TO authenticated;
GRANT ALL ON fact_channel_daily TO authenticated;
GRANT ALL ON fact_competitor_rates TO authenticated;
GRANT ALL ON fact_reviews TO authenticated;
GRANT ALL ON fact_sentiment_topics TO authenticated;
GRANT ALL ON fact_goals TO authenticated;

-- =====================================================
-- GRANTS: Materialized views (read-only)
-- =====================================================

GRANT SELECT ON kpi_daily TO authenticated;
GRANT SELECT ON kpi_aggregated TO authenticated;
GRANT SELECT ON kpi_comp_set_daily TO authenticated;
GRANT SELECT ON kpi_channel_daily TO authenticated;
GRANT SELECT ON kpi_guest_experience_daily TO authenticated;

-- =====================================================

COMMENT ON SCHEMA public IS 'RLS policies configured - users can only access their own property data';

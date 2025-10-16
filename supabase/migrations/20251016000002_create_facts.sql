-- Migration: Create Star Schema - Facts
-- Phase 0: Foundation Data Model
-- Created: 2025-10-16

-- =====================================================
-- FACTOS (Facts)
-- =====================================================

-- Facto: Performance Diária (grão: property + date)
CREATE TABLE IF NOT EXISTS fact_daily (
    property_id UUID NOT NULL REFERENCES dim_property(property_id) ON DELETE CASCADE,
    date DATE NOT NULL REFERENCES dim_date(date),
    
    -- Inventory Metrics
    rooms_available INT NOT NULL CHECK (rooms_available >= 0),
    rooms_sold INT NOT NULL CHECK (rooms_sold >= 0 AND rooms_sold <= rooms_available),
    
    -- Revenue Metrics
    room_revenue DECIMAL(12, 2) NOT NULL CHECK (room_revenue >= 0),
    total_revenue DECIMAL(12, 2) NOT NULL CHECK (total_revenue >= room_revenue),
    direct_revenue DECIMAL(12, 2) DEFAULT 0 CHECK (direct_revenue >= 0),
    
    -- Cost Metrics
    room_cost DECIMAL(12, 2) DEFAULT 0 CHECK (room_cost >= 0),
    operating_expenses DECIMAL(12, 2) DEFAULT 0 CHECK (operating_expenses >= 0),
    
    -- Demand Metrics
    bookings INT DEFAULT 0 CHECK (bookings >= 0),
    cancellations INT DEFAULT 0 CHECK (cancellations >= 0),
    searches INT DEFAULT 0 CHECK (searches >= 0),
    views INT DEFAULT 0 CHECK (views >= 0),
    inquiries INT DEFAULT 0 CHECK (inquiries >= 0),
    
    -- Additional Metrics
    average_length_of_stay DECIMAL(5, 2),
    guest_count INT DEFAULT 0,
    
    -- Metadata
    data_source TEXT DEFAULT 'manual', -- 'manual', 'pms', 'api', 'scraper'
    data_quality_score DECIMAL(3, 2) DEFAULT 1.00 CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (property_id, date)
);

CREATE INDEX idx_fact_daily_property_date ON fact_daily(property_id, date DESC);
CREATE INDEX idx_fact_daily_date ON fact_daily(date DESC);
CREATE INDEX idx_fact_daily_property ON fact_daily(property_id);

COMMENT ON TABLE fact_daily IS 'Facto de performance diária por propriedade';
COMMENT ON COLUMN fact_daily.data_quality_score IS 'Score de qualidade dos dados: 1=completo, 0=estimado';

-- =====================================================

-- Facto: Performance por Canal (grão: property + date + channel)
CREATE TABLE IF NOT EXISTS fact_channel_daily (
    property_id UUID NOT NULL,
    date DATE NOT NULL,
    channel_id UUID NOT NULL REFERENCES dim_channel(channel_id),
    
    -- Revenue Metrics
    room_revenue DECIMAL(12, 2) NOT NULL CHECK (room_revenue >= 0),
    total_revenue DECIMAL(12, 2) DEFAULT 0 CHECK (total_revenue >= 0),
    
    -- Booking Metrics
    bookings INT NOT NULL CHECK (bookings >= 0),
    cancellations INT DEFAULT 0 CHECK (cancellations >= 0),
    rooms_sold INT DEFAULT 0 CHECK (rooms_sold >= 0),
    
    -- Cost Metrics
    acquisition_cost DECIMAL(12, 2) DEFAULT 0 CHECK (acquisition_cost >= 0),
    commission_paid DECIMAL(12, 2) DEFAULT 0 CHECK (commission_paid >= 0),
    
    -- Additional Metrics
    inquiries INT DEFAULT 0,
    conversion_rate DECIMAL(5, 4), -- bookings / inquiries
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (property_id, date, channel_id),
    FOREIGN KEY (property_id, date) REFERENCES fact_daily(property_id, date) ON DELETE CASCADE
);

CREATE INDEX idx_fact_channel_property_date ON fact_channel_daily(property_id, date DESC);
CREATE INDEX idx_fact_channel_channel ON fact_channel_daily(channel_id, date DESC);

COMMENT ON TABLE fact_channel_daily IS 'Facto de performance por canal de distribuição';

-- =====================================================

-- Facto: Rates dos Competidores (grão: property + date + competitor)
CREATE TABLE IF NOT EXISTS fact_competitor_rates (
    property_id UUID NOT NULL REFERENCES dim_property(property_id) ON DELETE CASCADE,
    date DATE NOT NULL REFERENCES dim_date(date),
    competitor_id UUID NOT NULL REFERENCES dim_competitor(competitor_id) ON DELETE CASCADE,
    
    -- Competitor Metrics
    adr_comp DECIMAL(12, 2) CHECK (adr_comp >= 0),
    occupancy_comp DECIMAL(5, 2) CHECK (occupancy_comp >= 0 AND occupancy_comp <= 100),
    revpar_comp DECIMAL(12, 2) CHECK (revpar_comp >= 0),
    rating_comp DECIMAL(3, 2) CHECK (rating_comp >= 0 AND rating_comp <= 5),
    review_count_comp INT DEFAULT 0,
    
    -- Availability
    available BOOLEAN,
    min_stay INT,
    
    -- Metadata
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    data_source TEXT DEFAULT 'scraper', -- 'scraper', 'api', 'manual'
    data_quality TEXT DEFAULT 'good' CHECK (data_quality IN ('excellent', 'good', 'fair', 'poor')),
    
    PRIMARY KEY (property_id, date, competitor_id)
);

CREATE INDEX idx_fact_comp_rates_property_date ON fact_competitor_rates(property_id, date DESC);
CREATE INDEX idx_fact_comp_rates_competitor ON fact_competitor_rates(competitor_id, date DESC);

COMMENT ON TABLE fact_competitor_rates IS 'Facto de rates e métricas dos competidores';

-- =====================================================

-- Facto: Reviews (grão: review individual)
CREATE TABLE IF NOT EXISTS fact_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES dim_property(property_id) ON DELETE CASCADE,
    date DATE NOT NULL REFERENCES dim_date(date),
    
    -- Review Details
    platform TEXT NOT NULL, -- 'airbnb', 'booking', 'google', etc.
    guest_name TEXT,
    guest_country TEXT,
    
    -- Ratings
    rating DECIMAL(3, 2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    cleanliness_rating DECIMAL(3, 2) CHECK (cleanliness_rating >= 0 AND cleanliness_rating <= 5),
    accuracy_rating DECIMAL(3, 2) CHECK (accuracy_rating >= 0 AND accuracy_rating <= 5),
    communication_rating DECIMAL(3, 2) CHECK (communication_rating >= 0 AND communication_rating <= 5),
    location_rating DECIMAL(3, 2) CHECK (location_rating >= 0 AND location_rating <= 5),
    checkin_rating DECIMAL(3, 2) CHECK (checkin_rating >= 0 AND checkin_rating <= 5),
    value_rating DECIMAL(3, 2) CHECK (value_rating >= 0 AND value_rating <= 5),
    
    -- Review Content
    review_text TEXT,
    review_language TEXT DEFAULT 'pt',
    
    -- Guest Experience Metrics
    nps_score INT CHECK (nps_score >= 0 AND nps_score <= 10),
    csat_score INT CHECK (csat_score >= 0 AND csat_score <= 10),
    ces_score INT CHECK (ces_score >= 0 AND ces_score <= 10),
    
    -- Response Metrics
    responded BOOLEAN DEFAULT FALSE,
    response_text TEXT,
    response_time_hours DECIMAL(8, 2),
    response_date TIMESTAMPTZ,
    
    -- Stay Details
    stay_date DATE,
    length_of_stay INT,
    is_repeat_guest BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    external_review_id TEXT,
    scraped_at TIMESTAMPTZ,
    sentiment_analyzed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fact_reviews_property_date ON fact_reviews(property_id, date DESC);
CREATE INDEX idx_fact_reviews_platform ON fact_reviews(platform, date DESC);
CREATE INDEX idx_fact_reviews_rating ON fact_reviews(rating);
CREATE INDEX idx_fact_reviews_nps ON fact_reviews(nps_score);

COMMENT ON TABLE fact_reviews IS 'Facto de reviews e avaliações de hóspedes';
COMMENT ON COLUMN fact_reviews.nps_score IS 'Net Promoter Score: likelihood to recommend (0-10)';
COMMENT ON COLUMN fact_reviews.csat_score IS 'Customer Satisfaction Score (0-10)';
COMMENT ON COLUMN fact_reviews.ces_score IS 'Customer Effort Score (0-10)';

-- =====================================================

-- Facto: Sentiment por Tópico (grão: property + date + platform + topic)
CREATE TABLE IF NOT EXISTS fact_sentiment_topics (
    property_id UUID NOT NULL REFERENCES dim_property(property_id) ON DELETE CASCADE,
    date DATE NOT NULL REFERENCES dim_date(date),
    platform TEXT NOT NULL,
    topic TEXT NOT NULL CHECK (topic IN ('cleanliness', 'comfort', 'location', 'communication', 'amenities', 'value', 'noise', 'wifi', 'parking', 'checkin', 'overall')),
    
    -- Sentiment Metrics
    sentiment_score DECIMAL(4, 3) NOT NULL CHECK (sentiment_score >= 0 AND sentiment_score <= 1), -- 0=negative, 0.5=neutral, 1=positive
    sentiment_category TEXT CHECK (sentiment_category IN ('positive', 'neutral', 'negative')),
    mention_count INT DEFAULT 1 CHECK (mention_count >= 0),
    positive_mentions INT DEFAULT 0,
    negative_mentions INT DEFAULT 0,
    
    -- Aggregated Keywords
    keywords TEXT[], -- array of top keywords for this topic
    sample_quotes TEXT[], -- array of example quotes
    
    -- Metadata
    confidence_score DECIMAL(3, 2) DEFAULT 0.75 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    model_version TEXT,
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (property_id, date, platform, topic)
);

CREATE INDEX idx_fact_sentiment_property_date ON fact_sentiment_topics(property_id, date DESC);
CREATE INDEX idx_fact_sentiment_topic ON fact_sentiment_topics(topic, date DESC);
CREATE INDEX idx_fact_sentiment_score ON fact_sentiment_topics(sentiment_score);

COMMENT ON TABLE fact_sentiment_topics IS 'Facto de sentiment analysis por tópico dos reviews';
COMMENT ON COLUMN fact_sentiment_topics.sentiment_score IS '0=muito negativo, 0.5=neutro, 1=muito positivo';

-- =====================================================

-- Facto: Metas e Objetivos (grão: property + metric + period)
CREATE TABLE IF NOT EXISTS fact_goals (
    goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES dim_property(property_id) ON DELETE CASCADE,
    
    -- Goal Details
    metric_name TEXT NOT NULL, -- 'revpar', 'occupancy', 'adr', 'nps', 'rgi', etc.
    metric_category TEXT CHECK (metric_category IN ('revenue', 'guest_experience', 'operational', 'market_position')),
    
    -- Target & Timeline
    current_value DECIMAL(12, 2),
    target_value DECIMAL(12, 2) NOT NULL,
    start_date DATE NOT NULL,
    deadline DATE NOT NULL,
    
    -- Progress Tracking
    progress_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on-track', 'at-risk', 'achieved', 'missed', 'cancelled')),
    
    -- SMART Goal Details
    specific_description TEXT NOT NULL,
    measurement_frequency TEXT DEFAULT 'daily' CHECK (measurement_frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
    is_achievable BOOLEAN DEFAULT TRUE,
    relevance_notes TEXT,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    achieved_at TIMESTAMPTZ,
    
    CONSTRAINT valid_timeline CHECK (deadline > start_date)
);

CREATE INDEX idx_fact_goals_property ON fact_goals(property_id);
CREATE INDEX idx_fact_goals_status ON fact_goals(status, deadline);
CREATE INDEX idx_fact_goals_metric ON fact_goals(metric_name);

COMMENT ON TABLE fact_goals IS 'Facto de metas SMART e tracking de objetivos';

-- =====================================================

-- Triggers para updated_at
CREATE TRIGGER update_fact_daily_updated_at BEFORE UPDATE ON fact_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fact_channel_daily_updated_at BEFORE UPDATE ON fact_channel_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fact_goals_updated_at BEFORE UPDATE ON fact_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration: Create Star Schema - Dimensions
-- Phase 0: Foundation Data Model
-- Created: 2025-10-16

-- =====================================================
-- DIMENSÕES (Dimensions)
-- =====================================================

-- Dimensão: Propriedades
CREATE TABLE IF NOT EXISTS dim_property (
    property_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    property_type TEXT,
    room_count INT,
    max_guests INT,
    bedrooms INT,
    bathrooms INT,
    location TEXT,
    city TEXT,
    country TEXT DEFAULT 'Portugal',
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    property_url TEXT,
    amenities JSONB DEFAULT '{}',
    photos TEXT[] DEFAULT ARRAY[]::TEXT[],
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dim_property_user ON dim_property(user_id);
CREATE INDEX idx_dim_property_market ON dim_property(market_id);
CREATE INDEX idx_dim_property_location ON dim_property(location);

COMMENT ON TABLE dim_property IS 'Dimensão de propriedades - alojamentos geridos';
COMMENT ON COLUMN dim_property.market_id IS 'Identificador do mercado/região para benchmarking';

-- =====================================================

-- Dimensão: Datas (pre-populated para 5 anos)
CREATE TABLE IF NOT EXISTS dim_date (
    date DATE PRIMARY KEY,
    day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    day_name TEXT,
    week INT,
    month INT CHECK (month >= 1 AND month <= 12),
    month_name TEXT,
    quarter INT CHECK (quarter >= 1 AND quarter <= 4),
    year INT,
    is_weekend BOOLEAN,
    is_holiday BOOLEAN DEFAULT FALSE,
    holiday_name TEXT,
    season TEXT CHECK (season IN ('spring', 'summer', 'fall', 'winter'))
);

COMMENT ON TABLE dim_date IS 'Dimensão temporal - calendário com 5 anos de dados';

-- Populate date dimension (2023-2028)
INSERT INTO dim_date (date, day_of_week, day_name, week, month, month_name, quarter, year, is_weekend, season)
SELECT 
    d::date,
    EXTRACT(DOW FROM d)::int,
    TO_CHAR(d, 'Day'),
    EXTRACT(WEEK FROM d)::int,
    EXTRACT(MONTH FROM d)::int,
    TO_CHAR(d, 'Month'),
    EXTRACT(QUARTER FROM d)::int,
    EXTRACT(YEAR FROM d)::int,
    EXTRACT(DOW FROM d) IN (0, 6),
    CASE 
        WHEN EXTRACT(MONTH FROM d) IN (3, 4, 5) THEN 'spring'
        WHEN EXTRACT(MONTH FROM d) IN (6, 7, 8) THEN 'summer'
        WHEN EXTRACT(MONTH FROM d) IN (9, 10, 11) THEN 'fall'
        ELSE 'winter'
    END
FROM generate_series(
    '2023-01-01'::date,
    '2028-12-31'::date,
    '1 day'::interval
) AS d
ON CONFLICT (date) DO NOTHING;

-- =====================================================

-- Dimensão: Canais de Distribuição
CREATE TABLE IF NOT EXISTS dim_channel (
    channel_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('OTA', 'Direct', 'Wholesale')) NOT NULL,
    commission_rate DECIMAL(5, 4) DEFAULT 0.15,
    currency_code TEXT DEFAULT 'EUR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE dim_channel IS 'Dimensão de canais de distribuição/venda';
COMMENT ON COLUMN dim_channel.commission_rate IS 'Taxa de comissão do canal (0.15 = 15%)';

-- Pre-populate common channels
INSERT INTO dim_channel (channel_code, name, type, commission_rate) VALUES
    ('airbnb', 'Airbnb', 'OTA', 0.15),
    ('booking', 'Booking.com', 'OTA', 0.15),
    ('vrbo', 'Vrbo', 'OTA', 0.10),
    ('expedia', 'Expedia', 'OTA', 0.18),
    ('direct-web', 'Website Directo', 'Direct', 0.00),
    ('direct-phone', 'Telefone Directo', 'Direct', 0.00),
    ('direct-email', 'Email Directo', 'Direct', 0.00)
ON CONFLICT (channel_code) DO NOTHING;

-- =====================================================

-- Dimensão: Competidores (Comp Set)
CREATE TABLE IF NOT EXISTS dim_competitor (
    competitor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID,
    name TEXT NOT NULL,
    property_url TEXT,
    property_type TEXT,
    room_count INT,
    distance_km DECIMAL(6, 2),
    location TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    is_active BOOLEAN DEFAULT TRUE,
    last_scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dim_competitor_market ON dim_competitor(market_id);
CREATE INDEX idx_dim_competitor_location ON dim_competitor(location);

COMMENT ON TABLE dim_competitor IS 'Dimensão de competidores para benchmarking';
COMMENT ON COLUMN dim_competitor.distance_km IS 'Distância em km da propriedade principal';

-- =====================================================

-- Dimensão: Eventos Locais
CREATE TABLE IF NOT EXISTS dim_event (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    event_type TEXT CHECK (event_type IN ('conference', 'festival', 'sports', 'holiday', 'concert', 'fair', 'other')),
    impact_score DECIMAL(3, 2) DEFAULT 0.00 CHECK (impact_score >= 0 AND impact_score <= 1), -- 0-1 multiplicador
    location TEXT,
    source TEXT, -- 'manual', 'api', 'scraped'
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dim_event_dates ON dim_event(market_id, start_date, end_date);
CREATE INDEX idx_dim_event_market ON dim_event(market_id);

COMMENT ON TABLE dim_event IS 'Dimensão de eventos locais que afectam demanda';
COMMENT ON COLUMN dim_event.impact_score IS 'Impacto esperado na demanda: 0=nenhum, 1=duplica demanda';

-- =====================================================

-- Trigger para updated_at em todas as dimensões
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dim_property_updated_at BEFORE UPDATE ON dim_property
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dim_channel_updated_at BEFORE UPDATE ON dim_channel
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dim_competitor_updated_at BEFORE UPDATE ON dim_competitor
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dim_event_updated_at BEFORE UPDATE ON dim_event
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

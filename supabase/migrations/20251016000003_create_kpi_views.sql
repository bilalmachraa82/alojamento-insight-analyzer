-- Migration: Create KPI Materialized Views
-- Phase 0: Analytics Layer
-- Created: 2025-10-16

-- =====================================================
-- VIEWS MATERIALIZADAS DE KPIs
-- =====================================================

-- View: KPIs Diários Core
CREATE MATERIALIZED VIEW IF NOT EXISTS kpi_daily AS
SELECT 
    f.property_id,
    f.date,
    p.name as property_name,
    p.location,
    p.property_type,
    
    -- Core Performance Metrics
    ROUND(f.rooms_sold::DECIMAL / NULLIF(f.rooms_available, 0) * 100, 2) as occupancy_rate,
    ROUND(f.room_revenue / NULLIF(f.rooms_sold, 0), 2) as adr,
    ROUND(f.room_revenue / NULLIF(f.rooms_available, 0), 2) as revpar,
    ROUND(f.total_revenue / NULLIF(f.rooms_available, 0), 2) as trevpar,
    ROUND(f.room_cost / NULLIF(f.rooms_sold, 0), 2) as cpor,
    ROUND(f.rooms_sold::DECIMAL / NULLIF(f.bookings, 0), 2) as alos,
    
    -- Distribution Metrics
    ROUND(f.direct_revenue::DECIMAL / NULLIF(f.room_revenue, 0) * 100, 2) as drr,
    ROUND(f.bookings::DECIMAL / NULLIF(f.searches, 0) * 100, 2) as lbr,
    ROUND(f.cancellations::DECIMAL / NULLIF(f.bookings, 0) * 100, 2) as cancellation_rate,
    
    -- Conversion Metrics
    ROUND(f.bookings::DECIMAL / NULLIF(f.inquiries, 0) * 100, 2) as inquiry_to_booking_rate,
    ROUND(f.bookings::DECIMAL / NULLIF(f.views, 0) * 100, 2) as view_to_booking_rate,
    
    -- Profitability (if cost data available)
    ROUND((f.room_revenue - f.room_cost) / NULLIF(f.rooms_available, 0), 2) as goppar,
    ROUND((f.total_revenue - f.operating_expenses) / NULLIF(f.rooms_available, 0), 2) as noi_par,
    
    -- Raw Metrics for further calculations
    f.rooms_available,
    f.rooms_sold,
    f.room_revenue,
    f.total_revenue,
    f.direct_revenue,
    f.room_cost,
    f.operating_expenses,
    f.bookings,
    f.cancellations,
    f.searches,
    f.views,
    f.inquiries,
    f.guest_count,
    f.average_length_of_stay,
    
    -- Data Quality
    f.data_quality_score,
    f.data_source,
    
    -- Metadata
    d.day_of_week,
    d.is_weekend,
    d.is_holiday,
    d.season,
    d.month_name,
    
    f.updated_at
FROM fact_daily f
JOIN dim_property p ON p.property_id = f.property_id
JOIN dim_date d ON d.date = f.date
WHERE p.is_active = TRUE;

-- Indices para performance
CREATE UNIQUE INDEX idx_kpi_daily_pk ON kpi_daily(property_id, date);
CREATE INDEX idx_kpi_daily_property ON kpi_daily(property_id, date DESC);
CREATE INDEX idx_kpi_daily_date ON kpi_daily(date DESC);
CREATE INDEX idx_kpi_daily_location ON kpi_daily(location, date DESC);

COMMENT ON MATERIALIZED VIEW kpi_daily IS 'KPIs core diários: ADR, RevPAR, Occupancy, ALOS, TRevPAR, DRR, LBR';

-- =====================================================

-- View: KPIs Agregados por Período (MTD, YTD, etc.)
CREATE MATERIALIZED VIEW IF NOT EXISTS kpi_aggregated AS
WITH monthly_agg AS (
    SELECT 
        property_id,
        property_name,
        EXTRACT(YEAR FROM date) as year,
        EXTRACT(MONTH FROM date) as month,
        'monthly' as period_type,
        MIN(date) as period_start,
        MAX(date) as period_end,
        
        -- Aggregated Metrics
        SUM(rooms_available) as total_rooms_available,
        SUM(rooms_sold) as total_rooms_sold,
        SUM(room_revenue) as total_room_revenue,
        SUM(total_revenue) as total_revenue,
        SUM(direct_revenue) as total_direct_revenue,
        SUM(bookings) as total_bookings,
        SUM(cancellations) as total_cancellations,
        
        -- Calculated KPIs
        ROUND(SUM(rooms_sold)::DECIMAL / NULLIF(SUM(rooms_available), 0) * 100, 2) as avg_occupancy_rate,
        ROUND(SUM(room_revenue) / NULLIF(SUM(rooms_sold), 0), 2) as avg_adr,
        ROUND(SUM(room_revenue) / NULLIF(SUM(rooms_available), 0), 2) as avg_revpar,
        ROUND(SUM(total_revenue) / NULLIF(SUM(rooms_available), 0), 2) as avg_trevpar,
        ROUND(SUM(direct_revenue)::DECIMAL / NULLIF(SUM(room_revenue), 0) * 100, 2) as avg_drr,
        ROUND(SUM(cancellations)::DECIMAL / NULLIF(SUM(bookings), 0) * 100, 2) as avg_cancellation_rate,
        
        COUNT(*) as days_in_period,
        AVG(data_quality_score) as avg_data_quality
    FROM kpi_daily
    GROUP BY property_id, property_name, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
),
quarterly_agg AS (
    SELECT 
        property_id,
        property_name,
        EXTRACT(YEAR FROM date) as year,
        EXTRACT(QUARTER FROM date) as quarter,
        'quarterly' as period_type,
        MIN(date) as period_start,
        MAX(date) as period_end,
        
        SUM(rooms_available) as total_rooms_available,
        SUM(rooms_sold) as total_rooms_sold,
        SUM(room_revenue) as total_room_revenue,
        SUM(total_revenue) as total_revenue,
        SUM(direct_revenue) as total_direct_revenue,
        SUM(bookings) as total_bookings,
        SUM(cancellations) as total_cancellations,
        
        ROUND(SUM(rooms_sold)::DECIMAL / NULLIF(SUM(rooms_available), 0) * 100, 2) as avg_occupancy_rate,
        ROUND(SUM(room_revenue) / NULLIF(SUM(rooms_sold), 0), 2) as avg_adr,
        ROUND(SUM(room_revenue) / NULLIF(SUM(rooms_available), 0), 2) as avg_revpar,
        ROUND(SUM(total_revenue) / NULLIF(SUM(rooms_available), 0), 2) as avg_trevpar,
        ROUND(SUM(direct_revenue)::DECIMAL / NULLIF(SUM(room_revenue), 0) * 100, 2) as avg_drr,
        ROUND(SUM(cancellations)::DECIMAL / NULLIF(SUM(bookings), 0) * 100, 2) as avg_cancellation_rate,
        
        COUNT(*) as days_in_period,
        AVG(data_quality_score) as avg_data_quality
    FROM kpi_daily
    GROUP BY property_id, property_name, EXTRACT(YEAR FROM date), EXTRACT(QUARTER FROM date)
)
SELECT * FROM monthly_agg
UNION ALL
SELECT 
    property_id, property_name, year, quarter as period_number,
    period_type, period_start, period_end,
    total_rooms_available, total_rooms_sold, total_room_revenue, total_revenue,
    total_direct_revenue, total_bookings, total_cancellations,
    avg_occupancy_rate, avg_adr, avg_revpar, avg_trevpar, avg_drr, avg_cancellation_rate,
    days_in_period, avg_data_quality
FROM quarterly_agg;

CREATE INDEX idx_kpi_agg_property_period ON kpi_aggregated(property_id, period_type, period_start DESC);

COMMENT ON MATERIALIZED VIEW kpi_aggregated IS 'KPIs agregados por mês e trimestre';

-- =====================================================

-- View: Benchmarking vs. Comp Set
CREATE MATERIALIZED VIEW IF NOT EXISTS kpi_comp_set_daily AS
WITH comp_averages AS (
    SELECT 
        c.property_id,
        c.date,
        COUNT(DISTINCT c.competitor_id) as comp_set_size,
        AVG(c.adr_comp) as market_adr,
        AVG(c.occupancy_comp) as market_occupancy,
        AVG(c.revpar_comp) as market_revpar,
        AVG(c.rating_comp) as market_rating,
        STDDEV(c.adr_comp) as market_adr_stddev,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY c.adr_comp) as market_adr_p25,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY c.adr_comp) as market_adr_p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY c.adr_comp) as market_adr_p75,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY c.revpar_comp) as market_revpar_p25,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY c.revpar_comp) as market_revpar_p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY c.revpar_comp) as market_revpar_p75
    FROM fact_competitor_rates c
    GROUP BY c.property_id, c.date
)
SELECT 
    k.property_id,
    k.date,
    k.property_name,
    k.location,
    
    -- Property Metrics
    k.adr,
    k.occupancy_rate,
    k.revpar,
    
    -- Market Metrics
    ROUND(ca.market_adr, 2) as market_adr,
    ROUND(ca.market_occupancy, 2) as market_occupancy,
    ROUND(ca.market_revpar, 2) as market_revpar,
    ROUND(ca.market_rating, 2) as market_rating,
    ca.comp_set_size,
    
    -- Benchmarking Indices (100 = at market level)
    ROUND((k.adr / NULLIF(ca.market_adr, 0)) * 100, 2) as ari,
    ROUND((k.occupancy_rate / NULLIF(ca.market_occupancy, 0)) * 100, 2) as mpi,
    ROUND((k.revpar / NULLIF(ca.market_revpar, 0)) * 100, 2) as rgi,
    
    -- Market Position
    CASE 
        WHEN k.adr > ca.market_adr_p75 THEN 'premium'
        WHEN k.adr >= ca.market_adr_p50 THEN 'above_market'
        WHEN k.adr >= ca.market_adr_p25 THEN 'at_market'
        ELSE 'economy'
    END as price_position,
    
    CASE 
        WHEN (k.revpar / NULLIF(ca.market_revpar, 0)) * 100 >= 120 THEN 'leader'
        WHEN (k.revpar / NULLIF(ca.market_revpar, 0)) * 100 >= 100 THEN 'competitive'
        WHEN (k.revpar / NULLIF(ca.market_revpar, 0)) * 100 >= 80 THEN 'lagging'
        ELSE 'distressed'
    END as market_position,
    
    -- Percentile Rankings
    ROUND(ca.market_adr_p25, 2) as market_adr_p25,
    ROUND(ca.market_adr_p50, 2) as market_adr_p50,
    ROUND(ca.market_adr_p75, 2) as market_adr_p75,
    ROUND(ca.market_revpar_p25, 2) as market_revpar_p25,
    ROUND(ca.market_revpar_p50, 2) as market_revpar_p50,
    ROUND(ca.market_revpar_p75, 2) as market_revpar_p75,
    
    k.updated_at
FROM kpi_daily k
LEFT JOIN comp_averages ca ON ca.property_id = k.property_id AND ca.date = k.date;

CREATE UNIQUE INDEX idx_comp_set_pk ON kpi_comp_set_daily(property_id, date);
CREATE INDEX idx_comp_set_property ON kpi_comp_set_daily(property_id, date DESC);
CREATE INDEX idx_comp_set_rgi ON kpi_comp_set_daily(rgi, date DESC);

COMMENT ON MATERIALIZED VIEW kpi_comp_set_daily IS 'Benchmarking indices: ARI, MPI, RGI vs. comp set';

-- =====================================================

-- View: Channel Performance
CREATE MATERIALIZED VIEW IF NOT EXISTS kpi_channel_daily AS
SELECT 
    fc.property_id,
    fc.date,
    ch.channel_code,
    ch.name as channel_name,
    ch.type as channel_type,
    
    -- Revenue Metrics
    fc.room_revenue,
    fc.total_revenue,
    fc.bookings,
    fc.cancellations,
    fc.rooms_sold,
    fc.acquisition_cost,
    fc.commission_paid,
    
    -- Performance Metrics
    ROUND((fc.room_revenue - fc.acquisition_cost - fc.commission_paid) / NULLIF(f.rooms_available, 0), 2) as nrevpar,
    ROUND(fc.room_revenue / NULLIF(fc.bookings, 0), 2) as channel_adr,
    ROUND(fc.cancellations::DECIMAL / NULLIF(fc.bookings, 0) * 100, 2) as channel_cancellation_rate,
    ROUND((fc.acquisition_cost + fc.commission_paid) / NULLIF(fc.room_revenue, 0) * 100, 2) as total_cost_percentage,
    
    -- Share Metrics
    ROUND(fc.room_revenue / NULLIF(f.room_revenue, 0) * 100, 2) as revenue_share,
    ROUND(fc.bookings::DECIMAL / NULLIF(f.bookings, 0) * 100, 2) as booking_share,
    
    -- Efficiency Metrics
    ROUND((fc.room_revenue - fc.acquisition_cost - fc.commission_paid) / NULLIF(fc.bookings, 0), 2) as net_revenue_per_booking,
    
    -- Raw data
    f.rooms_available,
    f.room_revenue as total_property_revenue,
    f.bookings as total_property_bookings
    
FROM fact_channel_daily fc
JOIN dim_channel ch ON ch.channel_id = fc.channel_id
JOIN fact_daily f ON f.property_id = fc.property_id AND f.date = fc.date;

CREATE INDEX idx_channel_kpi_property_date ON kpi_channel_daily(property_id, date DESC);
CREATE INDEX idx_channel_kpi_channel ON kpi_channel_daily(channel_code, date DESC);
CREATE INDEX idx_channel_kpi_nrevpar ON kpi_channel_daily(nrevpar DESC);

COMMENT ON MATERIALIZED VIEW kpi_channel_daily IS 'Performance por canal: NRevPAR, DRR, share metrics';

-- =====================================================

-- View: Guest Experience KPIs
CREATE MATERIALIZED VIEW IF NOT EXISTS kpi_guest_experience_daily AS
WITH daily_reviews AS (
    SELECT 
        property_id,
        date,
        COUNT(*) as review_count,
        AVG(rating) as avg_rating,
        AVG(nps_score) as avg_nps,
        AVG(csat_score) as avg_csat,
        AVG(ces_score) as avg_ces,
        AVG(response_time_hours) as avg_response_time,
        ROUND(SUM(CASE WHEN responded THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) * 100, 2) as response_rate,
        SUM(CASE WHEN is_repeat_guest THEN 1 ELSE 0 END) as repeat_guest_count
    FROM fact_reviews
    GROUP BY property_id, date
)
SELECT 
    k.property_id,
    k.date,
    k.property_name,
    
    -- Review Metrics
    COALESCE(dr.review_count, 0) as review_count,
    ROUND(COALESCE(dr.avg_rating, 0), 2) as avg_rating,
    ROUND(COALESCE(dr.avg_nps, 0), 2) as avg_nps,
    ROUND(COALESCE(dr.avg_csat, 0), 2) as avg_csat,
    ROUND(COALESCE(dr.avg_ces, 0), 2) as avg_ces,
    
    -- Response Metrics
    ROUND(COALESCE(dr.avg_response_time, 0), 2) as avg_response_time_hours,
    COALESCE(dr.response_rate, 0) as response_rate,
    
    -- Guest Loyalty
    COALESCE(dr.repeat_guest_count, 0) as repeat_guest_count,
    ROUND(COALESCE(dr.repeat_guest_count, 0)::DECIMAL / NULLIF(k.guest_count, 0) * 100, 2) as repeat_guest_rate,
    
    -- Context
    k.guest_count as total_guests,
    k.bookings as total_bookings
    
FROM kpi_daily k
LEFT JOIN daily_reviews dr ON dr.property_id = k.property_id AND dr.date = k.date;

CREATE INDEX idx_guest_exp_property_date ON kpi_guest_experience_daily(property_id, date DESC);
CREATE INDEX idx_guest_exp_rating ON kpi_guest_experience_daily(avg_rating DESC);

COMMENT ON MATERIALIZED VIEW kpi_guest_experience_daily IS 'KPIs de guest experience: NPS, CSAT, response metrics';

-- =====================================================

-- Function: Refresh todas as views materializadas
CREATE OR REPLACE FUNCTION refresh_all_kpi_views() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_daily;
    REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_aggregated;
    REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_comp_set_daily;
    REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_channel_daily;
    REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_guest_experience_daily;
    
    RAISE NOTICE 'All KPI views refreshed successfully at %', NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_all_kpi_views IS 'Refresh todas as materialized views de KPIs';

-- =====================================================

-- Initial refresh
SELECT refresh_all_kpi_views();

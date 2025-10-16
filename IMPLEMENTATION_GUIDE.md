# 🛠️ Guia de Implementação Técnica - Sistema Premium

Este documento complementa o [PLANO_MELHORIA_PREMIUM_OUTPUT.md](./PLANO_MELHORIA_PREMIUM_OUTPUT.md) com exemplos técnicos concretos.

---

## 📋 Table of Contents
1. [Fase 0: Database Schema](#fase-0-database-schema)
2. [Fase 0: Edge Functions](#fase-0-edge-functions)
3. [Fase 1: Benchmarking](#fase-1-benchmarking)
4. [Fase 5: Health Score](#fase-5-health-score)
5. [Template Integration](#template-integration)
6. [Testing Strategy](#testing-strategy)

---

## Fase 0: Database Schema

### Migration: Create Star Schema

```sql
-- migrations/001_create_dimensions.sql

-- Dimensão: Propriedades
CREATE TABLE dim_property (
    property_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    property_type TEXT,
    room_count INT,
    max_guests INT,
    location TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dimensão: Datas (pre-populate 5 anos)
CREATE TABLE dim_date (
    date DATE PRIMARY KEY,
    day_of_week INT, -- 0=Sunday, 6=Saturday
    week INT,
    month INT,
    quarter INT,
    year INT,
    is_weekend BOOLEAN,
    is_holiday BOOLEAN,
    holiday_name TEXT
);

-- Populate date dimension
INSERT INTO dim_date (date, day_of_week, week, month, quarter, year, is_weekend, is_holiday)
SELECT 
    d::date,
    EXTRACT(DOW FROM d)::int,
    EXTRACT(WEEK FROM d)::int,
    EXTRACT(MONTH FROM d)::int,
    EXTRACT(QUARTER FROM d)::int,
    EXTRACT(YEAR FROM d)::int,
    EXTRACT(DOW FROM d) IN (0,6),
    FALSE -- TODO: integrate holidays API
FROM generate_series(
    '2023-01-01'::date,
    '2028-12-31'::date,
    '1 day'::interval
) AS d;

-- Dimensão: Canais de Distribuição
CREATE TABLE dim_channel (
    channel_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('OTA', 'Direct', 'Wholesale')),
    commission_rate DECIMAL DEFAULT 0.15,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO dim_channel (name, type, commission_rate) VALUES
    ('Airbnb', 'OTA', 0.15),
    ('Booking.com', 'OTA', 0.15),
    ('Vrbo', 'OTA', 0.10),
    ('Expedia', 'OTA', 0.18),
    ('Direct Website', 'Direct', 0.00),
    ('Direct Phone', 'Direct', 0.00);

-- Dimensão: Competidores
CREATE TABLE dim_competitor (
    competitor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID,
    name TEXT NOT NULL,
    property_url TEXT,
    distance_km DECIMAL,
    property_type TEXT,
    room_count INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dimensão: Eventos Locais
CREATE TABLE dim_event (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    event_type TEXT, -- 'conference', 'festival', 'sports', 'holiday'
    impact_score DECIMAL DEFAULT 0.0, -- 0-1 (multiplicador de demanda)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_dates ON dim_event(market_id, start_date, end_date);
```

```sql
-- migrations/002_create_facts.sql

-- Facto: Performance Diária
CREATE TABLE fact_daily (
    property_id UUID REFERENCES dim_property(property_id),
    date DATE REFERENCES dim_date(date),
    rooms_available INT NOT NULL,
    rooms_sold INT NOT NULL,
    room_revenue DECIMAL NOT NULL,
    total_revenue DECIMAL NOT NULL,
    room_cost DECIMAL DEFAULT 0,
    cancellations INT DEFAULT 0,
    searches INT DEFAULT 0,
    bookings INT DEFAULT 0,
    direct_revenue DECIMAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (property_id, date),
    CHECK (rooms_sold <= rooms_available),
    CHECK (room_revenue >= 0),
    CHECK (total_revenue >= room_revenue)
);

CREATE INDEX idx_fact_daily_property ON fact_daily(property_id, date DESC);
CREATE INDEX idx_fact_daily_date ON fact_daily(date DESC);

-- Partitioning por mês (opcional, para escala)
-- CREATE TABLE fact_daily_2025_10 PARTITION OF fact_daily
-- FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- Facto: Performance por Canal
CREATE TABLE fact_channel_daily (
    property_id UUID,
    date DATE,
    channel_id UUID REFERENCES dim_channel(channel_id),
    room_revenue DECIMAL NOT NULL,
    bookings INT NOT NULL,
    cancellations INT DEFAULT 0,
    acquisition_cost DECIMAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (property_id, date, channel_id),
    FOREIGN KEY (property_id, date) REFERENCES fact_daily(property_id, date)
);

-- Facto: Rates dos Competidores
CREATE TABLE fact_competitor_rates (
    property_id UUID,
    date DATE,
    competitor_id UUID REFERENCES dim_competitor(competitor_id),
    adr_comp DECIMAL,
    occupancy_comp DECIMAL,
    revpar_comp DECIMAL,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (property_id, date, competitor_id)
);

-- Facto: Reviews
CREATE TABLE fact_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES dim_property(property_id),
    date DATE REFERENCES dim_date(date),
    platform TEXT NOT NULL,
    rating DECIMAL NOT NULL CHECK (rating >= 0 AND rating <= 5),
    review_text TEXT,
    nps_score INT CHECK (nps_score >= 0 AND nps_score <= 10),
    csat_score INT CHECK (csat_score >= 0 AND csat_score <= 10),
    response_time_hours DECIMAL,
    responded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_property ON fact_reviews(property_id, date DESC);

-- Facto: Sentiment por Tópico
CREATE TABLE fact_sentiment_topics (
    property_id UUID,
    date DATE,
    platform TEXT,
    topic TEXT, -- 'cleanliness', 'comfort', 'location', 'communication', 'amenities', 'value'
    sentiment_score DECIMAL CHECK (sentiment_score >= 0 AND sentiment_score <= 1),
    mention_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (property_id, date, platform, topic)
);
```

```sql
-- migrations/003_create_kpi_views.sql

-- View: KPIs Diários
CREATE MATERIALIZED VIEW kpi_daily AS
SELECT 
    f.property_id,
    f.date,
    p.name as property_name,
    -- Core Metrics
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
    -- Raw data
    f.rooms_available,
    f.rooms_sold,
    f.room_revenue,
    f.total_revenue,
    f.bookings,
    f.cancellations,
    f.searches
FROM fact_daily f
JOIN dim_property p ON p.property_id = f.property_id;

CREATE UNIQUE INDEX idx_kpi_daily_pk ON kpi_daily(property_id, date);
CREATE INDEX idx_kpi_daily_property ON kpi_daily(property_id, date DESC);

-- View: Benchmarking vs. Comp Set
CREATE MATERIALIZED VIEW kpi_comp_set_daily AS
SELECT 
    k.property_id,
    k.date,
    k.property_name,
    -- Market Averages
    ROUND(AVG(c.adr_comp), 2) as market_adr,
    ROUND(AVG(c.occupancy_comp), 2) as market_occupancy,
    ROUND(AVG(c.revpar_comp), 2) as market_revpar,
    COUNT(DISTINCT c.competitor_id) as comp_set_size,
    -- Benchmarking Indices
    ROUND((k.adr / NULLIF(AVG(c.adr_comp), 0)) * 100, 2) as ari,
    ROUND((k.occupancy_rate / NULLIF(AVG(c.occupancy_comp), 0)) * 100, 2) as mpi,
    ROUND((k.revpar / NULLIF(AVG(c.revpar_comp), 0)) * 100, 2) as rgi,
    -- Property metrics
    k.adr,
    k.occupancy_rate,
    k.revpar
FROM kpi_daily k
LEFT JOIN fact_competitor_rates c ON c.property_id = k.property_id AND c.date = k.date
GROUP BY k.property_id, k.date, k.property_name, k.adr, k.occupancy_rate, k.revpar;

CREATE UNIQUE INDEX idx_comp_set_pk ON kpi_comp_set_daily(property_id, date);

-- View: Channel Performance
CREATE MATERIALIZED VIEW kpi_channel_daily AS
SELECT 
    fc.property_id,
    fc.date,
    ch.name as channel_name,
    ch.type as channel_type,
    fc.room_revenue,
    fc.bookings,
    fc.cancellations,
    fc.acquisition_cost,
    -- NRevPAR = (Revenue - Acquisition Cost) / Rooms Available
    ROUND((fc.room_revenue - fc.acquisition_cost) / NULLIF(f.rooms_available, 0), 2) as nrevpar,
    -- Share of total revenue
    ROUND(fc.room_revenue / NULLIF(f.room_revenue, 0) * 100, 2) as revenue_share
FROM fact_channel_daily fc
JOIN dim_channel ch ON ch.channel_id = fc.channel_id
JOIN fact_daily f ON f.property_id = fc.property_id AND f.date = fc.date;

CREATE INDEX idx_channel_kpi ON kpi_channel_daily(property_id, date, channel_name);

-- Function: Refresh all KPI views
CREATE OR REPLACE FUNCTION refresh_kpis() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_daily;
    REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_comp_set_daily;
    REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_channel_daily;
END;
$$ LANGUAGE plpgsql;
```

```sql
-- migrations/004_create_rls.sql

-- Enable RLS on all tables
ALTER TABLE dim_property ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_channel_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_competitor_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_sentiment_topics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own properties
CREATE POLICY "Users view own properties"
ON dim_property FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users view own fact_daily"
ON fact_daily FOR SELECT
USING (
    property_id IN (
        SELECT property_id FROM dim_property WHERE user_id = auth.uid()
    )
);

-- Similar policies for other fact tables...
```

---

## Fase 0: Edge Functions

### daily-ingest: Ingestão Diária de Dados

```typescript
// supabase/functions/daily-ingest/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface BookingData {
  property_id: string;
  date: string;
  rooms_available: number;
  rooms_sold: number;
  room_revenue: number;
  total_revenue: number;
  bookings: number;
  channel_breakdown: {
    channel_id: string;
    revenue: number;
    bookings: number;
  }[];
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch data from PMS/Booking System
    const bookingsData = await fetchFromPMS();

    // 2. Validate data
    const validated = validateBookingsData(bookingsData);
    if (!validated.valid) {
      throw new Error(`Validation failed: ${validated.errors.join(", ")}`);
    }

    // 3. Upsert fact_daily
    for (const booking of bookingsData) {
      const { error: dailyError } = await supabase
        .from("fact_daily")
        .upsert({
          property_id: booking.property_id,
          date: booking.date,
          rooms_available: booking.rooms_available,
          rooms_sold: booking.rooms_sold,
          room_revenue: booking.room_revenue,
          total_revenue: booking.total_revenue,
          bookings: booking.bookings,
          direct_revenue: calculateDirectRevenue(booking),
          searches: 0, // TODO: integrate analytics
          cancellations: 0, // TODO: from PMS
          room_cost: 0, // TODO: from accounting system
        }, {
          onConflict: "property_id,date",
        });

      if (dailyError) {
        console.error(`Error upserting fact_daily:`, dailyError);
        continue;
      }

      // 4. Upsert fact_channel_daily
      for (const channel of booking.channel_breakdown) {
        await supabase.from("fact_channel_daily").upsert({
          property_id: booking.property_id,
          date: booking.date,
          channel_id: channel.channel_id,
          room_revenue: channel.revenue,
          bookings: channel.bookings,
          acquisition_cost: channel.revenue * getChannelCommission(channel.channel_id),
        }, {
          onConflict: "property_id,date,channel_id",
        });
      }
    }

    // 5. Refresh materialized views
    await supabase.rpc("refresh_kpis");

    return new Response(
      JSON.stringify({
        success: true,
        processed: bookingsData.length,
        timestamp: new Date().toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Daily ingest error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

async function fetchFromPMS(): Promise<BookingData[]> {
  // TODO: Implement integration with PMS API
  // For now, fetch from diagnostic_submissions
  // This is a placeholder
  return [];
}

function validateBookingsData(data: BookingData[]) {
  const errors: string[] = [];
  
  for (const booking of data) {
    if (booking.rooms_sold > booking.rooms_available) {
      errors.push(`${booking.property_id}: rooms_sold > rooms_available`);
    }
    if (booking.room_revenue < 0) {
      errors.push(`${booking.property_id}: negative revenue`);
    }
    if (booking.total_revenue < booking.room_revenue) {
      errors.push(`${booking.property_id}: total_revenue < room_revenue`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

function calculateDirectRevenue(booking: BookingData): number {
  return booking.channel_breakdown
    .filter(ch => ch.channel_id === 'direct-website' || ch.channel_id === 'direct-phone')
    .reduce((sum, ch) => sum + ch.revenue, 0);
}

function getChannelCommission(channel_id: string): number {
  const commissions = {
    'airbnb': 0.15,
    'booking': 0.15,
    'vrbo': 0.10,
    'expedia': 0.18,
    'direct-website': 0.0,
    'direct-phone': 0.0,
  };
  return commissions[channel_id] || 0.15;
}
```

### Configurar Cron

```bash
# Deploy function
supabase functions deploy daily-ingest

# Schedule to run daily at 3 AM
supabase functions schedule daily-ingest --cron "0 3 * * *"
```

---

## Fase 1: Benchmarking

### competitor-rates: Rate Shopping

```typescript
// supabase/functions/competitor-rates/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // 1. Get all active properties
    const { data: properties } = await supabase
      .from("dim_property")
      .select("property_id, market_id, location");

    for (const property of properties || []) {
      // 2. Get comp set for this property
      const { data: competitors } = await supabase
        .from("dim_competitor")
        .select("*")
        .eq("market_id", property.market_id)
        .limit(5);

      for (const comp of competitors || []) {
        // 3. Scrape or call API for competitor rates
        const rates = await fetchCompetitorRates(comp);
        
        // 4. Store in fact_competitor_rates
        await supabase.from("fact_competitor_rates").upsert({
          property_id: property.property_id,
          date: new Date().toISOString().split('T')[0],
          competitor_id: comp.competitor_id,
          adr_comp: rates.adr,
          occupancy_comp: rates.occupancy,
          revpar_comp: rates.adr * rates.occupancy / 100,
        }, {
          onConflict: "property_id,date,competitor_id",
        });
      }
    }

    // 5. Refresh comp set view
    await supabase.rpc("refresh_kpis");

    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

async function fetchCompetitorRates(competitor: any) {
  // OPÇÃO 1: Usar API de terceiros (AirDNA, RateGain, etc.)
  // OPÇÃO 2: Web scraping (com respeito a robots.txt e rate limits)
  // OPÇÃO 3: Manual data entry
  
  // Placeholder com estimativa
  return {
    adr: Math.random() * 100 + 50,
    occupancy: Math.random() * 50 + 40,
  };
}
```

---

## Fase 5: Health Score

### Health Score Calculation

```sql
-- migrations/005_health_score.sql

CREATE TABLE health_score_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar TEXT NOT NULL,
    weight DECIMAL NOT NULL,
    metrics JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO health_score_config (pillar, weight, metrics) VALUES
('revenue_performance', 30, '{
    "revpar_percentile": {"weight": 0.5, "source": "kpi_comp_set_daily.rgi"},
    "adr_trend_yoy": {"weight": 0.3, "source": "calc"},
    "occupancy_trend_mom": {"weight": 0.2, "source": "calc"}
}'::jsonb),
('market_position', 15, '{
    "rgi": {"weight": 0.6, "source": "kpi_comp_set_daily.rgi"},
    "ari": {"weight": 0.2, "source": "kpi_comp_set_daily.ari"},
    "mpi": {"weight": 0.2, "source": "kpi_comp_set_daily.mpi"}
}'::jsonb),
('guest_experience', 25, '{
    "nps_normalized": {"weight": 0.4, "source": "fact_reviews"},
    "response_metrics": {"weight": 0.3, "source": "fact_reviews"},
    "repeat_guest_rate": {"weight": 0.3, "source": "calc"}
}'::jsonb),
('distribution', 15, '{
    "nrevpar_weighted": {"weight": 0.4, "source": "kpi_channel_daily"},
    "drr": {"weight": 0.3, "source": "kpi_daily.drr"},
    "lbr": {"weight": 0.3, "source": "kpi_daily.lbr"}
}'::jsonb),
('operational_efficiency', 10, '{
    "cpor_vs_market": {"weight": 0.5, "source": "kpi_daily.cpor"},
    "trevpar_vs_target": {"weight": 0.5, "source": "kpi_daily.trevpar"}
}'::jsonb),
('data_quality', 5, '{
    "completeness": {"weight": 0.4, "source": "calc"},
    "freshness": {"weight": 0.3, "source": "calc"},
    "consistency": {"weight": 0.3, "source": "calc"}
}'::jsonb);

-- Health Score Calculation Function
CREATE OR REPLACE FUNCTION calculate_health_score(
    p_property_id UUID,
    p_date DATE
) RETURNS TABLE (
    total_score DECIMAL,
    category TEXT,
    revenue_performance DECIMAL,
    market_position DECIMAL,
    guest_experience DECIMAL,
    distribution DECIMAL,
    operational_efficiency DECIMAL,
    data_quality DECIMAL
) AS $$
DECLARE
    v_rgi DECIMAL;
    v_ari DECIMAL;
    v_mpi DECIMAL;
    v_drr DECIMAL;
    v_revpar DECIMAL;
    v_market_revpar DECIMAL;
    v_nps DECIMAL;
    v_response_rate DECIMAL;
    
    score_revenue DECIMAL;
    score_market DECIMAL;
    score_guest DECIMAL;
    score_distribution DECIMAL;
    score_operational DECIMAL;
    score_data DECIMAL;
    score_total DECIMAL;
    v_category TEXT;
BEGIN
    -- Fetch metrics
    SELECT 
        k.rgi, k.ari, k.mpi, 
        d.drr, d.revpar, k.market_revpar
    INTO v_rgi, v_ari, v_mpi, v_drr, v_revpar, v_market_revpar
    FROM kpi_comp_set_daily k
    JOIN kpi_daily d ON d.property_id = k.property_id AND d.date = k.date
    WHERE k.property_id = p_property_id AND k.date = p_date;
    
    -- Pillar 1: Revenue Performance (30%)
    score_revenue := LEAST(30, (
        (normalize_percentile(v_rgi, 100, 120, 80) * 0.5) +
        (15 * 0.3) + -- TODO: ADR trend
        (15 * 0.2)   -- TODO: Occupancy trend
    ));
    
    -- Pillar 2: Market Position (15%)
    score_market := LEAST(15, (
        (normalize_percentile(v_rgi, 100, 120, 80) * 0.6) +
        (normalize_percentile(v_ari, 100, 120, 80) * 0.2) +
        (normalize_percentile(v_mpi, 100, 120, 80) * 0.2)
    ) * 0.15);
    
    -- Pillar 3: Guest Experience (25%)
    -- TODO: Implement when review data available
    score_guest := 15; -- Placeholder
    
    -- Pillar 4: Distribution (15%)
    score_distribution := LEAST(15, (
        (normalize_percentile(v_drr, 30, 60, 10) * 0.6) +
        (10 * 0.4) -- TODO: NRevPAR channel weighted
    ));
    
    -- Pillar 5: Operational Efficiency (10%)
    score_operational := 7; -- Placeholder
    
    -- Pillar 6: Data Quality (5%)
    score_data := 5; -- Full score if query succeeds
    
    -- Total
    score_total := score_revenue + score_market + score_guest + 
                   score_distribution + score_operational + score_data;
    
    -- Category
    v_category := CASE
        WHEN score_total >= 85 THEN 'excellent'
        WHEN score_total >= 70 THEN 'good'
        WHEN score_total >= 50 THEN 'attention'
        ELSE 'critical'
    END;
    
    RETURN QUERY SELECT 
        score_total,
        v_category,
        score_revenue,
        score_market,
        score_guest,
        score_distribution,
        score_operational,
        score_data;
END;
$$ LANGUAGE plpgsql;

-- Helper: Normalize to percentile
CREATE OR REPLACE FUNCTION normalize_percentile(
    value DECIMAL,
    target DECIMAL,
    excellent DECIMAL,
    poor DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    IF value >= excellent THEN RETURN 100;
    ELSIF value <= poor THEN RETURN 0;
    ELSE RETURN ((value - poor) / (excellent - poor)) * 100;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## Template Integration

### React Hook: useHealthScore

```typescript
// src/hooks/useHealthScore.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HealthScore {
  total_score: number;
  category: 'excellent' | 'good' | 'attention' | 'critical';
  pillars: {
    revenue_performance: number;
    market_position: number;
    guest_experience: number;
    distribution: number;
    operational_efficiency: number;
    data_quality: number;
  };
  date: string;
}

export const useHealthScore = (propertyId: string, date?: string) => {
  return useQuery({
    queryKey: ['health-score', propertyId, date],
    queryFn: async () => {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('calculate_health_score', {
        p_property_id: propertyId,
        p_date: targetDate,
      });
      
      if (error) throw error;
      
      return {
        total_score: data[0].total_score,
        category: data[0].category,
        pillars: {
          revenue_performance: data[0].revenue_performance,
          market_position: data[0].market_position,
          guest_experience: data[0].guest_experience,
          distribution: data[0].distribution,
          operational_efficiency: data[0].operational_efficiency,
          data_quality: data[0].data_quality,
        },
        date: targetDate,
      } as HealthScore;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
```

### Component: HealthScoreCard

```typescript
// src/components/results/HealthScoreCard.tsx

import { useHealthScore } from '@/hooks/useHealthScore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface HealthScoreCardProps {
  propertyId: string;
}

export const HealthScoreCard = ({ propertyId }: HealthScoreCardProps) => {
  const { data: healthScore, isLoading } = useHealthScore(propertyId);
  
  if (isLoading) return <div>Loading...</div>;
  if (!healthScore) return null;
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-yellow-500';
      case 'attention': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'excellent': return '🟢 Excelente';
      case 'good': return '🟡 Bom';
      case 'attention': return '🟠 Atenção';
      case 'critical': return '🔴 Crítico';
      default: return category;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <div className={`w-40 h-40 rounded-full flex items-center justify-center text-white text-5xl font-bold ${getCategoryColor(healthScore.category)}`}>
            {Math.round(healthScore.total_score)}
          </div>
          <div className="text-xl font-semibold">
            {getCategoryLabel(healthScore.category)}
          </div>
        </div>
        
        <div className="mt-8 space-y-4">
          <PillarScore 
            name="Revenue Performance" 
            score={healthScore.pillars.revenue_performance} 
            max={30} 
          />
          <PillarScore 
            name="Market Position" 
            score={healthScore.pillars.market_position} 
            max={15} 
          />
          <PillarScore 
            name="Guest Experience" 
            score={healthScore.pillars.guest_experience} 
            max={25} 
          />
          <PillarScore 
            name="Distribution & Demand" 
            score={healthScore.pillars.distribution} 
            max={15} 
          />
          <PillarScore 
            name="Operational Efficiency" 
            score={healthScore.pillars.operational_efficiency} 
            max={10} 
          />
          <PillarScore 
            name="Data Quality" 
            score={healthScore.pillars.data_quality} 
            max={5} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

const PillarScore = ({ name, score, max }: { name: string; score: number; max: number }) => {
  const percentage = (score / max) * 100;
  
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-sm text-gray-600">{score.toFixed(1)} / {max}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};
```

---

## Testing Strategy

### Unit Tests: KPI Calculations

```typescript
// src/lib/__tests__/kpi-calculations.test.ts

import { describe, it, expect } from 'vitest';

describe('KPI Calculations', () => {
  describe('RevPAR', () => {
    it('should calculate RevPAR correctly', () => {
      const revpar = calculateRevPAR({
        room_revenue: 1000,
        rooms_available: 10,
      });
      expect(revpar).toBe(100);
    });
    
    it('should handle zero rooms available', () => {
      const revpar = calculateRevPAR({
        room_revenue: 1000,
        rooms_available: 0,
      });
      expect(revpar).toBe(0);
    });
  });
  
  describe('ADR', () => {
    it('should calculate ADR correctly', () => {
      const adr = calculateADR({
        room_revenue: 1000,
        rooms_sold: 5,
      });
      expect(adr).toBe(200);
    });
  });
  
  describe('Occupancy Rate', () => {
    it('should calculate occupancy percentage', () => {
      const occupancy = calculateOccupancy({
        rooms_sold: 7,
        rooms_available: 10,
      });
      expect(occupancy).toBe(70);
    });
  });
  
  describe('RGI (Revenue Generation Index)', () => {
    it('should calculate RGI correctly', () => {
      const rgi = calculateRGI({
        property_revpar: 120,
        market_revpar: 100,
      });
      expect(rgi).toBe(120);
    });
    
    it('should return 0 if market RevPAR is 0', () => {
      const rgi = calculateRGI({
        property_revpar: 120,
        market_revpar: 0,
      });
      expect(rgi).toBe(0);
    });
  });
});

function calculateRevPAR({ room_revenue, rooms_available }) {
  if (rooms_available === 0) return 0;
  return room_revenue / rooms_available;
}

function calculateADR({ room_revenue, rooms_sold }) {
  if (rooms_sold === 0) return 0;
  return room_revenue / rooms_sold;
}

function calculateOccupancy({ rooms_sold, rooms_available }) {
  if (rooms_available === 0) return 0;
  return (rooms_sold / rooms_available) * 100;
}

function calculateRGI({ property_revpar, market_revpar }) {
  if (market_revpar === 0) return 0;
  return (property_revpar / market_revpar) * 100;
}
```

### Integration Tests: Database

```typescript
// supabase/tests/kpi-views.test.ts

import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll } from 'vitest';

describe('KPI Views Integration', () => {
  let supabase;
  
  beforeAll(() => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  });
  
  it('should fetch kpi_daily data', async () => {
    const { data, error } = await supabase
      .from('kpi_daily')
      .select('*')
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.length).toBeGreaterThan(0);
  });
  
  it('kpi_daily should have correct columns', async () => {
    const { data } = await supabase
      .from('kpi_daily')
      .select('*')
      .limit(1)
      .single();
    
    expect(data).toHaveProperty('property_id');
    expect(data).toHaveProperty('date');
    expect(data).toHaveProperty('occupancy_rate');
    expect(data).toHaveProperty('adr');
    expect(data).toHaveProperty('revpar');
    expect(data).toHaveProperty('trevpar');
  });
  
  it('should calculate RGI correctly', async () => {
    const { data } = await supabase
      .from('kpi_comp_set_daily')
      .select('*')
      .not('rgi', 'is', null)
      .limit(1)
      .single();
    
    if (data) {
      // RGI = (Property RevPAR / Market RevPAR) * 100
      const expected_rgi = (data.revpar / data.market_revpar) * 100;
      expect(data.rgi).toBeCloseTo(expected_rgi, 1);
    }
  });
});
```

---

## Checklist de Implementação

### Fase 0
- [ ] Criar migrations (001-004)
- [ ] Deploy migrations para Supabase
- [ ] Criar Edge Function `daily-ingest`
- [ ] Deploy Edge Function
- [ ] Configurar cron job
- [ ] Testar ingestão manual
- [ ] Verificar RLS policies
- [ ] Criar React hooks (useKPIsDaily)
- [ ] Testar dashboard básico

### Fase 1
- [ ] Criar Edge Function `competitor-rates`
- [ ] Integrar API de rate shopping (ou scraper)
- [ ] Popular dim_competitor com dados reais
- [ ] Popular dim_event com calendário local
- [ ] Testar cálculo de ARI/MPI/RGI
- [ ] Criar dashboard de benchmarking

### Fase 5
- [ ] Criar migration 005 (health_score)
- [ ] Implementar função `calculate_health_score`
- [ ] Criar hook useHealthScore
- [ ] Criar componente HealthScoreCard
- [ ] Integrar no template premium
- [ ] Testes E2E do Health Score

---

## Recursos e Links Úteis

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/functions/schedule)
- [TanStack Query](https://tanstack.com/query/latest)
- [Vitest Testing](https://vitest.dev/)
- [STR Methodology](https://str.com/)
- [AirDNA API Docs](https://www.airdna.co/api)

---

**Última Atualização:** 16 Outubro 2025

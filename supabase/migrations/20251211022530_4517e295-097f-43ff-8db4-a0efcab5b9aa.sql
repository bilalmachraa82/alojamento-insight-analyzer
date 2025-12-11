-- =====================================================
-- FASE 2: Dynamic Pricing Engine - Database Schema (Fixed)
-- =====================================================

-- 0. Alterar impact_score para permitir valores maiores
ALTER TABLE public.dim_event ALTER COLUMN impact_score TYPE NUMERIC(5,2);

-- 1. Tabela de Seasonality (fatores sazonais por mercado/mês)
CREATE TABLE IF NOT EXISTS public.dim_seasonality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  season_type TEXT NOT NULL CHECK (season_type IN ('high', 'mid', 'low')),
  factor NUMERIC NOT NULL DEFAULT 1.0,
  weekend_premium NUMERIC NOT NULL DEFAULT 0.15,
  holiday_premium NUMERIC NOT NULL DEFAULT 0.25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(market_id, month)
);

-- Enable RLS
ALTER TABLE public.dim_seasonality ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exist first)
DROP POLICY IF EXISTS "Authenticated users can view seasonality" ON public.dim_seasonality;
DROP POLICY IF EXISTS "Admins can manage seasonality" ON public.dim_seasonality;

CREATE POLICY "Authenticated users can view seasonality" ON public.dim_seasonality
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage seasonality" ON public.dim_seasonality
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_dim_seasonality_updated_at ON public.dim_seasonality;
CREATE TRIGGER update_dim_seasonality_updated_at
  BEFORE UPDATE ON public.dim_seasonality
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Alterações à tabela dim_competitor (adicionar colunas para tracking de scraping)
ALTER TABLE public.dim_competitor 
  ADD COLUMN IF NOT EXISTS booking_url TEXT,
  ADD COLUMN IF NOT EXISTS airbnb_url TEXT,
  ADD COLUMN IF NOT EXISTS scrape_errors INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error_message TEXT,
  ADD COLUMN IF NOT EXISTS scrape_success_count INTEGER DEFAULT 0;

-- Index para URLs
CREATE INDEX IF NOT EXISTS idx_dim_competitor_booking_url ON public.dim_competitor(booking_url) WHERE booking_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dim_competitor_airbnb_url ON public.dim_competitor(airbnb_url) WHERE airbnb_url IS NOT NULL;

-- 3. Tabela de Pricing Recommendations (histórico de preços sugeridos)
CREATE TABLE IF NOT EXISTS public.fact_pricing_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.dim_property(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  base_price NUMERIC NOT NULL,
  suggested_price NUMERIC NOT NULL,
  day_of_week_factor NUMERIC NOT NULL DEFAULT 1.0,
  seasonality_factor NUMERIC NOT NULL DEFAULT 1.0,
  event_factor NUMERIC NOT NULL DEFAULT 1.0,
  competitor_factor NUMERIC NOT NULL DEFAULT 1.0,
  occupancy_factor NUMERIC NOT NULL DEFAULT 1.0,
  lead_time_factor NUMERIC NOT NULL DEFAULT 1.0,
  relevant_events JSONB DEFAULT '[]'::jsonb,
  was_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  actual_price NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, date)
);

-- Enable RLS
ALTER TABLE public.fact_pricing_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own pricing recommendations" ON public.fact_pricing_recommendations;
DROP POLICY IF EXISTS "Service role can manage pricing recommendations" ON public.fact_pricing_recommendations;

CREATE POLICY "Users can view own pricing recommendations" ON public.fact_pricing_recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dim_property 
      WHERE dim_property.id = fact_pricing_recommendations.property_id 
      AND dim_property.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage pricing recommendations" ON public.fact_pricing_recommendations
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_fact_pricing_recommendations_updated_at ON public.fact_pricing_recommendations;
CREATE TRIGGER update_fact_pricing_recommendations_updated_at
  BEFORE UPDATE ON public.fact_pricing_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_fact_pricing_date ON public.fact_pricing_recommendations(property_id, date);
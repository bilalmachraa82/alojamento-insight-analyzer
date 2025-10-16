-- ============================================
-- FASE 0: ANALYTICS STAR SCHEMA
-- Sistema completo de analytics para alojamento local
-- ============================================

-- ============================================
-- 1. DIMENSÕES
-- ============================================

-- DIM_PROPERTY
CREATE TABLE public.dim_property (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  property_type TEXT,
  room_count INTEGER,
  max_guests INTEGER,
  amenities JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- DIM_DATE (popular de 2023 a 2028)
CREATE TABLE public.dim_date (
  date DATE PRIMARY KEY,
  day_of_week INTEGER NOT NULL,
  day_name TEXT NOT NULL,
  week INTEGER NOT NULL,
  month INTEGER NOT NULL,
  month_name TEXT NOT NULL,
  quarter INTEGER NOT NULL,
  year INTEGER NOT NULL,
  is_weekend BOOLEAN NOT NULL,
  is_holiday BOOLEAN DEFAULT false,
  season TEXT NOT NULL
);

-- DIM_CHANNEL
CREATE TABLE public.dim_channel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('OTA', 'Direct', 'Wholesale')),
  commission_rate DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- DIM_COMPETITOR
CREATE TABLE public.dim_competitor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id TEXT,
  name TEXT NOT NULL,
  property_url TEXT,
  distance_km DECIMAL(8,2),
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- DIM_EVENT
CREATE TABLE public.dim_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id TEXT,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('conference', 'festival', 'sports', 'holiday')),
  impact_score DECIMAL(3,2) NOT NULL CHECK (impact_score >= 0 AND impact_score <= 1),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- 2. FACTOS
-- ============================================

-- FACT_DAILY
CREATE TABLE public.fact_daily (
  property_id UUID NOT NULL REFERENCES public.dim_property(id) ON DELETE CASCADE,
  date DATE NOT NULL REFERENCES public.dim_date(date),
  rooms_available INTEGER NOT NULL DEFAULT 0,
  rooms_sold INTEGER NOT NULL DEFAULT 0,
  room_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  direct_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  room_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  bookings INTEGER NOT NULL DEFAULT 0,
  cancellations INTEGER NOT NULL DEFAULT 0,
  searches INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  inquiries INTEGER NOT NULL DEFAULT 0,
  data_quality_score DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (property_id, date)
);

-- FACT_CHANNEL_DAILY
CREATE TABLE public.fact_channel_daily (
  property_id UUID NOT NULL REFERENCES public.dim_property(id) ON DELETE CASCADE,
  date DATE NOT NULL REFERENCES public.dim_date(date),
  channel_id UUID NOT NULL REFERENCES public.dim_channel(id),
  room_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  bookings INTEGER NOT NULL DEFAULT 0,
  cancellations INTEGER NOT NULL DEFAULT 0,
  acquisition_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (property_id, date, channel_id)
);

-- FACT_COMPETITOR_RATES
CREATE TABLE public.fact_competitor_rates (
  property_id UUID NOT NULL REFERENCES public.dim_property(id) ON DELETE CASCADE,
  date DATE NOT NULL REFERENCES public.dim_date(date),
  competitor_id UUID NOT NULL REFERENCES public.dim_competitor(id) ON DELETE CASCADE,
  adr_comp DECIMAL(12,2),
  occupancy_comp DECIMAL(5,2),
  revpar_comp DECIMAL(12,2),
  rating_comp DECIMAL(3,2),
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (property_id, date, competitor_id)
);

-- FACT_REVIEWS
CREATE TABLE public.fact_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.dim_property(id) ON DELETE CASCADE,
  date DATE NOT NULL REFERENCES public.dim_date(date),
  platform TEXT NOT NULL,
  rating DECIMAL(3,2),
  review_text TEXT,
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  csat_score DECIMAL(3,2),
  responded BOOLEAN DEFAULT false,
  response_time_hours INTEGER,
  is_repeat_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- FACT_SENTIMENT_TOPICS
CREATE TABLE public.fact_sentiment_topics (
  property_id UUID NOT NULL REFERENCES public.dim_property(id) ON DELETE CASCADE,
  date DATE NOT NULL REFERENCES public.dim_date(date),
  platform TEXT NOT NULL,
  topic TEXT NOT NULL CHECK (topic IN ('cleanliness', 'comfort', 'location', 'communication', 'amenities', 'value')),
  sentiment_score DECIMAL(3,2) NOT NULL CHECK (sentiment_score >= 0 AND sentiment_score <= 1),
  mention_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (property_id, date, platform, topic)
);

-- FACT_GOALS
CREATE TABLE public.fact_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.dim_property(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  current_value DECIMAL(12,2),
  target_value DECIMAL(12,2) NOT NULL,
  start_date DATE NOT NULL,
  deadline DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'on-track', 'at-risk', 'achieved', 'missed')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- 3. POPULAR DIMENSÕES
-- ============================================

-- Popular DIM_DATE (2023-2028)
INSERT INTO public.dim_date (date, day_of_week, day_name, week, month, month_name, quarter, year, is_weekend, season)
SELECT 
  d::date,
  EXTRACT(DOW FROM d)::integer,
  TO_CHAR(d, 'Day'),
  EXTRACT(WEEK FROM d)::integer,
  EXTRACT(MONTH FROM d)::integer,
  TO_CHAR(d, 'Month'),
  EXTRACT(QUARTER FROM d)::integer,
  EXTRACT(YEAR FROM d)::integer,
  EXTRACT(DOW FROM d) IN (0, 6),
  CASE 
    WHEN EXTRACT(MONTH FROM d) IN (12, 1, 2) THEN 'winter'
    WHEN EXTRACT(MONTH FROM d) IN (3, 4, 5) THEN 'spring'
    WHEN EXTRACT(MONTH FROM d) IN (6, 7, 8) THEN 'summer'
    ELSE 'autumn'
  END
FROM generate_series('2023-01-01'::date, '2028-12-31'::date, '1 day'::interval) AS d;

-- Popular DIM_CHANNEL
INSERT INTO public.dim_channel (channel_code, name, type, commission_rate) VALUES
  ('AIRBNB', 'Airbnb', 'OTA', 15.00),
  ('BOOKING', 'Booking.com', 'OTA', 15.00),
  ('VRBO', 'Vrbo', 'OTA', 10.00),
  ('EXPEDIA', 'Expedia', 'OTA', 18.00),
  ('DIRECT_WEB', 'Direct Website', 'Direct', 0.00),
  ('DIRECT_PHONE', 'Direct Phone', 'Direct', 0.00);

-- ============================================
-- 4. VIEWS MATERIALIZADAS PARA KPIs
-- ============================================

-- KPI_DAILY: Métricas principais diárias
CREATE MATERIALIZED VIEW public.kpi_daily AS
SELECT 
  fd.property_id,
  fd.date,
  fd.rooms_available,
  fd.rooms_sold,
  fd.bookings,
  fd.cancellations,
  -- Métricas calculadas
  CASE WHEN fd.rooms_available > 0 
    THEN ROUND((fd.rooms_sold::decimal / fd.rooms_available * 100), 2) 
    ELSE 0 
  END AS occupancy_rate,
  CASE WHEN fd.rooms_sold > 0 
    THEN ROUND(fd.room_revenue / fd.rooms_sold, 2) 
    ELSE 0 
  END AS adr,
  CASE WHEN fd.rooms_available > 0 
    THEN ROUND(fd.room_revenue / fd.rooms_available, 2) 
    ELSE 0 
  END AS revpar,
  CASE WHEN fd.rooms_available > 0 
    THEN ROUND(fd.total_revenue / fd.rooms_available, 2) 
    ELSE 0 
  END AS trevpar,
  CASE WHEN fd.bookings > 0 
    THEN ROUND(fd.rooms_sold::decimal / fd.bookings, 2) 
    ELSE 0 
  END AS alos,
  ROUND(fd.direct_revenue / NULLIF(fd.total_revenue, 0) * 100, 2) AS drr,
  CASE WHEN (fd.bookings + fd.cancellations) > 0 
    THEN ROUND(fd.bookings::decimal / (fd.bookings + fd.cancellations) * 100, 2) 
    ELSE 0 
  END AS lbr,
  CASE WHEN fd.bookings > 0 
    THEN ROUND(fd.cancellations::decimal / fd.bookings * 100, 2) 
    ELSE 0 
  END AS cancellation_rate
FROM public.fact_daily fd;

CREATE UNIQUE INDEX idx_kpi_daily ON public.kpi_daily (property_id, date);

-- KPI_COMP_SET_DAILY: Benchmarking vs competidores
CREATE MATERIALIZED VIEW public.kpi_comp_set_daily AS
WITH property_metrics AS (
  SELECT 
    property_id,
    date,
    CASE WHEN rooms_sold > 0 THEN room_revenue / rooms_sold ELSE 0 END AS adr,
    CASE WHEN rooms_available > 0 THEN rooms_sold::decimal / rooms_available ELSE 0 END AS occupancy,
    CASE WHEN rooms_available > 0 THEN room_revenue / rooms_available ELSE 0 END AS revpar
  FROM public.fact_daily
),
comp_metrics AS (
  SELECT 
    fcr.property_id,
    fcr.date,
    AVG(fcr.adr_comp) AS avg_comp_adr,
    AVG(fcr.occupancy_comp / 100) AS avg_comp_occupancy,
    AVG(fcr.revpar_comp) AS avg_comp_revpar
  FROM public.fact_competitor_rates fcr
  GROUP BY fcr.property_id, fcr.date
)
SELECT 
  pm.property_id,
  pm.date,
  -- ARI (Average Rate Index)
  CASE WHEN cm.avg_comp_adr > 0 
    THEN ROUND((pm.adr / cm.avg_comp_adr * 100), 2) 
    ELSE NULL 
  END AS ari,
  -- MPI (Market Penetration Index)
  CASE WHEN cm.avg_comp_occupancy > 0 
    THEN ROUND((pm.occupancy / cm.avg_comp_occupancy * 100), 2) 
    ELSE NULL 
  END AS mpi,
  -- RGI (Revenue Generation Index)
  CASE WHEN cm.avg_comp_revpar > 0 
    THEN ROUND((pm.revpar / cm.avg_comp_revpar * 100), 2) 
    ELSE NULL 
  END AS rgi
FROM property_metrics pm
LEFT JOIN comp_metrics cm ON pm.property_id = cm.property_id AND pm.date = cm.date;

CREATE UNIQUE INDEX idx_kpi_comp_set_daily ON public.kpi_comp_set_daily (property_id, date);

-- KPI_CHANNEL_DAILY: Métricas por canal
CREATE MATERIALIZED VIEW public.kpi_channel_daily AS
SELECT 
  fcd.property_id,
  fcd.date,
  fcd.channel_id,
  dc.name AS channel_name,
  dc.type AS channel_type,
  fcd.room_revenue,
  fcd.bookings,
  fcd.cancellations,
  fcd.acquisition_cost,
  -- NRevPAR (Net Revenue Per Available Room)
  CASE WHEN fd.rooms_available > 0 
    THEN ROUND((fcd.room_revenue - fcd.acquisition_cost - (fcd.room_revenue * dc.commission_rate / 100)) / fd.rooms_available, 2) 
    ELSE 0 
  END AS nrevpar
FROM public.fact_channel_daily fcd
JOIN public.dim_channel dc ON fcd.channel_id = dc.id
JOIN public.fact_daily fd ON fcd.property_id = fd.property_id AND fcd.date = fd.date;

CREATE UNIQUE INDEX idx_kpi_channel_daily ON public.kpi_channel_daily (property_id, date, channel_id);

-- ============================================
-- 5. FUNÇÃO PARA REFRESH DE VIEWS
-- ============================================

CREATE OR REPLACE FUNCTION public.refresh_all_kpi_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.kpi_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.kpi_comp_set_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.kpi_channel_daily;
END;
$$;

-- ============================================
-- 6. TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE TRIGGER update_dim_property_updated_at
  BEFORE UPDATE ON public.dim_property
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dim_channel_updated_at
  BEFORE UPDATE ON public.dim_channel
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dim_competitor_updated_at
  BEFORE UPDATE ON public.dim_competitor
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dim_event_updated_at
  BEFORE UPDATE ON public.dim_event
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fact_daily_updated_at
  BEFORE UPDATE ON public.fact_daily
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fact_channel_daily_updated_at
  BEFORE UPDATE ON public.fact_channel_daily
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fact_competitor_rates_updated_at
  BEFORE UPDATE ON public.fact_competitor_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fact_reviews_updated_at
  BEFORE UPDATE ON public.fact_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fact_sentiment_topics_updated_at
  BEFORE UPDATE ON public.fact_sentiment_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fact_goals_updated_at
  BEFORE UPDATE ON public.fact_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 7. ROW LEVEL SECURITY
-- ============================================

-- Ativar RLS em todas as tabelas
ALTER TABLE public.dim_property ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_channel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_competitor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_channel_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_competitor_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_sentiment_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_goals ENABLE ROW LEVEL SECURITY;

-- Políticas para DIM_PROPERTY
CREATE POLICY "Users can view own properties"
  ON public.dim_property FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties"
  ON public.dim_property FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
  ON public.dim_property FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
  ON public.dim_property FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para DIM_CHANNEL (todos podem ler)
CREATE POLICY "Anyone can view channels"
  ON public.dim_channel FOR SELECT
  USING (true);

-- Políticas para DIM_COMPETITOR (todos podem ler)
CREATE POLICY "Anyone can view competitors"
  ON public.dim_competitor FOR SELECT
  USING (true);

-- Políticas para DIM_EVENT (todos podem ler)
CREATE POLICY "Anyone can view events"
  ON public.dim_event FOR SELECT
  USING (true);

-- Políticas para FACT_DAILY (baseado em property ownership)
CREATE POLICY "Users can view own property data"
  ON public.fact_daily FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_daily.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own property data"
  ON public.fact_daily FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_daily.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own property data"
  ON public.fact_daily FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_daily.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own property data"
  ON public.fact_daily FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_daily.property_id
      AND user_id = auth.uid()
    )
  );

-- Políticas idênticas para FACT_CHANNEL_DAILY
CREATE POLICY "Users can view own channel data"
  ON public.fact_channel_daily FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_channel_daily.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own channel data"
  ON public.fact_channel_daily FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_channel_daily.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own channel data"
  ON public.fact_channel_daily FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_channel_daily.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own channel data"
  ON public.fact_channel_daily FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_channel_daily.property_id
      AND user_id = auth.uid()
    )
  );

-- Políticas idênticas para FACT_COMPETITOR_RATES
CREATE POLICY "Users can view own competitor data"
  ON public.fact_competitor_rates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_competitor_rates.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own competitor data"
  ON public.fact_competitor_rates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_competitor_rates.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own competitor data"
  ON public.fact_competitor_rates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_competitor_rates.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own competitor data"
  ON public.fact_competitor_rates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_competitor_rates.property_id
      AND user_id = auth.uid()
    )
  );

-- Políticas idênticas para FACT_REVIEWS
CREATE POLICY "Users can view own reviews"
  ON public.fact_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_reviews.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own reviews"
  ON public.fact_reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_reviews.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own reviews"
  ON public.fact_reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_reviews.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own reviews"
  ON public.fact_reviews FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_reviews.property_id
      AND user_id = auth.uid()
    )
  );

-- Políticas idênticas para FACT_SENTIMENT_TOPICS
CREATE POLICY "Users can view own sentiment data"
  ON public.fact_sentiment_topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_sentiment_topics.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own sentiment data"
  ON public.fact_sentiment_topics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_sentiment_topics.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own sentiment data"
  ON public.fact_sentiment_topics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_sentiment_topics.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own sentiment data"
  ON public.fact_sentiment_topics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_sentiment_topics.property_id
      AND user_id = auth.uid()
    )
  );

-- Políticas para FACT_GOALS
CREATE POLICY "Users can view own goals"
  ON public.fact_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_goals.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own goals"
  ON public.fact_goals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_goals.property_id
      AND user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update own goals"
  ON public.fact_goals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_goals.property_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own goals"
  ON public.fact_goals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.dim_property
      WHERE id = fact_goals.property_id
      AND user_id = auth.uid()
    )
  );

-- ============================================
-- 8. ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_dim_property_user_id ON public.dim_property(user_id);
CREATE INDEX idx_dim_property_is_active ON public.dim_property(is_active);

CREATE INDEX idx_dim_date_year_month ON public.dim_date(year, month);
CREATE INDEX idx_dim_date_is_weekend ON public.dim_date(is_weekend);

CREATE INDEX idx_fact_daily_property_date ON public.fact_daily(property_id, date DESC);
CREATE INDEX idx_fact_channel_daily_property_date ON public.fact_channel_daily(property_id, date DESC);
CREATE INDEX idx_fact_competitor_rates_property_date ON public.fact_competitor_rates(property_id, date DESC);
CREATE INDEX idx_fact_reviews_property_date ON public.fact_reviews(property_id, date DESC);
CREATE INDEX idx_fact_sentiment_topics_property_date ON public.fact_sentiment_topics(property_id, date DESC);
CREATE INDEX idx_fact_goals_property_status ON public.fact_goals(property_id, status);
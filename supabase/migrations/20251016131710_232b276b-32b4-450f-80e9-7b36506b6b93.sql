-- Remover views com security_barrier (incorreto)
DROP VIEW IF EXISTS public.kpi_daily_secure;
DROP VIEW IF EXISTS public.kpi_comp_set_daily_secure;
DROP VIEW IF EXISTS public.kpi_channel_daily_secure;

-- Criar schema privado para materialized views
CREATE SCHEMA IF NOT EXISTS analytics;

-- Mover materialized views para schema privado
ALTER MATERIALIZED VIEW public.kpi_daily SET SCHEMA analytics;
ALTER MATERIALIZED VIEW public.kpi_comp_set_daily SET SCHEMA analytics;
ALTER MATERIALIZED VIEW public.kpi_channel_daily SET SCHEMA analytics;

-- Criar views públicas SEGURAS (sem security_barrier)
CREATE VIEW public.kpi_daily AS
SELECT kd.* 
FROM analytics.kpi_daily kd
WHERE EXISTS (
  SELECT 1 FROM public.dim_property dp
  WHERE dp.id = kd.property_id
  AND dp.user_id = auth.uid()
);

CREATE VIEW public.kpi_comp_set_daily AS
SELECT kc.* 
FROM analytics.kpi_comp_set_daily kc
WHERE EXISTS (
  SELECT 1 FROM public.dim_property dp
  WHERE dp.id = kc.property_id
  AND dp.user_id = auth.uid()
);

CREATE VIEW public.kpi_channel_daily AS
SELECT kch.* 
FROM analytics.kpi_channel_daily kch
WHERE EXISTS (
  SELECT 1 FROM public.dim_property dp
  WHERE dp.id = kch.property_id
  AND dp.user_id = auth.uid()
);

-- Atualizar função refresh para usar schema correto
CREATE OR REPLACE FUNCTION public.refresh_all_kpi_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = analytics, public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.kpi_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.kpi_comp_set_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.kpi_channel_daily;
END;
$$;

-- Comentários
COMMENT ON SCHEMA analytics IS 'Private schema for materialized views - not exposed via API';
COMMENT ON VIEW public.kpi_daily IS 'Secure view with automatic RLS filtering';
COMMENT ON VIEW public.kpi_comp_set_daily IS 'Secure view with automatic RLS filtering';
COMMENT ON VIEW public.kpi_channel_daily IS 'Secure view with automatic RLS filtering';
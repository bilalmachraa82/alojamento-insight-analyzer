-- Solução correta: Criar views regulares com filtro de segurança sobre as materialized views

-- View segura para KPI_DAILY
CREATE OR REPLACE VIEW public.kpi_daily_secure 
WITH (security_barrier = true) AS
SELECT kd.* 
FROM public.kpi_daily kd
WHERE EXISTS (
  SELECT 1 FROM public.dim_property dp
  WHERE dp.id = kd.property_id
  AND dp.user_id = auth.uid()
);

-- View segura para KPI_COMP_SET_DAILY
CREATE OR REPLACE VIEW public.kpi_comp_set_daily_secure 
WITH (security_barrier = true) AS
SELECT kc.* 
FROM public.kpi_comp_set_daily kc
WHERE EXISTS (
  SELECT 1 FROM public.dim_property dp
  WHERE dp.id = kc.property_id
  AND dp.user_id = auth.uid()
);

-- View segura para KPI_CHANNEL_DAILY
CREATE OR REPLACE VIEW public.kpi_channel_daily_secure 
WITH (security_barrier = true) AS
SELECT kch.* 
FROM public.kpi_channel_daily kch
WHERE EXISTS (
  SELECT 1 FROM public.dim_property dp
  WHERE dp.id = kch.property_id
  AND dp.user_id = auth.uid()
);

-- Adicionar comentários informativos
COMMENT ON MATERIALIZED VIEW public.kpi_daily IS 'Internal materialized view - use kpi_daily_secure for user access';
COMMENT ON MATERIALIZED VIEW public.kpi_comp_set_daily IS 'Internal materialized view - use kpi_comp_set_daily_secure for user access';
COMMENT ON MATERIALIZED VIEW public.kpi_channel_daily IS 'Internal materialized view - use kpi_channel_daily_secure for user access';

COMMENT ON VIEW public.kpi_daily_secure IS 'Secure view with RLS - users only see their own property data';
COMMENT ON VIEW public.kpi_comp_set_daily_secure IS 'Secure view with RLS - users only see their own property data';
COMMENT ON VIEW public.kpi_channel_daily_secure IS 'Secure view with RLS - users only see their own property data';
-- Ativar RLS em dim_date (tabela pública de referência)
ALTER TABLE public.dim_date ENABLE ROW LEVEL SECURITY;

-- Policy para dim_date: todos podem ler (tabela de calendário)
CREATE POLICY "Anyone can view dates"
  ON public.dim_date FOR SELECT
  USING (true);

-- Recriar views SEM security definer (remover e recriar)
DROP VIEW IF EXISTS public.kpi_daily;
DROP VIEW IF EXISTS public.kpi_comp_set_daily;
DROP VIEW IF EXISTS public.kpi_channel_daily;

-- Criar views públicas com SECURITY INVOKER explícito
CREATE VIEW public.kpi_daily 
WITH (security_invoker = true) AS
SELECT kd.* 
FROM analytics.kpi_daily kd
WHERE EXISTS (
  SELECT 1 FROM public.dim_property dp
  WHERE dp.id = kd.property_id
  AND dp.user_id = auth.uid()
);

CREATE VIEW public.kpi_comp_set_daily 
WITH (security_invoker = true) AS
SELECT kc.* 
FROM analytics.kpi_comp_set_daily kc
WHERE EXISTS (
  SELECT 1 FROM public.dim_property dp
  WHERE dp.id = kc.property_id
  AND dp.user_id = auth.uid()
);

CREATE VIEW public.kpi_channel_daily 
WITH (security_invoker = true) AS
SELECT kch.* 
FROM analytics.kpi_channel_daily kch
WHERE EXISTS (
  SELECT 1 FROM public.dim_property dp
  WHERE dp.id = kch.property_id
  AND dp.user_id = auth.uid()
);
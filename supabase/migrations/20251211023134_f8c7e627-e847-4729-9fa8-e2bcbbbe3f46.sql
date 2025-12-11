-- Alterar constraints da dim_event para permitir mais tipos e scores maiores
ALTER TABLE public.dim_event DROP CONSTRAINT IF EXISTS dim_event_event_type_check;
ALTER TABLE public.dim_event DROP CONSTRAINT IF EXISTS dim_event_impact_score_check;

ALTER TABLE public.dim_event ADD CONSTRAINT dim_event_event_type_check 
  CHECK (event_type IN ('conference', 'festival', 'sports', 'holiday', 'concert', 'public_holiday'));

ALTER TABLE public.dim_event ADD CONSTRAINT dim_event_impact_score_check 
  CHECK (impact_score >= 0 AND impact_score <= 10);
-- ============================================================================
-- MARIA FAZ - MONITORING QUERIES
-- Queries para monitoramento de saúde e performance do sistema
-- ============================================================================

-- ====================
-- 1. HEALTH CHECK: Submissions nas últimas 24h
-- ====================
-- Mostra distribuição de status e taxa de sucesso
SELECT 
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM diagnostic_submissions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY count DESC;

-- ====================
-- 2. ALERT: Stuck Submissions (>30 minutos)
-- ====================
-- Identifica submissões presas em processing/scraping/analyzing
SELECT 
  id, 
  name,
  email,
  status, 
  platform,
  property_url,
  ROUND(EXTRACT(EPOCH FROM (NOW() - updated_at))/60, 1) as minutes_stuck,
  retry_count,
  error_message
FROM diagnostic_submissions
WHERE status IN ('processing', 'scraping', 'analyzing')
  AND updated_at < NOW() - INTERVAL '30 minutes'
ORDER BY updated_at ASC;

-- ====================
-- 3. SUCCESS RATE: Últimos 7 dias
-- ====================
-- Taxa de sucesso diária para identificar tendências
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_submissions,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'pending_manual_review') as needs_review,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*), 1) as success_rate_percent
FROM diagnostic_submissions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ====================
-- 4. PLATFORM PERFORMANCE
-- ====================
-- Compara performance por plataforma
SELECT 
  platform,
  COUNT(*) as total_submissions,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60), 1) as avg_processing_minutes,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*), 1) as success_rate
FROM diagnostic_submissions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY platform
ORDER BY total_submissions DESC;

-- ====================
-- 5. RECENT ERRORS: Últimas 20 falhas
-- ====================
-- Lista erros recentes para troubleshooting
SELECT 
  id,
  name,
  email,
  platform,
  property_url,
  status,
  error_message,
  retry_count,
  created_at,
  updated_at
FROM diagnostic_submissions
WHERE status IN ('failed', 'pending_manual_review')
ORDER BY created_at DESC
LIMIT 20;

-- ====================
-- 6. APIFY PERFORMANCE
-- ====================
-- Analisa performance do Apify scraper
SELECT 
  platform,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE actor_run_id IS NOT NULL) as successful_starts,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_completes,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) FILTER (WHERE status = 'completed'), 1) as avg_completion_minutes
FROM diagnostic_submissions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY platform;

-- ====================
-- 7. PROCESSING FUNNEL
-- ====================
-- Mostra onde as submissões estão falhando
SELECT 
  CASE 
    WHEN status = 'pending' THEN '1. Pending'
    WHEN status = 'processing' THEN '2. Processing'
    WHEN status = 'scraping' THEN '3. Scraping'
    WHEN status = 'analyzing' THEN '4. Analyzing'
    WHEN status = 'completed' THEN '5. Completed'
    WHEN status = 'failed' THEN '6. Failed'
    WHEN status = 'pending_manual_review' THEN '7. Manual Review'
  END as funnel_stage,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM diagnostic_submissions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY funnel_stage
ORDER BY funnel_stage;

-- ====================
-- 8. CLAUDE API USAGE
-- ====================
-- Analisa uso da API do Claude
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE status IN ('analyzing', 'completed')) as analysis_requests,
  COUNT(*) FILTER (WHERE status = 'completed' AND analysis_result IS NOT NULL) as successful_analyses,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed' AND analysis_result IS NOT NULL) / 
    NULLIF(COUNT(*) FILTER (WHERE status IN ('analyzing', 'completed')), 0), 1) as success_rate
FROM diagnostic_submissions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ====================
-- 9. STORAGE USAGE
-- ====================
-- Verifica uso do storage bucket
SELECT 
  COUNT(*) as total_files,
  ROUND(SUM((metadata->>'size')::numeric) / 1024 / 1024, 2) as total_mb,
  MIN(created_at) as oldest_file,
  MAX(created_at) as newest_file
FROM storage.objects
WHERE bucket_id = 'premium-reports';

-- ====================
-- 10. RETRY ANALYSIS
-- ====================
-- Analisa efetividade do sistema de retry
SELECT 
  retry_count,
  COUNT(*) as submissions,
  COUNT(*) FILTER (WHERE status = 'completed') as eventually_completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*), 1) as recovery_rate
FROM diagnostic_submissions
WHERE created_at > NOW() - INTERVAL '7 days'
  AND retry_count > 0
GROUP BY retry_count
ORDER BY retry_count;

-- ====================
-- 11. HOURLY DISTRIBUTION
-- ====================
-- Identifica padrões de uso por hora
SELECT 
  EXTRACT(HOUR FROM created_at) as hour_of_day,
  COUNT(*) as submissions,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60), 1) as avg_processing_minutes
FROM diagnostic_submissions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour_of_day;

-- ====================
-- 12. ACTIVE SUBMISSIONS (Real-time)
-- ====================
-- Mostra submissões em processamento neste momento
SELECT 
  id,
  name,
  platform,
  status,
  ROUND(EXTRACT(EPOCH FROM (NOW() - created_at))/60, 1) as minutes_elapsed,
  retry_count
FROM diagnostic_submissions
WHERE status IN ('pending', 'processing', 'scraping', 'analyzing')
ORDER BY created_at DESC;

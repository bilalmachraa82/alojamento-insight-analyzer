# ⏰ Cron Job Setup Guide

**Function:** `daily-ingest`  
**Purpose:** Popula tabelas de analytics diariamente  
**Schedule:** Todos os dias às 00:00 UTC  
**Duration:** ~10-15 minutos

---

## Prerequisites ✅

- [ ] Edge function `daily-ingest` deployada
- [ ] Extensões `pg_cron` e `pg_net` habilitadas no Supabase
- [ ] Service role key disponível

---

## Step 1: Enable Extensions (5 min)

### 1.1 Verificar Se Extensões Já Estão Ativas

Execute em **Lovable Cloud → Database**:

```sql
-- Verificar extensões instaladas
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('pg_cron', 'pg_net');
```

**Expected Output:**
```
extname  | extversion
---------+-----------
pg_cron  | 1.4
pg_net   | 0.7
```

**⚠️ Se vazio, instalar extensões:**

```sql
-- Habilitar pg_cron (para agendamento)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Habilitar pg_net (para HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;
```

---

## Step 2: Create Cron Job (10 min)

### 2.1 Setup Cron Schedule

Execute em **Lovable Cloud → Database**:

```sql
-- Criar cron job para daily-ingest
-- Executa todos os dias às 00:00 UTC (01:00 Lisboa no inverno, 02:00 no verão)
SELECT cron.schedule(
    'daily-ingest-analytics',           -- Nome do job
    '0 0 * * *',                        -- Cron expression (00:00 UTC)
    $$
    SELECT net.http_post(
        url := 'https://tdjwmxzhzvejrvxgpcrj.supabase.co/functions/v1/daily-ingest',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkandteHpoenZlanJ2eGdwY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjAxMTUsImV4cCI6MjA3NjA5NjExNX0.CFadyNMUCqNwklg52f_xVDZ4nAUeR7VUsBN86qP0DmU'
        ),
        body := jsonb_build_object(
            'manual_trigger', false,
            'timestamp', now()::text
        )
    ) as request_id;
    $$
);
```

**Cron Expression Breakdown:**
- `0` - Minuto 0
- `0` - Hora 0 (meia-noite UTC)
- `*` - Todos os dias do mês
- `*` - Todos os meses
- `*` - Todos os dias da semana

### 2.2 Verify Cron Job Created

```sql
-- Listar todos os cron jobs
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active
FROM cron.job
WHERE jobname = 'daily-ingest-analytics';
```

**Expected Output:**
```
jobid | schedule  | command          | active
------|-----------|------------------|-------
1     | 0 0 * * * | SELECT net...    | t
```

---

## Step 3: Test Manual Execution (5 min)

### 3.1 Trigger Manually

```sql
-- Executar daily-ingest manualmente para testar
SELECT net.http_post(
    url := 'https://tdjwmxzhzvejrvxgpcrj.supabase.co/functions/v1/daily-ingest',
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkandteHpoenZlanJ2eGdwY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjAxMTUsImV4cCI6MjA3NjA5NjExNX0.CFadyNMUCqNwklg52f_xVDZ4nAUeR7VUsBN86qP0DmU'
    ),
    body := jsonb_build_object(
        'manual_trigger', true,
        'timestamp', now()::text
    )
) as request_id;
```

### 3.2 Check Function Logs

Aguardar 30 segundos, depois verificar logs em **Lovable Cloud → Functions → daily-ingest → Logs**

**Expected Logs:**
```
[INFO] Daily ingest started
[INFO] Processing system properties...
[INFO] Processed X properties
[INFO] Refreshing materialized views...
[INFO] Daily ingest completed successfully
```

### 3.3 Verify Data Populated

```sql
-- Verificar se fact_daily foi populado
SELECT COUNT(*) as rows_today 
FROM fact_daily 
WHERE date = CURRENT_DATE;

-- Verificar se materialized views foram atualizadas
SELECT COUNT(*) as kpi_rows 
FROM kpi_daily 
WHERE date >= CURRENT_DATE - INTERVAL '7 days';
```

**Expected:**
- `rows_today` > 0 (pelo menos 1 property processada)
- `kpi_rows` > 0 (views foram refreshed)

---

## Step 4: Monitor Cron Executions (Ongoing)

### 4.1 Check Cron Job History

```sql
-- Ver histórico de execuções (últimos 7 dias)
SELECT 
    runid,
    jobid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time,
    EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'daily-ingest-analytics')
  AND start_time > NOW() - INTERVAL '7 days'
ORDER BY start_time DESC;
```

### 4.2 Check for Failed Runs

```sql
-- Identificar execuções falhadas
SELECT 
    runid,
    start_time,
    status,
    return_message
FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'daily-ingest-analytics')
  AND status = 'failed'
ORDER BY start_time DESC
LIMIT 10;
```

---

## Troubleshooting 🔧

### Cron Job Não Executa

**1. Verificar se job está ativo:**
```sql
SELECT jobname, active 
FROM cron.job 
WHERE jobname = 'daily-ingest-analytics';
```

**2. Se `active = false`, reativar:**
```sql
SELECT cron.alter_job(
    job_id := (SELECT jobid FROM cron.job WHERE jobname = 'daily-ingest-analytics'),
    schedule := '0 0 * * *',
    command := $$
    SELECT net.http_post(
        url := 'https://tdjwmxzhzvejrvxgpcrj.supabase.co/functions/v1/daily-ingest',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkandteHpoenZlanJ2eGdwY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjAxMTUsImV4cCI6MjA3NjA5NjExNX0.CFadyNMUCqNwklg52f_xVDZ4nAUeR7VUsBN86qP0DmU'
        ),
        body := jsonb_build_object('manual_trigger', false, 'timestamp', now()::text)
    );
    $$
);
```

### Edge Function Retorna Erro

**1. Verificar logs da função:**
- Lovable Cloud → Functions → daily-ingest → Logs
- Procurar por errors ou warnings

**2. Testar função manualmente:**
```sql
SELECT net.http_post(
    url := 'https://tdjwmxzhzvejrvxgpcrj.supabase.co/functions/v1/daily-ingest',
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkandteHpoenZlanJ2eGdwY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjAxMTUsImV4cCI6MjA3NjA5NjExNX0.CFadyNMUCqNwklg52f_xVDZ4nAUeR7VUsBN86qP0DmU'
    ),
    body := jsonb_build_object('manual_trigger', true)
);
```

**3. Verificar se function existe:**
```sql
-- Esta query não funciona diretamente, mas pode verificar via Lovable Cloud
-- Lovable Cloud → Functions → verificar se 'daily-ingest' está listada
```

### Data Não Popula

**1. Verificar se properties existem:**
```sql
SELECT COUNT(*) FROM dim_property WHERE is_system = true;
```

**2. Se vazio, criar property de sistema (apenas para testes):**
```sql
INSERT INTO dim_property (name, location, property_type, is_system, is_active)
VALUES ('Test System Property', 'Lisboa', 'apartment', true, true);
```

**3. Re-executar daily-ingest manualmente**

### Modificar Schedule

**Para executar em horário diferente (ex: 02:00 UTC):**

```sql
SELECT cron.alter_job(
    job_id := (SELECT jobid FROM cron.job WHERE jobname = 'daily-ingest-analytics'),
    schedule := '0 2 * * *'  -- Muda de 00:00 para 02:00 UTC
);
```

**Outros exemplos de schedule:**
- `0 */6 * * *` - A cada 6 horas
- `0 0 * * 1` - Toda segunda-feira às 00:00
- `*/30 * * * *` - A cada 30 minutos (não recomendado para este caso)

### Desativar Cron Job (Temporariamente)

```sql
SELECT cron.unschedule('daily-ingest-analytics');
```

**Para reativar, executar novamente Step 2.1**

---

## Monitoring Queries

### Daily Health Check

```sql
-- Verificar última execução
SELECT 
    start_time,
    end_time,
    status,
    return_message,
    EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-ingest-analytics')
ORDER BY start_time DESC
LIMIT 1;
```

### Weekly Performance Report

```sql
-- Performance últimos 7 dias
SELECT 
    DATE(start_time) as execution_date,
    COUNT(*) as executions,
    COUNT(*) FILTER (WHERE status = 'succeeded') as successful,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time))), 1) as avg_duration_seconds
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-ingest-analytics')
  AND start_time > NOW() - INTERVAL '7 days'
GROUP BY DATE(start_time)
ORDER BY execution_date DESC;
```

---

## Success Criteria ✅

- [ ] pg_cron e pg_net extensions habilitadas
- [ ] Cron job `daily-ingest-analytics` criado
- [ ] Schedule configurado: `0 0 * * *` (diário às 00:00 UTC)
- [ ] Teste manual executou com sucesso
- [ ] Logs mostram "Daily ingest completed successfully"
- [ ] fact_daily populado com dados do dia
- [ ] Materialized views refreshed
- [ ] Job ativo: `active = true`
- [ ] Primeira execução automática agendada

---

## Next Steps

1. **Aguardar primeira execução automática** (próxima 00:00 UTC)
2. **Monitorizar logs** no dia seguinte
3. **Verificar dados** usando monitoring queries
4. **Documentar issues** se houver falhas
5. **Ajustar schedule** se necessário

---

## 📅 Schedule Reference

| Time (UTC) | Time (Lisboa - Inverno) | Time (Lisboa - Verão) |
|------------|------------------------|-----------------------|
| 00:00      | 01:00                  | 02:00                 |
| 02:00      | 03:00                  | 04:00                 |
| 06:00      | 07:00                  | 08:00                 |
| 12:00      | 13:00                  | 14:00                 |

**Current Schedule:** 00:00 UTC = 01:00/02:00 Lisboa  
**Recommendation:** Manter 00:00 UTC (logo após meia-noite) para processar dados do dia anterior completo.

---

## ✅ Setup Complete!

Your cron job is now configured and will run daily at 00:00 UTC.

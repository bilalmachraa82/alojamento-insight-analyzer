# 🧪 End-to-End Testing Guide

**Project:** Maria Faz - Alojamento Insight Analyzer  
**Purpose:** Testes completos E2E para validação pré-produção  
**Duration:** ~30 minutos

---

## Prerequisites ✅

- [ ] Aplicação deployada em produção
- [ ] Acesso à Lovable Cloud → Database (para executar queries SQL)
- [ ] Email de teste válido
- [ ] URLs de teste do Booking.com

---

## Test Suite Overview

| Test | Objetivo | Duração | Prioridade |
|------|----------|---------|------------|
| Test 1 | Booking.com Submission | 10 min | 🔴 Crítico |
| Test 2 | Analytics System | 10 min | 🟡 Alto |
| Test 3 | Error Recovery | 5 min | 🟡 Alto |
| Test 4 | Debug Page | 5 min | 🟢 Médio |

---

## Test 1: Booking.com Submission (10 min)

### Objetivo
Validar fluxo completo: submissão → scraping → análise → PDF → email

### Test Data
```
Nome: Test Production E2E
Email: test-e2e@mariafaz.com
Plataforma: Booking
URL: https://www.booking.com/hotel/pt/pestana-palace-lisboa.pt-pt.html
```

### Steps

#### 1.1 Submeter Formulário
1. Aceder homepage de produção
2. Preencher formulário com dados acima
3. Clicar "Começar Análise"
4. Anotar timestamp de início: `___:___`

**Expected:**
- ✅ Toast de sucesso: "Análise iniciada com sucesso!"
- ✅ Redirect para página de resultados ou confirmação

#### 1.2 Verificar Criação (Imediato)
```sql
-- Executar em Lovable Cloud → Database
SELECT 
  id, 
  status, 
  platform, 
  property_url,
  created_at 
FROM diagnostic_submissions 
WHERE email = 'test-e2e@mariafaz.com'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected:**
- ✅ 1 row retornada
- ✅ `status = 'pending'`
- ✅ `platform = 'booking'`
- ✅ `property_url` correto

#### 1.3 Monitorizar Status Transitions (Executar múltiplas vezes)
```sql
-- Executar a cada 30 segundos durante 5 minutos
SELECT 
  id,
  status,
  actor_run_id,
  retry_count,
  error_message,
  ROUND(EXTRACT(EPOCH FROM (NOW() - created_at))/60, 1) as minutes_elapsed,
  updated_at
FROM diagnostic_submissions 
WHERE email = 'test-e2e@mariafaz.com'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected Transitions:**
1. `pending` (0s)
2. `processing` (10-20s)
3. `scraping` (30-60s) - `actor_run_id` preenchido
4. `analyzing` (90-150s)
5. `completed` (2-5 min total)

**⚠️ Se stuck em qualquer status por >5 min:**
```sql
-- Executar função de recovery
SELECT * FROM supabase.functions.invoke('fix-stuck-submission');
```

#### 1.4 Verificar Análise Completa
```sql
SELECT 
  id,
  status,
  analysis_result->>'health_score' as health_score,
  analysis_result->>'overall_assessment' as assessment,
  premium_report_url,
  report_generated_at
FROM diagnostic_submissions 
WHERE email = 'test-e2e@mariafaz.com'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected:**
- ✅ `status = 'completed'`
- ✅ `health_score` entre 0-100
- ✅ `assessment` contém texto descritivo
- ✅ `premium_report_url` não nulo
- ✅ `report_generated_at` não nulo

#### 1.5 Verificar PDF no Storage
```sql
SELECT 
  name, 
  bucket_id,
  created_at,
  (metadata->>'size')::numeric / 1024 as size_kb,
  metadata
FROM storage.objects 
WHERE bucket_id = 'premium-reports'
  AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected:**
- ✅ Novo arquivo PDF listado
- ✅ `size_kb` > 50 (PDF não está vazio)
- ✅ Nome do arquivo corresponde ao formato esperado

#### 1.6 Testar Acesso ao PDF
```sql
-- Copiar premium_report_url da query 1.4
```
1. Abrir URL em navegador
2. PDF deve fazer download automaticamente

**Expected:**
- ✅ PDF abre sem erros
- ✅ Contém Health Score
- ✅ Contém gráficos e análises
- ✅ Formatação correta

#### 1.7 Verificar Email (Se configurado)
```sql
-- Esta tabela será criada no futuro para email notifications
SELECT * FROM email_notifications 
WHERE recipient = 'test-e2e@mariafaz.com'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected (futuro):**
- ✅ Email enviado
- ✅ Link para PDF funcional

### Test 1 Success Criteria
- [ ] Status transitions completas em <5 min
- [ ] Health Score gerado (0-100)
- [ ] PDF acessível publicamente
- [ ] Tamanho do PDF >50KB
- [ ] Zero errors durante processo

---

## Test 2: Analytics System (10 min)

### Objetivo
Validar que submissão popula tabelas de analytics

### 2.1 Verificar Property Criada
```sql
SELECT 
  id,
  name, 
  location, 
  property_type,
  room_count,
  is_active,
  created_at
FROM dim_property 
WHERE is_system = false
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected:**
- ✅ Nova property do teste E2E aparece
- ✅ `name` extraído da URL
- ✅ `location` preenchido (se disponível)
- ✅ `is_active = true`

### 2.2 Verificar Dados Diários (Após daily-ingest rodar)
```sql
SELECT 
  property_id,
  date,
  rooms_available,
  rooms_sold,
  occupancy_rate,
  adr,
  revpar,
  bookings,
  created_at
FROM fact_daily
WHERE date = CURRENT_DATE
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected (após cron job):**
- ✅ Dados para propriedades do sistema
- ✅ `occupancy_rate`, `adr`, `revpar` calculados
- ✅ Valores numéricos razoáveis

**⚠️ Se vazio:** Ainda não rodou daily-ingest, testar manualmente:
```sql
-- Trigger manual (apenas para teste)
SELECT net.http_post(
  url := 'https://tdjwmxzhzvejrvxgpcrj.supabase.co/functions/v1/daily-ingest',
  headers := jsonb_build_object(
    'Authorization', 
    'Bearer ' || current_setting('request.jwt.claims')::json->>'sub'
  )
);
```

### 2.3 Verificar Materialized Views
```sql
-- View 1: KPI Daily
SELECT * FROM kpi_daily
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC
LIMIT 10;

-- View 2: KPI Comp Set Daily
SELECT * FROM kpi_comp_set_daily
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC
LIMIT 10;

-- View 3: KPI Channel Daily
SELECT * FROM kpi_channel_daily
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC
LIMIT 10;
```

**Expected:**
- ✅ Views contêm dados agregados
- ✅ Cálculos de KPIs corretos
- ✅ Sem valores NULL em campos críticos

**⚠️ Se vazias, refresh manual:**
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_daily;
REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_comp_set_daily;
REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_channel_daily;
```

### Test 2 Success Criteria
- [ ] Property criada em dim_property
- [ ] fact_daily populado (após cron)
- [ ] Materialized views calculadas
- [ ] KPIs numéricos razoáveis

---

## Test 3: Error Recovery (5 min)

### Objetivo
Validar comportamento com URLs inválidas e recovery

### 3.1 Submeter URL Inválida
```
Nome: Test Invalid URL
Email: test-invalid@mariafaz.com
Plataforma: Booking
URL: https://www.booking.com/invalid-url-12345
```

### 3.2 Monitorizar Comportamento
```sql
SELECT 
  id,
  status,
  error_message,
  retry_count,
  ROUND(EXTRACT(EPOCH FROM (NOW() - created_at))/60, 1) as minutes_elapsed
FROM diagnostic_submissions 
WHERE email = 'test-invalid@mariafaz.com'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected:**
- ✅ Após 2-3 tentativas: `status = 'pending_manual_review'`
- ✅ `error_message` descritivo (ex: "Invalid URL" ou "Scraper failed")
- ✅ `retry_count = 2` (MAX_RETRY_ATTEMPTS)

### 3.3 Testar Reprocessamento Manual
```sql
-- Copiar ID da submissão falhada
-- Chamar edge function (via Lovable Cloud → Functions)
SELECT * FROM supabase.functions.invoke(
  'reprocess-submission',
  body := jsonb_build_object('submissionId', '<ID_AQUI>')
);
```

**Expected:**
- ✅ Função retorna sucesso
- ✅ Status volta para `pending` ou `processing`
- ✅ `retry_count` incrementado

### Test 3 Success Criteria
- [ ] URL inválida detectada
- [ ] Status muda para `pending_manual_review`
- [ ] Error message descritivo
- [ ] Retry limit respeitado (2)
- [ ] Reprocessamento manual funciona

---

## Test 4: Debug Page (5 min)

### Objetivo
Validar interface de debug para administradores

### 4.1 Aceder Debug Page
1. Navegar para: `https://[seu-dominio]/debug`

**Expected:**
- ✅ Página carrega sem erros
- ✅ Tabela de submissões visível

### 4.2 Testar Filtros
1. Filtrar por `status = 'completed'`
2. Filtrar por `status = 'failed'`
3. Filtrar por `platform = 'booking'`

**Expected:**
- ✅ Resultados filtrados corretamente
- ✅ Contagem de resultados atualiza

### 4.3 Verificar JSON Viewer
1. Clicar em submissão com `status = 'completed'`
2. Expandir "Apify Raw Data"
3. Expandir "Analysis Result"

**Expected:**
- ✅ JSON formatado e legível
- ✅ Dados de scraping visíveis (nome, localização, rating)
- ✅ Análise do Claude visível (health_score, recommendations)

### 4.4 Testar "Test Scraper" Button
1. Clicar botão "Test Scraper with Pestana Palace"
2. Aguardar resposta (30-60s)

**Expected:**
- ✅ Nova submissão criada
- ✅ Toast de confirmação
- ✅ Tabela atualiza com novo entry

### Test 4 Success Criteria
- [ ] Debug page acessível
- [ ] Filtros funcionam
- [ ] JSON viewer exibe dados
- [ ] Test button cria submissão
- [ ] UI responsivo e sem erros

---

## Performance Benchmarks 📊

### Target Metrics

| Métrica | Target | Aceitável | Critical |
|---------|--------|-----------|----------|
| Submission → Completed | 2-5 min | <8 min | >10 min |
| Scraping Duration | 60-120s | <180s | >240s |
| Analysis Duration | 30-90s | <120s | >180s |
| PDF Generation | 10-30s | <60s | >90s |
| Success Rate | >90% | >80% | <70% |

### Actual Results (preencher após testes)

| Teste | Duration | Status | Notes |
|-------|----------|--------|-------|
| Test 1 - Booking.com | ___:___ | ⬜ | |
| Test 2 - Analytics | ___:___ | ⬜ | |
| Test 3 - Invalid URL | ___:___ | ⬜ | |
| Test 4 - Debug Page | ___:___ | ⬜ | |

---

## Troubleshooting 🔧

### Submissão stuck em 'scraping'
```sql
-- Verificar run do Apify
SELECT actor_run_id, updated_at 
FROM diagnostic_submissions 
WHERE status = 'scraping';

-- Se >5 min, reprocessar:
SELECT * FROM supabase.functions.invoke('fix-stuck-submission');
```

### PDF não gera
```sql
-- Verificar storage bucket
SELECT * FROM storage.buckets WHERE id = 'premium-reports';

-- Verificar permissions
SELECT * FROM storage.policies WHERE bucket_id = 'premium-reports';
```

### Analytics vazias
```sql
-- Verificar se daily-ingest rodou
SELECT * FROM edge_function_logs 
WHERE function_name = 'daily-ingest'
ORDER BY created_at DESC LIMIT 10;

-- Trigger manualmente
SELECT * FROM supabase.functions.invoke('daily-ingest');
```

---

## Sign-Off ✍️

### Test Execution

**Executed by:** ___________________  
**Date:** ___________  
**Environment:** Production / Staging

### Results Summary

- [ ] All tests passed
- [ ] Some tests failed (see notes)
- [ ] Critical issues found

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

### Approval

**Approved for Production:** ☐ Yes ☐ No  
**Signature:** ___________________  
**Date:** ___________

---

## Next Steps

✅ **All tests passed?** → Proceed to production launch  
⚠️ **Some tests failed?** → Review and fix issues  
❌ **Critical issues?** → Do NOT deploy, escalate to team



The user is asking what the next steps are to get the site 100% functional. Let me think about the current state:

**What's working:**
- Scraping pipeline (Firecrawl + Apify)
- Claude AI analysis
- PDF report generation
- Admin dashboard with Phase 2 features (Goals, Reviews, Pricing, Export)
- Authentication & user roles
- 17 edge functions deployed
- Database schema with analytics tables

**Known pending items from conversation history:**
- 12 submissions stuck in `pending` (need batch reprocess)
- 11 submissions in `pending_manual_review` (page-not-found errors — invalid URLs)
- No automated cron jobs running yet (daily-ingest, KPI refresh)
- No email notifications when reports are ready
- Build had recent TS errors (now fixed)

**What's missing for 100% production:**
1. Backlog cleanup (12 pending submissions)
2. Automated cron jobs (daily-ingest, KPI refresh, smart alerts)
3. Email notifications to users when their report is ready
4. End-to-end QA on a fresh user flow
5. Maybe: monitoring/alerting setup

Let me present a concise prioritized plan.

---

# Próximo Passo: Levar o Site a 100%

## Estado Atual

Tudo o que é **core funciona**: scraping, análise IA, geração de PDF, dashboard admin, autenticação, e os 17 edge functions estão deployados. Faltam apenas peças de **automação e operação** para o site funcionar sem intervenção manual.

## Prioridades (ordem recomendada)

### 1. Limpar o Backlog (5 min)
- Processar as **12 submissões `pending`** que estão na fila via Admin Dashboard → Reprocess
- Confirmar que terminam em `completed` com PDF gerado
- As 11 em `pending_manual_review` ficam de fora (URLs inválidos do utilizador)

### 2. Ativar Cron Jobs Automáticos (15 min)
Sem isto, os KPIs e analytics nunca atualizam. Configurar via SQL:
- **`daily-ingest`** — diário às 03:00 UTC, popula `fact_daily` com dados novos
- **`refresh_all_kpi_views`** — diário às 03:30 UTC, refresca materialized views
- **`admin-smart-alerts`** — de hora em hora, deteta anomalias
- **`fix-stuck-submission`** — a cada 15 min, recupera submissões presas

### 3. Notificações por Email ao Utilizador (20 min)
Atualmente o utilizador submete e... não sabe quando o relatório está pronto. Falta:
- Trigger no edge function `generate-premium-pdf` (no fim, com sucesso) → invoca `send-diagnostic-email`
- Template de email com link direto para o relatório PDF
- Email de erro quando submissão vai para `pending_manual_review` (URL inválido)

### 4. QA End-to-End Final (10 min)
- Submeter 1 propriedade nova como utilizador anónimo
- Verificar: pending → scraping → analyzing → completed em <5 min
- Confirmar receção do email com link para o PDF
- Abrir o PDF e validar que o relatório premium renderiza corretamente

### 5. (Opcional) Monitorização Contínua
- Configurar alertas para `success rate < 80%` ou `>5 submissões stuck`
- Dashboard de métricas já existe em Admin → System Health

## Recomendação

Começar pelo **passo 2 (cron jobs)** porque é o que tem maior impacto — sem isto o sistema de analytics fica congelado. O passo 1 (backlog) pode correr em paralelo. Os passos 3 e 4 fecham o loop de utilizador final.

## Detalhe Técnico

- Cron jobs usam `pg_cron` + `pg_net` (já disponíveis no Lovable Cloud)
- SQL inserido via tool de inserts (não via migration, porque contém URLs específicos do projeto)
- Email trigger: adicionar chamada a `supabase.functions.invoke('send-diagnostic-email', ...)` no fim do `generate-premium-pdf` quando `status === 'completed'`
- Template de email já parcialmente existe em `send-diagnostic-email/index.ts` — só precisa de variante "report ready"


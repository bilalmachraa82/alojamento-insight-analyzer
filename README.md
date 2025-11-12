# Maria Faz - Alojamento Insight Analyzer

**Status:** ✅ **PRODUCTION READY**  
**Version:** 1.0.0  
**Project URL**: https://lovable.dev/projects/9bf4dc89-2484-418e-af13-fb4c8e7dbd1e

## 🎯 Project Overview

Maria Faz é uma plataforma SaaS para análise inteligente de alojamentos locais (Airbnb, Booking.com, VRBO) em Portugal. Utiliza scraping avançado (Apify) e análise AI (Claude) para gerar relatórios premium com health scores, análise competitiva, estratégias de pricing e KPIs operacionais.

## 🚀 Quick Start

### For End Users
1. **Visit:** [Production URL] (após deploy)
2. **Submit:** URL do seu alojamento (Booking.com)
3. **Receive:** Relatório premium com análise completa em 2-5 minutos

### For Developers

**Local Development:**
```sh
# Clone repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start dev server
npm run dev
```

**Testing:**
```sh
# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build
```

### For Administrators

**Production Deployment:**
1. Follow [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
2. Configure cron job: [CRON_SETUP.md](./CRON_SETUP.md)
3. Run E2E tests: [TESTING_E2E.md](./TESTING_E2E.md)
4. Setup monitoring: [MONITORING_QUERIES.sql](./MONITORING_QUERIES.sql)

## 🏗️ Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS + shadcn-ui
- **Routing:** React Router v6
- **State:** TanStack Query
- **Forms:** React Hook Form + Zod

### Backend (Lovable Cloud / Supabase)
- **Database:** PostgreSQL (Star Schema)
- **Functions:** 17 Edge Functions (Deno runtime)
- **Storage:** Supabase Storage (premium-reports bucket)
- **Auth:** Supabase Auth (email/password)
- **Cron:** pg_cron (daily-ingest)

### Integrations
- **Scraping:** Apify (`dtrungtin/booking-scraper`)
- **AI Analysis:** Claude 3.5 Sonnet (via Anthropic API)
- **Email:** Resend (transactional emails)
- **Monitoring:** Sentry + Google Analytics 4

### Analytics Engine
- **5 Dimension Tables:** Properties, Competitors, Channels, Events, Date
- **5 Fact Tables:** Daily KPIs, Channels, Reviews, Sentiment, Competitors
- **3 Materialized Views:** KPI aggregations (daily refresh)

## 📦 Features

### Core Features ✅
- [x] **Booking.com Scraper** - Extração automática de dados (reviews, pricing, ratings)
- [x] **Claude AI Analysis** - Health Score (0-100) + insights acionáveis
- [x] **Premium PDF Reports** - Relatórios visuais com gráficos e recomendações
- [x] **Error Recovery** - Sistema de retry automático (max 2 tentativas)
- [x] **Debug Interface** - Página `/debug` para monitoramento admin
- [x] **Analytics Engine** - 13 tabelas + 3 materialized views para KPIs

### In Progress 🚧
- [ ] **Email Notifications** - Alertas de relatório pronto
- [ ] **Apify Webhooks** - Atualizações de status em tempo real
- [ ] **Admin Dashboard** - Interface completa de gestão
- [ ] **Multi-platform Support** - Airbnb + VRBO scrapers

### Planned 📋
- [ ] **Rate Limiting** - Proteção contra abuse (10 req/min)
- [ ] **User Authentication** - Sistema de contas premium
- [ ] **Payment Integration** - Stripe para planos pagos
- [ ] **Competitive Analysis** - Comparação automática com concorrentes

## 🚀 Deployment

### Production Deploy
1. **Via Lovable:**
   - Click "Publish" em [Lovable Project](https://lovable.dev/projects/9bf4dc89-2484-418e-af13-fb4c8e7dbd1e)
   - Aguardar 2-3 minutos para build completo
   - Edge Functions deployadas automaticamente

2. **Custom Domain (Optional):**
   - Project > Settings > Domains > Connect Domain
   - [Setup Guide](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

3. **Post-Deploy:**
   - Configure cron job: [CRON_SETUP.md](./CRON_SETUP.md)
   - Run E2E tests: [TESTING_E2E.md](./TESTING_E2E.md)
   - Verify checklist: [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)

## 📊 Monitoring & Maintenance

### Daily Checks (5 min)
Execute estas queries em Lovable Cloud → Database:

```sql
-- 1. Health Check (últimas 24h)
SELECT status, COUNT(*), ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) 
FROM diagnostic_submissions 
WHERE created_at > NOW() - INTERVAL '24 hours' 
GROUP BY status;

-- 2. Stuck Submissions (>30 min)
SELECT id, status, email, property_url, 
  ROUND(EXTRACT(EPOCH FROM (NOW() - updated_at))/60, 1) as minutes_stuck
FROM diagnostic_submissions 
WHERE status IN ('processing', 'scraping', 'analyzing') 
  AND updated_at < NOW() - INTERVAL '30 minutes';
```

**Todas as queries:** [MONITORING_QUERIES.sql](./MONITORING_QUERIES.sql)

### Weekly Reviews (30 min)
- [ ] Success rate ≥80% (target: 90%)
- [ ] Avg processing time ≤5 min
- [ ] Storage usage <80%
- [ ] Review error logs
- [ ] Plan optimizations

### Alert Thresholds
| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Success Rate | <80% | <70% | Investigate immediately |
| Stuck Submissions | >3 | >5 | Run `fix-stuck-submission` |
| Avg Processing | >8 min | >10 min | Optimize scrapers |
| Storage | >70% | >85% | Cleanup old files |

## 📚 Documentation

### For Administrators
- **[Production Checklist](./PRODUCTION_CHECKLIST.md)** - Complete deployment guide
- **[Cron Setup](./CRON_SETUP.md)** - Configure daily-ingest job
- **[E2E Testing](./TESTING_E2E.md)** - Comprehensive test suite
- **[Monitoring Queries](./MONITORING_QUERIES.sql)** - SQL queries for health checks

### For Developers
- **[Testing Guide](./.github/TESTING_GUIDE.md)** - Unit + integration tests
- **[Deployment Guide](./DEPLOY_NOW.md)** - Step-by-step deployment
- **[Vercel Setup](./VERCEL_SETUP.md)** - Alternative deployment option

### For SEO/Marketing
- **[SEO Guide](./docs/SEO-GUIDE.md)** - Comprehensive SEO implementation
- **[SEO Checklist](./docs/SEO-CHECKLIST.md)** - Pre-launch checklist
- **[OG Image Guide](./public/og-image-instructions.md)** - Social media assets

## 🔧 Troubleshooting

### Submission Stuck in 'scraping'
```sql
-- Reprocess manually
SELECT * FROM supabase.functions.invoke(
  'reprocess-submission',
  body := jsonb_build_object('submissionId', '<ID>')
);
```

### Analytics Tables Empty
```sql
-- Trigger daily-ingest manually
SELECT * FROM supabase.functions.invoke('daily-ingest');

-- Refresh materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_daily;
```

### PDF Not Generating
1. Check storage bucket: `premium-reports` exists and is public
2. Verify function logs: Lovable Cloud → Functions → generate-premium-pdf
3. Check analysis_result: must be populated before PDF generation

### More Help
- [Lovable Docs](https://docs.lovable.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Project Issues](https://github.com/YOUR_REPO/issues)

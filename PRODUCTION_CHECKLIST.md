# 🚀 Production Deployment Checklist

**Project:** Maria Faz - Alojamento Insight Analyzer  
**Version:** 1.0.0  
**Last Updated:** 2025-01-12

---

## Pre-Deploy Verification ✅

### Code Quality
- [x] TypeScript compila sem erros (`npm run typecheck`)
- [x] ESLint passa sem warnings (`npm run lint`)
- [x] Build completa com sucesso (`npm run build`)
- [x] Todos os testes unitários passam
- [x] Sem console.log em código de produção

### Frontend
- [x] Todas as páginas carregam corretamente
- [x] Formulário de diagnóstico funcional
- [x] Navegação entre páginas funciona
- [x] Responsive design testado (mobile/tablet/desktop)
- [x] SEO meta tags configuradas
- [x] Página 404 personalizada
- [x] Debug page acessível em `/debug`

### Backend (Edge Functions)
- [x] 17 Edge Functions deployadas:
  - [x] `process-diagnostic` - processamento principal
  - [x] `check-scrape-status` - verifica status Apify
  - [x] `analyze-property-claude` - análise AI
  - [x] `generate-premium-pdf` - gera relatórios
  - [x] `send-diagnostic-email` - notificações
  - [x] `fix-stuck-submission` - recovery automático
  - [x] `reprocess-submission` - reprocessamento manual
  - [x] `daily-ingest` - ingestão dados analytics
  - [x] Funções admin (cleanup, logs, health)

### Database
- [x] Todas as migrations aplicadas
- [x] RLS policies configuradas e testadas
- [x] Tabelas analytics criadas:
  - [x] 5 Dimension tables (dim_*)
  - [x] 5 Fact tables (fact_*)
  - [x] 3 Materialized views (kpi_*)
  - [x] 1 Main table (diagnostic_submissions)
- [x] Indexes otimizados
- [x] Triggers funcionais

### Integrations
- [x] Apify API configurada
  - [x] APIFY_API_TOKEN secret
  - [x] Booking.com scraper (`dtrungtin/booking-scraper`)
  - [x] Timeout: 300s
  - [x] Max retry: 2
- [x] Claude API configurada
  - [x] CLAUDE_API_KEY secret
  - [x] Model: claude-3-5-sonnet-20241022
  - [x] Max tokens: 16000
- [x] Resend Email configurada
  - [x] RESEND_API_KEY secret
  - [x] Templates criados
- [x] Supabase Storage
  - [x] Bucket `premium-reports` público
  - [x] Políticas de acesso configuradas

### Security
- [x] Todos os secrets configurados via Lovable Cloud
- [x] RLS policies protegem dados sensíveis
- [x] CORS configurado nas Edge Functions
- [x] Validação de input em todos os endpoints
- [x] Rate limiting considerado (futuro)

---

## Deployment Steps 🚀

### Step 1: GitHub Sync (5 min)
- [ ] Confirmar último commit em `main` branch
- [ ] Verificar que não há conflitos
- [ ] Tag da versão criada (`v1.0.0`)

```bash
git status
git log --oneline -5
git tag v1.0.0
git push origin v1.0.0
```

### Step 2: Lovable Deploy (3 min)
- [ ] Clicar "Publish" em Lovable
- [ ] Aguardar build completo (2-3 min)
- [ ] Verificar URL de produção ativo
- [ ] Confirmar Edge Functions deployadas

### Step 3: Cron Job Setup (10 min)
- [ ] Seguir instruções em `CRON_SETUP.md`
- [ ] Executar SQL para configurar `daily-ingest`
- [ ] Testar execução manual
- [ ] Verificar logs de execução

### Step 4: Monitoring Configuration (5 min)
- [ ] Salvar queries de `MONITORING_QUERIES.sql` em ferramenta favorita
- [ ] Configurar alertas para submissões stuck (>30 min)
- [ ] Setup dashboard (opcional - Grafana/Datadog)
- [ ] Testar query de health check

---

## Post-Deploy Testing 🧪

### End-to-End Test (30 min)
Seguir guia completo em `TESTING_E2E.md`

#### Test 1: Booking.com Submission
- [ ] URL teste: `https://www.booking.com/hotel/pt/pestana-palace-lisboa.pt-pt.html`
- [ ] Submissão criada com status `pending`
- [ ] Transitions: pending → processing → scraping → analyzing → completed
- [ ] Tempo total: 2-5 minutos
- [ ] PDF gerado e acessível
- [ ] Email enviado (se configurado)

#### Test 2: Invalid URL
- [ ] URL inválida testada
- [ ] Status muda para `pending_manual_review`
- [ ] Error message descritivo
- [ ] Toast ao utilizador exibido

#### Test 3: Debug Page
- [ ] Aceder `/debug`
- [ ] Últimas submissões visíveis
- [ ] Filtros por status funcionam
- [ ] JSON viewer exibe Apify data
- [ ] Botão "Test Scraper" funciona

#### Test 4: Analytics System
- [ ] Nova property em `dim_property`
- [ ] Dados em `fact_daily` (após daily-ingest)
- [ ] Materialized views populadas
- [ ] KPIs calculados corretamente

### Performance Testing
- [ ] Homepage load time < 2s
- [ ] Form submission < 5s
- [ ] PDF generation < 30s
- [ ] Total E2E flow: 2-5 min
- [ ] Concurrent submissions: teste 3+ simultâneas

### Browser Testing
- [ ] Chrome (desktop + mobile)
- [ ] Firefox
- [ ] Safari (desktop + iOS)
- [ ] Edge

---

## Monitoring Setup 📊

### Daily Checks (5 min/dia)
- [ ] Executar query #1: Health Check (últimas 24h)
- [ ] Executar query #2: Stuck Submissions
- [ ] Verificar query #3: Success Rate (meta: >80%)
- [ ] Revisar query #5: Recent Errors

### Weekly Reviews (30 min/semana)
- [ ] Executar todas as 12 queries de `MONITORING_QUERIES.sql`
- [ ] Analisar Platform Performance
- [ ] Revisar Claude API usage
- [ ] Verificar Storage usage
- [ ] Avaliar Retry effectiveness

### Alert Thresholds
| Métrica | Threshold | Ação |
|---------|-----------|------|
| Success Rate | < 70% | Investigar imediatamente |
| Stuck Submissions | > 5 | Executar `fix-stuck-submission` |
| Avg Processing Time | > 10 min | Otimizar scrapers |
| Failed Submissions | > 20% | Revisar error logs |
| Storage Usage | > 80% | Cleanup old files |

---

## Success Criteria ✅

### Immediate (Dia 1)
- [ ] ≥1 submissão completa E2E (pending → completed)
- [ ] PDF gerado e publicamente acessível
- [ ] Zero erros críticos em produção
- [ ] Cron job executou com sucesso

### Short-term (Primeira Semana)
- [ ] ≥10 submissões processadas
- [ ] Success rate ≥80%
- [ ] Avg processing time ≤5 min
- [ ] Zero downtime
- [ ] Feedback positivo de utilizadores beta

### Medium-term (Primeiro Mês)
- [ ] ≥100 submissões processadas
- [ ] Success rate ≥85%
- [ ] Analytics tables populadas diariamente
- [ ] Email notifications ativas
- [ ] Admin dashboard funcional

---

## Rollback Plan 🔄

### Se problemas críticos ocorrerem:

1. **Frontend Issues:**
   ```bash
   # Rollback via Lovable History
   # Settings → History → Restore previous version
   ```

2. **Edge Function Issues:**
   - Identificar função problemática em Lovable Cloud → Functions
   - Desativar temporariamente
   - Rollback código via History
   - Re-deploy

3. **Database Issues:**
   - **NÃO** executar rollback de migrations sem backup
   - Contactar suporte Lovable se necessário
   - Usar query de diagnóstico para identificar problema

4. **Critical Bug Process:**
   - Marcar todas submissões afetadas como `pending_manual_review`
   - Notificar utilizadores via email
   - Fix issue
   - Reprocessar com `reprocess-submission` function

---

## Documentation Updates 📚

- [ ] `README.md` atualizado com status "✅ PRODUCTION"
- [ ] `MONITORING_QUERIES.sql` criado
- [ ] `TESTING_E2E.md` criado
- [ ] `CRON_SETUP.md` criado
- [ ] `PRODUCTION_CHECKLIST.md` (este ficheiro) criado
- [ ] Guides linkados em README

---

## Final Sign-Off ✍️

### Technical Lead
- [ ] Code review completo
- [ ] Todos os testes passam
- [ ] Performance aceitável
- [ ] Security verificada

**Assinatura:** ___________________  **Data:** ___________

### Product Owner
- [ ] Funcionalidade completa
- [ ] UX satisfatória
- [ ] Documentação adequada
- [ ] Pronto para utilizadores

**Assinatura:** ___________________  **Data:** ___________

---

## Post-Launch Tasks 📋

### Immediate (Dia 1)
- [ ] Anunciar lançamento (email, social media)
- [ ] Monitorizar logs ativamente (cada 2h)
- [ ] Responder a feedback rapidamente
- [ ] Documentar issues emergentes

### Week 1
- [ ] Daily monitoring checks
- [ ] Gather user feedback
- [ ] Prioritize quick wins
- [ ] Plan iteration 1.1

### Month 1
- [ ] Implement Apify webhooks
- [ ] Add email notifications
- [ ] Build admin dashboard
- [ ] Optimize performance

---

## 🎉 READY FOR PRODUCTION!

**Current Status:** ✅ All pre-deploy checks passed  
**Deployment Date:** _____________  
**Production URL:** https://[seu-dominio].lovable.app  
**Version:** 1.0.0

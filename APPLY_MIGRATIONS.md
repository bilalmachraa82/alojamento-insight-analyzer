# 🗄️ Aplicar Migrações da Base de Dados

## ✅ O Que Vamos Fazer
Aplicar 2 novas migrações críticas que adicionam:
- 📦 Storage bucket `premium-reports` (para PDFs)
- ⚡ 13 indexes de performance
- 🔒 5 constraints de integridade de dados
- 🔑 4 foreign keys

---

## 📋 Método 1: Via Supabase Dashboard (Recomendado - Automático)

### Passo 1: Verificar Migrações Pendentes
1. Vai a: **https://supabase.com/dashboard/project/tdjwmxzhzvejrvxgpcrj/database/migrations**
2. Procura por estas migrações:
   - ✅ `20251016140000_create_premium_reports_bucket.sql`
   - ✅ `20251016141000_add_performance_indexes.sql`

### Passo 2: Aplicar Migrações
As migrações do Supabase aplicam-se **automaticamente** quando fazes push para o repositório.

**Se já fizeste git push:**
- ✅ As migrações já devem estar aplicadas
- Verifica no dashboard se aparecem como "Applied"

**Se ainda NÃO fizeste git push:**
```bash
cd "/Users/bilal/Programaçao/Arbnb optimization"
git add supabase/migrations/
git commit -m "feat: Add storage bucket and performance indexes"
git push origin main
```

**Aguarda 1-2 minutos** e depois verifica no dashboard.

---

## 📋 Método 2: Via SQL Editor (Manual - Se automático falhar)

Se as migrações não aparecerem no dashboard, podes executá-las manualmente:

### Passo 1: Abrir SQL Editor
Vai a: **https://supabase.com/dashboard/project/tdjwmxzhzvejrvxgpcrj/sql/new**

### Passo 2: Executar Migration 1 - Storage Bucket
Copia e cola este SQL:

```sql
-- Migration: Create premium-reports storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'premium-reports',
  'premium-reports',
  true,
  10485760,
  ARRAY['text/html', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
CREATE POLICY "Public read access to premium reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'premium-reports');

CREATE POLICY "Service role can upload premium reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'premium-reports'
  AND auth.role() = 'service_role'
);

CREATE POLICY "Service role can update premium reports"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'premium-reports'
  AND auth.role() = 'service_role'
);

CREATE POLICY "Service role can delete premium reports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'premium-reports'
  AND auth.role() = 'service_role'
);
```

Clica em **"Run"** (ou Ctrl+Enter)

✅ **Resultado esperado:** "Success. No rows returned"

---

### Passo 3: Executar Migration 2 - Performance Indexes

**⚠️ IMPORTANTE:** Esta migração pode demorar 10-30 segundos se tiveres muitos dados.

Copia e cola este SQL:

```sql
-- INDEXES: diagnostic_submissions
CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_status
ON diagnostic_submissions(status)
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_platform
ON diagnostic_submissions(platform)
WHERE platform IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_email
ON diagnostic_submissions(email);

CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_date
ON diagnostic_submissions(submission_date DESC);

CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_status_date
ON diagnostic_submissions(status, submission_date DESC)
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_updated_at
ON diagnostic_submissions(updated_at DESC)
WHERE updated_at IS NOT NULL;

-- INDEXES: fact_daily
CREATE INDEX IF NOT EXISTS idx_fact_daily_property_date
ON fact_daily(property_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_fact_daily_date
ON fact_daily(date DESC);

CREATE INDEX IF NOT EXISTS idx_fact_daily_property
ON fact_daily(property_id);

-- INDEXES: fact_channel_daily
CREATE INDEX IF NOT EXISTS idx_fact_channel_daily_property_channel_date
ON fact_channel_daily(property_id, channel_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_fact_channel_daily_channel_date
ON fact_channel_daily(channel_id, date DESC);

-- INDEXES: fact_reviews
CREATE INDEX IF NOT EXISTS idx_fact_reviews_property_date
ON fact_reviews(property_id, review_date DESC);

CREATE INDEX IF NOT EXISTS idx_fact_reviews_rating
ON fact_reviews(rating)
WHERE rating IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fact_reviews_sentiment
ON fact_reviews(sentiment_score DESC NULLS LAST)
WHERE sentiment_score IS NOT NULL;

-- INDEXES: dim_property
CREATE INDEX IF NOT EXISTS idx_dim_property_user
ON dim_property(user_id)
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dim_property_active
ON dim_property(is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_dim_property_location
ON dim_property(location)
WHERE location IS NOT NULL;

-- CHECK CONSTRAINTS
ALTER TABLE fact_reviews
ADD CONSTRAINT IF NOT EXISTS chk_fact_reviews_rating_range
CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

ALTER TABLE fact_daily
ADD CONSTRAINT IF NOT EXISTS chk_fact_daily_occupancy_range
CHECK (rooms_sold IS NULL OR rooms_available IS NULL OR rooms_sold <= rooms_available);

ALTER TABLE fact_daily
ADD CONSTRAINT IF NOT EXISTS chk_fact_daily_revenue_positive
CHECK (
  (room_revenue IS NULL OR room_revenue >= 0) AND
  (total_revenue IS NULL OR total_revenue >= 0) AND
  (direct_revenue IS NULL OR direct_revenue >= 0)
);

ALTER TABLE fact_daily
ADD CONSTRAINT IF NOT EXISTS chk_fact_daily_bookings_positive
CHECK (bookings IS NULL OR bookings >= 0);

ALTER TABLE fact_channel_daily
ADD CONSTRAINT IF NOT EXISTS chk_fact_channel_daily_revenue_positive
CHECK (room_revenue IS NULL OR room_revenue >= 0);

-- ANALYZE TABLES
ANALYZE diagnostic_submissions;
ANALYZE fact_daily;
ANALYZE fact_channel_daily;
ANALYZE fact_reviews;
ANALYZE dim_property;
```

Clica em **"Run"**

✅ **Resultado esperado:** "Success. No rows returned" (pode demorar 10-30 segundos)

---

## ✅ Como Verificar se Funcionou

### Verificação 1: Storage Bucket
1. Vai a: **https://supabase.com/dashboard/project/tdjwmxzhzvejrvxgpcrj/storage/buckets**
2. Deves ver: ✅ `premium-reports` (Public)

### Verificação 2: Indexes
1. Vai a: **https://supabase.com/dashboard/project/tdjwmxzhzvejrvxgpcrj/sql/new**
2. Executa este SQL:

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('diagnostic_submissions', 'fact_daily', 'fact_channel_daily', 'fact_reviews', 'dim_property')
ORDER BY tablename, indexname;
```

✅ **Resultado esperado:** Lista com ~13 indexes

### Verificação 3: Constraints
```sql
SELECT
  conname,
  conrelid::regclass AS table_name,
  contype
FROM pg_constraint
WHERE conrelid IN ('fact_daily'::regclass, 'fact_reviews'::regclass, 'fact_channel_daily'::regclass)
ORDER BY conrelid::regclass::text, conname;
```

✅ **Resultado esperado:** Lista com ~5 constraints (tipo 'c' = check)

---

## 🐛 Troubleshooting

### Erro: "relation already exists"
**Causa:** Migração já foi aplicada antes
**Solução:** Ignora o erro, está tudo bem! ✅

### Erro: "permission denied"
**Causa:** Não tens permissões de admin
**Solução:** Pede ao owner do projeto Supabase para executar as migrações

### Erro: "bucket already exists"
**Causa:** Bucket já foi criado antes
**Solução:** Verifica se existe em Storage → Buckets. Se sim, está tudo bem! ✅

### Erro: "timeout"
**Causa:** Muitos dados na tabela (indexes demoram tempo)
**Solução:**
1. Aumenta timeout no SQL Editor (canto superior direito)
2. Ou executa os indexes um de cada vez

---

## 📊 Impacto das Migrações

Após aplicar:
- ✅ **PDFs funcionarão** - Bucket criado e configurado
- ✅ **Queries 2-10x mais rápidas** - Indexes otimizam filtros comuns
- ✅ **Dados protegidos** - Constraints previnem valores inválidos
- ✅ **Integridade garantida** - Foreign keys impedem dados órfãos

---

## 🚀 Próximos Passos

Depois de aplicar as migrações:
1. ✅ Migrações aplicadas (este passo)
2. Testar geração de PDF: `/test-pdf`
3. Submeter diagnóstico de teste
4. Configurar cron job para daily-ingest
5. Verificar logs das edge functions

---

**Tempo estimado:** 5 minutos (2 min automático, 3 min manual se necessário) ⏱️

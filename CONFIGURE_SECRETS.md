# 🔐 Configurar Edge Function Secrets

## ⚠️ IMPORTANTE
As chaves **APIFY_API_TOKEN** e **CLAUDE_API_KEY** foram removidas do `.env` (onde não funcionavam) e precisam ser configuradas nos **Edge Function Secrets** do Supabase.

---

## 📋 Método 1: Via Supabase Dashboard (Recomendado - 2 minutos)

### Passo 1: Aceder à página de secrets
1. Vai a: https://supabase.com/dashboard/project/tdjwmxzhzvejrvxgpcrj/settings/functions
2. Ou: Dashboard → Project Settings → Edge Functions → Secrets

### Passo 2: Adicionar os secrets
Clica em **"Add new secret"** e adiciona estes 2 secrets:

#### Secret 1: APIFY_API_TOKEN
```
Name: APIFY_API_TOKEN
Value: apify_api_TRHueq2leMcxHjjhgFmv5SgGjLVhbE0hni1D
```

#### Secret 2: CLAUDE_API_KEY
```
Name: CLAUDE_API_KEY
Value: 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
```

### Passo 3: Verificar
Após adicionar, deves ver 2 secrets na lista:
- ✅ APIFY_API_TOKEN
- ✅ CLAUDE_API_KEY

---

## 📋 Método 2: Via Supabase CLI (Alternativo)

Se preferires usar o CLI, primeiro faz login:

```bash
# 1. Login no Supabase
supabase login

# 2. Link ao projeto (se ainda não estiver)
supabase link --project-ref tdjwmxzhzvejrvxgpcrj

# 3. Adicionar secrets
supabase secrets set APIFY_API_TOKEN="apify_api_TRHueq2leMcxHjjhgFmv5SsgGjLVhbE0hni1D"
supabase secrets set CLAUDE_API_KEY="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"

# 4. Verificar
supabase secrets list
```

---

## ✅ Como Verificar se Funcionou

### Teste 1: Via Dashboard
1. Vai a: https://supabase.com/dashboard/project/tdjwmxzhzvejrvxgpcrj/settings/functions
2. Deves ver os 2 secrets listados (valores ocultos por segurança)

### Teste 2: Submeter um diagnóstico
1. Vai a: http://localhost:5173
2. Preenche o formulário com um URL válido
3. Submete
4. Verifica os logs: https://supabase.com/dashboard/project/tdjwmxzhzvejrvxgpcrj/functions/process-diagnostic/logs
5. **Deve aparecer:** "✅ Environment validation passed"
6. **NÃO deve aparecer:** "❌ Missing required environment variables"

---

## 🔒 Segurança

✅ **Correto:**
- Secrets configurados no Supabase Dashboard ← **Aqui**
- Apenas visíveis para ti no dashboard
- Edge functions acedem automaticamente

❌ **Errado (anterior):**
- ~~Secrets no ficheiro `.env`~~ ← Removido
- ~~Expostos no código frontend~~
- ~~Não funcionavam nas edge functions~~

---

## 📝 Notas Importantes

1. **Os secrets são server-side only**
   - Apenas as edge functions (Deno) conseguem acedê-los
   - O frontend React **nunca** vê estes valores

2. **Valores sensíveis**
   - NUNCA committes secrets no Git
   - O `.env` agora só tem variáveis públicas (`VITE_*`)

3. **Local development**
   - Se quiseres testar edge functions localmente:
   - Cria `.env.local` (git-ignored) com os secrets
   - Ou usa: `supabase functions serve` com secrets configurados

---

## 🚀 Próximos Passos (Depois de configurar)

1. ✅ Configurar secrets (este passo)
2. Aplicar migrações: `supabase db push`
3. Testar end-to-end: Seguir [TESTING_GUIDE.md](.github/TESTING_GUIDE.md)
4. Configurar cron job para daily-ingest
5. Deploy para produção

---

**Tempo estimado:** 2 minutos para configurar via Dashboard 🎯

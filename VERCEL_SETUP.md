# 🚀 Vercel Deploy - Passo a Passo Completo

**Tempo:** 3-5 minutos
**Custo:** $0 (free tier)
**Dificuldade:** Muito fácil

---

## Pré-requisitos

- [x] Código no GitHub
- [ ] Conta GitHub (já tens)
- [ ] Keys do Supabase
- [ ] Conta Vercel (vais criar agora)

---

## Passo 1: Obter Keys do Supabase (1 minuto)

### 1.1 Ir para Supabase Dashboard
```
https://app.supabase.com/projects
```

### 1.2 Selecionar o teu projeto

### 1.3 Ir para Settings → API
```
https://app.supabase.com/project/SEU_PROJECT_ID/settings/api
```

### 1.4 Copiar estas duas coisas:
```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANTE:** Guarda estas num ficheiro de texto temporário!

---

## Passo 2: Deploy no Vercel (3 minutos)

### 2.1 Ir para Vercel
```
https://vercel.com/new
```

### 2.2 Login com GitHub
- Click "Continue with GitHub"
- Autorizar Vercel
- Permite acesso ao repositório

### 2.3 Import Repository
1. Procurar: `alojamento-insight-analyzer`
2. Click "Import"

### 2.4 Configure Project

**Vercel detecta automaticamente:**
- ✅ Framework: Vite
- ✅ Root Directory: ./
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`
- ✅ Install Command: `npm install`

**NÃO MEXER NESTAS CONFIGURAÇÕES!**

### 2.5 Environment Variables

Click em "Environment Variables" e adicionar:

**OBRIGATÓRIAS:**

Nome: `VITE_SUPABASE_URL`
Valor: `https://xxxxx.supabase.co` (do passo 1)

Nome: `VITE_SUPABASE_ANON_KEY`
Valor: `eyJhbGci...` (do passo 1)

**OPCIONAIS (pode adicionar depois):**

Nome: `VITE_SENTRY_DSN`
Valor: (se tiveres conta Sentry)

Nome: `VITE_GA4_MEASUREMENT_ID`
Valor: (se tiveres Google Analytics)

### 2.6 Deploy!

1. Click "Deploy"
2. Aguardar 2-3 minutos
3. Ver logs do build (opcional)
4. Aguardar mensagem: "🎉 Deployment Ready"

---

## Passo 3: Testar o Site (2 minutos)

### 3.1 Click no URL
Vercel mostra o URL:
```
https://alojamento-insight-analyzer.vercel.app
```

### 3.2 Verificar:
- [ ] Homepage carrega
- [ ] Click em "Começar Análise"
- [ ] Form aparece
- [ ] Preencher form
- [ ] Submeter (se tiveres URL de teste)

### 3.3 Testar Rotas:
- [ ] /test-emails
- [ ] /test-pdf (se aplicável)

---

## Passo 4: Custom Domain (Opcional)

### Se tens um domínio próprio:

#### 4.1 Ir para Settings
```
Project → Settings → Domains
```

#### 4.2 Add Domain
```
seudominio.com
```

#### 4.3 Configurar DNS

**No teu provider de domínio (GoDaddy, Namecheap, etc):**

Adicionar record CNAME:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

OU record A (para root domain):
```
Type: A
Name: @
Value: 76.76.21.21
```

#### 4.4 Verificar
- Aguardar 5-30 min (propagação DNS)
- Vercel verifica automaticamente
- SSL certificate auto-provisioned

---

## ✅ Deploy Completo!

Tens agora:
- ✅ Site ao vivo
- ✅ URL público
- ✅ Auto-deploy (cada push)
- ✅ Preview deploys (cada PR)
- ✅ SSL/HTTPS automático
- ✅ Global CDN

---

## 🔄 Auto-Deploy Configurado

### O que acontece agora?

**A cada push para main:**
1. Vercel detecta automaticamente
2. Build automático
3. Deploy automático
4. Novo URL ativo em 2-3 min

**A cada Pull Request:**
1. Vercel cria preview
2. URL único: `pr-123-alojamento.vercel.app`
3. Podes testar antes de merge
4. Comentário automático no PR com link

---

## 📊 Monitoring no Vercel

### Vercel Dashboard
```
https://vercel.com/dashboard
```

**Podes ver:**
- Deployments (todos)
- Analytics (visitors, performance)
- Logs (build e runtime)
- Usage (bandwidth, builds)

---

## 🚨 Troubleshooting

### Build Failed?

**Verificar:**
1. Ir para Deployment → View Build Logs
2. Ver erro específico
3. Provavelmente: environment variables em falta

**Solução:**
1. Settings → Environment Variables
2. Adicionar variáveis em falta
3. Deployments → ... → Redeploy

### Site mostra erro 500?

**Verificar:**
1. Functions → Logs
2. Ver se Supabase está a conectar
3. Verificar VITE_SUPABASE_URL está correto

**Solução:**
1. Verificar keys do Supabase
2. Redeploy

### Rotas mostram 404?

**Causa:** Configuração SPA

**Solução:**
Vercel detecta Vite automaticamente, deve funcionar.
Se não funcionar, criar `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 💰 Custos

### Free Tier (Atual)
- 100GB bandwidth/month
- 6,000 build minutes/month
- Unlimited deployments
- 1 team member

**Suficiente para:**
- 10,000+ visitors/month
- Desenvolvimento ativo
- 100+ deploys/month

### Se exceder (muito improvável)
- Pro plan: $20/month
- Mas só se tiveres muito sucesso!

---

## 🎯 Próximos Passos

### Depois do Deploy:

1. **Testar tudo:**
   - [ ] Todas as páginas
   - [ ] Form submission
   - [ ] PDF generation
   - [ ] Mobile

2. **Setup Analytics (opcional):**
   - [ ] Google Analytics
   - [ ] Sentry

3. **SEO:**
   - [ ] Google Search Console
   - [ ] Submit sitemap

4. **Marketing:**
   - [ ] Share URL
   - [ ] Get feedback
   - [ ] Iterate!

---

## 📞 Suporte

### Docs Vercel:
https://vercel.com/docs

### Community:
https://github.com/vercel/vercel/discussions

### Status:
https://www.vercel-status.com/

---

## 🎉 Parabéns!

Tens agora uma app SaaS premium ao vivo na internet! 🚀

**URL:** https://alojamento-insight-analyzer.vercel.app

**Próximo milestone:** Primeiros 100 users! 📈

---

**Dúvidas?** Consulta `DEPLOY_NOW.md` ou documentação oficial.

**Pronto para lançar?** VAMOS! 🎊

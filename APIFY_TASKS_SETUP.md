# 🎯 Configuração de Apify Tasks (Plano Gratuito)

## 📋 O Que São Tasks?

Tasks são configurações pré-definidas de actors que funcionam no **plano gratuito** do Apify.
Em vez de executar actors públicos diretamente (que requerem plano pago), crias uma Task baseada no actor e usas o Task ID.

## 🚀 Setup Completo (5 minutos)

### PASSO 1: Criar Tasks no Apify Console

#### 1.1 - Booking.com Task
1. Acede a: https://console.apify.com/actors/tasks
2. Clica em **"Create new task"**
3. Preenche:
   - **Actor**: `tTRAuL9PrLC9FqWkJ` (Booking.com Review Scraper)
   - **Task Name**: `booking-scraper-task`
   - **Input Configuration**:
   ```json
   {
     "maxItems": 1,
     "language": "en-US",
     "currency": "USD",
     "checkIn": "2025-12-20",
     "checkOut": "2025-12-23",
     "rooms": 1,
     "adults": 2,
     "proxyConfiguration": {
       "useApifyProxy": true
     }
   }
   ```
4. Clica **"Save"**
5. **COPIA O TASK ID** (formato: `xxxxxxxxxx` ou `username~taskname`)

#### 1.2 - Airbnb Task
1. Repete o processo acima com:
   - **Actor**: `GsNzxEKzE2vQ5d9HN` (Airbnb Scraper)
   - **Task Name**: `airbnb-scraper-task`
   - **Input Configuration**:
   ```json
   {
     "maxListings": 1,
     "currency": "USD",
     "calendarMonths": 1,
     "proxyConfiguration": {
       "useApifyProxy": true
     }
   }
   ```
2. **COPIA O TASK ID**

#### 1.3 - Agoda Task (Opcional)
1. Se quiseres suporte para Agoda:
   - **Actor**: `eC53oEoee74OTExo3` (Fast Agoda Reviews Scraper)
   - **Task Name**: `agoda-scraper-task`
   - **Input Configuration**:
   ```json
   {
     "maxItems": 1,
     "language": "en-US",
     "currency": "USD",
     "proxyConfiguration": {
       "useApifyProxy": true
     }
   }
   ```
2. **COPIA O TASK ID**

---

### PASSO 2: Configurar Secrets no Lovable Cloud

Tens **2 opções de configuração**:

#### OPÇÃO A: Task Global (1 Task para todas as plataformas)
✅ **Mais simples**
❌ Menos flexível

Se os 3 actors usam inputs similares, podes usar apenas 1 Task:

1. No Lovable, vai a **Settings → Secrets**
2. Adiciona este secret:
   - **Name**: `APIFY_TASK_ID`
   - **Value**: `<TASK_ID_DO_BOOKING>` (ou qualquer outro)

#### OPÇÃO B: Tasks Específicas por Plataforma (Recomendado)
✅ **Mais flexível** - cada plataforma usa seu actor otimizado
✅ **Melhor performance**

1. No Lovable, vai a **Settings → Secrets**
2. Adiciona estes 3 secrets:

| Secret Name | Value | Descrição |
|------------|-------|-----------|
| `APIFY_TASK_ID_BOOKING` | `<TASK_ID_DO_BOOKING>` | Task do Booking.com |
| `APIFY_TASK_ID_AIRBNB` | `<TASK_ID_DO_AIRBNB>` | Task do Airbnb |
| `APIFY_TASK_ID_AGODA` | `<TASK_ID_DO_AGODA>` | Task do Agoda (opcional) |

---

### PASSO 3: Verificar APIFY_API_TOKEN

1. Vai a: https://console.apify.com/account/integrations
2. Copia o **Personal API Token**
3. Confirma que está configurado em **Settings → Secrets**:
   - **Name**: `APIFY_API_TOKEN`
   - **Value**: `apify_api_xxxxxxxxx`

---

## 🔍 Como Funciona o Sistema de Prioridades

O código usa esta ordem de prioridade:

```
1. APIFY_TASK_ID_BOOKING (para platform=booking)
   ↓ (se não existir)
2. APIFY_TASK_ID (task global)
   ↓ (se não existir)
3. APIFY_ACTOR_ID (actor override)
   ↓ (se não existir)
4. Actor hardcoded no código (tTRAuL9PrLC9FqWkJ para booking)
```

**Exemplo prático**:
- User faz scraping de Booking → usa `APIFY_TASK_ID_BOOKING`
- User faz scraping de Airbnb → usa `APIFY_TASK_ID_AIRBNB`
- User faz scraping de VRBO → usa actor hardcoded (sem task configurada)

---

## ✅ Testar Configuração

### Teste 1: Verificar Logs
1. Vai a `/test-scraping`
2. Clica em **"Test Booking.com Scraping"**
3. Abre os logs da edge function: **Settings → Functions → process-diagnostic → Logs**
4. Deves ver:
   ```
   [Enhanced Apify] Platform-specific Task ID (APIFY_TASK_ID_BOOKING): xxxxxxxxxx
   [Enhanced Apify] Using TASK endpoint: https://api.apify.com/v2/actor-tasks/xxxxxxxxxx/runs
   ```

### Teste 2: Verificar Apify Console
1. Vai a: https://console.apify.com/actors/runs
2. Deves ver a run aparecer com:
   - **Status**: RUNNING → SUCCEEDED
   - **Actor**: Booking.com Review Scraper (via task)

### Teste 3: Testar Fluxo Completo
1. Vai a `/test-premium-flow`
2. Submete um URL válido
3. Aguarda 30-60 segundos
4. Verifica que o status muda para `scraping` → `analyzing` → `completed`

---

## 🐛 Troubleshooting

### ❌ Erro: "public-actor-disabled"
**Causa**: Ainda estás a tentar usar actor público sem task
**Solução**: Confirma que os secrets `APIFY_TASK_ID_*` estão configurados

### ❌ Erro: "Actor task not found"
**Causa**: Task ID incorreto ou task foi apagada
**Solução**: 
1. Vai a https://console.apify.com/actors/tasks
2. Confirma que a task existe
3. Copia o Task ID correto (botão "Copy task ID")

### ❌ Erro: "Invalid API token"
**Causa**: `APIFY_API_TOKEN` não está configurado ou expirou
**Solução**: 
1. Vai a https://console.apify.com/account/integrations
2. Gera novo token se necessário
3. Atualiza secret `APIFY_API_TOKEN`

### ❌ Task não aparece no console
**Causa**: Pode estar filtrado por "My actors" vs "All actors"
**Solução**: No console Apify, filtra por **"All runs"** ou **"Tasks"**

---

## 📊 Vantagens das Tasks vs Actors Diretos

| Aspecto | Actors Públicos | Tasks |
|---------|----------------|-------|
| **Plano** | Requer Team Plan ($49/mês) | ✅ Funciona no Free |
| **Configuração** | Simples (só Actor ID) | Requer criar tasks |
| **Flexibilidade** | Inputs dinâmicos | Inputs pré-configurados |
| **Custo** | $49/mês + consumo | ✅ Só consumo (free tier) |
| **Performance** | Idêntica | Idêntica |

---

## 🎯 Configuração Recomendada Final

Para máxima flexibilidade e aproveitar o plano gratuito:

```
✅ APIFY_API_TOKEN = apify_api_xxxxxxxxx
✅ APIFY_TASK_ID_BOOKING = <task-id-booking>
✅ APIFY_TASK_ID_AIRBNB = <task-id-airbnb>
⚠️ APIFY_TASK_ID_AGODA = <task-id-agoda> (opcional)
```

Com esta configuração:
- ✅ Funciona no plano gratuito
- ✅ Cada plataforma usa seu scraper otimizado
- ✅ Fácil adicionar novas plataformas
- ✅ Zero custos mensais (só consumo)

---

**Tempo estimado de setup**: 5 minutos
**Custo mensal**: $0 (plano gratuito + free tier executions)

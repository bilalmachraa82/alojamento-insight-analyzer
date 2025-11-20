# Configuração de Atores Apify

## ✅ Atores Configurados (2025-11-19)

### 🏨 Booking.com
- **Actor ID**: `tTRAuL9PrLC9FqWkJ`
- **Nome**: Booking.com Review Scraper
- **Status**: ✅ Ativo
- **Descrição**: Actor especializado em extrair reviews do Booking.com
- **Última verificação**: 2025-11-19
- **Funcionalidades**: Extrai propriedades, preços, amenidades, avaliações, localização e imagens

### 🏨 Agoda
- **Actor ID**: `eC53oEoee74OTExo3`
- **Nome**: Fast Agoda Reviews Scraper
- **Status**: ✅ Ativo
- **Descrição**: Actor especializado em extrair reviews do Agoda (alternativa para hotéis)
- **Última verificação**: 2025-11-19
- **Funcionalidades**: Extrai propriedades, preços, amenidades, avaliações e imagens

### 🏠 Airbnb
- **Actor ID**: `GsNzxEKzE2vQ5d9HN`
- **Status**: ✅ Ativo
- **Descrição**: Actor confiável para scraping de Airbnb
- **Última atualização**: 2025-11-19
- **Funcionalidades**: Extrai listagens, preços, amenidades, avaliações, host e imagens

### 🏖️ VRBO
- **Actor ID**: `powerai/vrbo-listing-scraper`
- **Status**: ✅ Ativo e funcional
- **Descrição**: Actor especializado em scraping de VRBO
- **Funcionalidades**: Extrai propriedades, preços, amenidades, avaliações e imagens

## 🔧 Sistema de Override (Prioridade)

O sistema usa a seguinte ordem de prioridade para escolher o ator:

1. **`APIFY_TASK_ID`** (maior prioridade)
   - Permite usar uma Task configurada no Apify Console
   - Ideal para configurações específicas e reutilizáveis

2. **`APIFY_ACTOR_ID`**
   - Override global para todos os scraping
   - Útil para testes ou uso de actor custom

3. **Atores hardcoded** (fallback padrão)
   - Booking: `runtime/booking-scraper`
   - Airbnb: `tri_angle/airbnb-scraper`
   - VRBO: `powerai/vrbo-listing-scraper`

## 📝 Configuração de Secrets

Para configurar um override, adicione nos Supabase Edge Function Secrets:

```bash
# Opção 1: Usar uma Task configurada (recomendado para produção)
APIFY_TASK_ID="username/task-name"

# Opção 2: Override global com actor específico
APIFY_ACTOR_ID="apify/website-content-crawler"

# Obrigatório: API Token do Apify
APIFY_API_TOKEN="apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## 🔍 Compatibilidade do Parser

O sistema de parsing em `check-scrape-status` detecta automaticamente o tipo de actor usado:

- **Booking**: Qualquer actor com "booking-scraper" no nome
- **Airbnb**: Qualquer actor com "airbnb-scraper" no nome
- **VRBO**: Qualquer actor com "vrbo-scraper" no nome
- **Genérico**: Fallback para estrutura genérica se não detectar padrão específico

## ⚙️ Configuração Específica por Plataforma

### Booking.com Config
```typescript
{
  maxItems: 1,
  language: "en-US",
  currency: "USD",
  checkIn: "+30 dias",
  checkOut: "+33 dias (3 noites)",
  rooms: 1,
  adults: 2,
  proxyConfiguration: { useApifyProxy: true }
}
```

### Airbnb Config
```typescript
{
  maxListings: 1,
  currency: "USD",
  calendarMonths: 1,
  proxyConfiguration: { useApifyProxy: true }
}
```

### VRBO Config
```typescript
{
  maxResults: 1,
  proxyConfiguration: { useApifyProxy: true }
}
```

## 🚫 O Que NÃO Fazer

❌ **Não usar scrapers genéricos** (como `apify/website-content-crawler`) para Booking/Airbnb
- Scrapers genéricos não extraem os dados estruturados necessários
- Resultam em parsing incompleto e erros

❌ **Não usar atores de terceiros não verificados**
- Podem não estar disponíveis na sua conta
- Podem ter rate limits ou custos diferentes
- Podem parar de funcionar sem aviso

✅ **Use sempre atores oficiais ou populares da comunidade**
- Maior estabilidade
- Melhor suporte
- Atualizações regulares

## 📊 Monitoramento

Para verificar se os atores estão funcionando corretamente:

1. **Admin Dashboard** → **System Health**
   - Verifica status da API do Apify
   - Mostra taxa de sucesso das últimas chamadas

2. **Logs do Apify Console**
   - Acesse: https://console.apify.com/actors/runs
   - Veja execuções recentes e seus resultados

3. **Supabase Edge Function Logs**
   - Verifique logs de `process-diagnostic`
   - Procure por `[EnhancedApify]` nos logs

## 🎯 Usar Apify Tasks (Plano Gratuito)

**⚠️ IMPORTANTE**: Se estás no plano gratuito do Apify, não podes executar actors públicos diretamente.
A solução é criar **Tasks** baseadas nos actors e usar os Task IDs.

### 🚀 Quick Setup

1. **Criar Tasks no Apify Console**:
   - Booking: https://console.apify.com/actors/tasks → Create task com `tTRAuL9PrLC9FqWkJ`
   - Airbnb: https://console.apify.com/actors/tasks → Create task com `GsNzxEKzE2vQ5d9HN`
   - Agoda: https://console.apify.com/actors/tasks → Create task com `eC53oEoee74OTExo3`

2. **Copiar Task IDs** gerados (formato: `xxxxxxxxxx`)

3. **Configurar Secrets no Lovable**:
   ```
   APIFY_TASK_ID_BOOKING = <task-id-booking>
   APIFY_TASK_ID_AIRBNB = <task-id-airbnb>
   APIFY_TASK_ID_AGODA = <task-id-agoda>
   ```

4. **OU usar Task Global (mais simples)**:
   ```
   APIFY_TASK_ID = <task-id-qualquer>
   ```

### 📋 Sistema de Prioridades

O código usa esta ordem:
1. `APIFY_TASK_ID_BOOKING` (para platform=booking)
2. `APIFY_TASK_ID` (task global)
3. `APIFY_ACTOR_ID` (actor override)
4. Actor hardcoded (fallback)

**Ver guia completo**: [APIFY_TASKS_SETUP.md](./APIFY_TASKS_SETUP.md)

## 🔄 Changelog

### 2025-11-19 (v2)
- ✅ Adicionado sistema de Tasks para plano gratuito
- ✅ Implementado suporte para `APIFY_TASK_ID_BOOKING`, `APIFY_TASK_ID_AIRBNB`, etc.
- ✅ Criado sistema de prioridades: Task Platform → Task Global → Actor Override → Default
- ✅ Criado guia completo de setup: [APIFY_TASKS_SETUP.md](./APIFY_TASKS_SETUP.md)

### 2025-11-19 (v1)
- ✅ Atualizado ator Booking: `runtime/booking-scraper` → `tTRAuL9PrLC9FqWkJ` (Booking.com Review Scraper)
- ✅ Adicionado suporte para Agoda: `eC53oEoee74OTExo3` (Fast Agoda Reviews Scraper)
- ✅ Atualizado ator Airbnb: `tri_angle/airbnb-scraper` → `GsNzxEKzE2vQ5d9HN` (Airbnb Scraper)
- ✅ Mantido ator VRBO: `powerai/vrbo-listing-scraper`
- ⚠️ Nota: Actor runtime/booking-scraper em manutenção

### 2025-11-15
- ✅ Corrigido ator Airbnb: `red.cars/airbnb-scraper` → `tri_angle/airbnb-scraper`
- ✅ Confirmado ator Booking: `runtime/booking-scraper`
- ✅ Confirmado ator VRBO: `powerai/vrbo-listing-scraper`
- ✅ Documentado sistema de prioridade e overrides
- ✅ Adicionado suporte para APIFY_TASK_ID e APIFY_ACTOR_ID

## 📚 Referências

- [Apify Platform Documentation](https://docs.apify.com/)
- [Booking Scraper Actor](https://apify.com/apify/booking-scraper)
- [Airbnb Scraper Actor](https://apify.com/tri_angle/airbnb-scraper)
- [VRBO Listing Scraper](https://apify.com/powerai/vrbo-listing-scraper)

---

**Última atualização**: 2025-11-15  
**Versão do sistema**: v2.0  
**Responsável**: Sistema Maria Faz Analytics

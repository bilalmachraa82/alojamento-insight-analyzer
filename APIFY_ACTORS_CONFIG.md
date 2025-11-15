# Configuração de Atores Apify

## ✅ Atores Configurados (2025-11-15)

### 🏨 Booking.com
- **Actor ID**: `runtime/booking-scraper`
- **Status**: ✅ Oficial do Apify Runtime
- **Descrição**: Actor oficial mantido pelo Apify para scraping de Booking.com
- **Última verificação**: 2025-11-15
- **Funcionalidades**: Extrai propriedades, preços, amenidades, avaliações, localização e imagens

### 🏠 Airbnb
- **Actor ID**: `tri_angle/airbnb-scraper`
- **Status**: ✅ Mantido oficialmente pela Apify
- **Popularidade**: 10K+ execuções
- **Última atualização**: Há 10 dias
- **Descrição**: Actor popular e confiável para scraping de Airbnb
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

## 🔄 Changelog

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

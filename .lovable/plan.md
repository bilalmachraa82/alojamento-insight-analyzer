# Auditoria & Plano de Resolução

## Diagnóstico

A app **carrega normalmente** (o erro de `SyntaxError: Export 'supabase'` que voltaste a ver no replay é apenas do bundle stale em cache do browser — basta hard refresh). O **erro real** que está a bloquear o pipeline está nos logs da edge function `analyze-property-claude`:

```
Your credit balance is too low to access the Anthropic API.
Please go to Plans & Billing to upgrade or purchase credits.
HTTP 400 - invalid_request_error
```

### Estado atual da base de dados

| Status | Submissions |
|---|---|
| `pending_manual_review` | **13** (presas devido ao erro Anthropic) |
| `pending` | 12 (antigas, de 18 abr) |
| `completed` | 8 |
| `manual_review_requested` | 1 |

Todas as 13 submissões em `pending_manual_review` falharam exatamente no mesmo ponto: chamada HTTP à API da Anthropic com a `CLAUDE_API_KEY` que tem saldo zero.

### Causa raiz

A função `analyze-property-claude` chama **diretamente** `https://api.anthropic.com/v1/messages` usando uma API key pessoal (`CLAUDE_API_KEY`) que ficou sem créditos. Mesmo problema afetará todas as próximas submissões.

## Solução

Migrar a chamada de análise para o **Lovable AI Gateway**, que já tem o `LOVABLE_API_KEY` configurado nos secrets e fornece acesso a modelos potentes (incluindo família Gemini e GPT-5) **sem requerer a chave Anthropic** e com créditos incluídos no plano Lovable.

### Modelo escolhido

**`google/gemini-2.5-pro`** — substituto direto do `claude-haiku-4-5`:
- Excelente em raciocínio complexo + JSON estruturado (perfeito para análise de propriedades)
- Suporta o tamanho de contexto necessário (16k output tokens)
- Disponível via Lovable AI Gateway sem custo adicional fora da sandbox de billing já em uso

### Mudanças

1. **`supabase/functions/analyze-property-claude/index.ts`**
   - Substituir chamada `https://api.anthropic.com/v1/messages` por `https://ai.gateway.lovable.dev/v1/chat/completions`
   - Trocar header `x-api-key: CLAUDE_API_KEY` por `Authorization: Bearer ${LOVABLE_API_KEY}`
   - Adaptar payload do formato Anthropic (`messages` + `system`) para formato OpenAI-compatible (`messages` com role `system` no array)
   - Adaptar parsing da resposta: `claudeData.content[0].text` → `data.choices[0].message.content`
   - Tratar códigos 429 (rate limit) e 402 (créditos esgotados) com mensagem clara
   - Manter o resto da lógica intacta (validação, prompt, fallbacks, atualização de DB)

2. **Reprocessar backlog (13 submissões presas)**
   - Após deploy da função corrigida, executar SQL `batch_reset_stuck_submissions()` que já existe na DB
   - Isto coloca os 13 registos em `status = pending` e zera o `retry_count`
   - O cron job existente (`pg_cron`) vai apanhá-los automaticamente, ou podemos invocar `fix-stuck-submission` manualmente

3. **Cleanup opcional**
   - O secret `CLAUDE_API_KEY` pode ficar nos secrets (não estorva), mas deixa de ser usado
   - Atualizar a memória do projeto (`mem://infrastructure/ai-model-configuration`) para refletir que análise passa a usar Lovable AI Gateway com `gemini-2.5-pro`

## Resultado esperado

- ✅ Pipeline volta a funcionar end-to-end (scrape → análise → PDF → email) sem dependência de API key externa
- ✅ Backlog de 13 submissões processado automaticamente
- ✅ Sem custos adicionais (usa LOVABLE_API_KEY já incluído)
- ✅ Sem mudanças no front-end ou no schema da DB

## Detalhes técnicos

- Endpoint: `POST https://ai.gateway.lovable.dev/v1/chat/completions`
- Body: `{ model: "google/gemini-2.5-pro", messages: [{role: "system", content: SYSTEM_PROMPT}, {role: "user", content: USER_PROMPT}], max_completion_tokens: 16000 }`
- Response shape: `data.choices[0].message.content` (string com JSON dentro, igual ao que o resto do código já espera)
- Não é necessário tocar em `supabase/config.toml` (a função já está deployada e mantém `verify_jwt = false`)

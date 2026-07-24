Do I know what the issue is? Sim. O erro já não deve ser tratado como “só faz hard refresh”: há dois problemas combinados.

**Problema real**
- A app ainda tem `manualChunks` no `vite.config.ts`, incluindo um chunk fixo `supabase-vendor`.
- O browser/preview está a misturar ficheiros JS de builds diferentes: um chunk antigo espera um export chamado `supabase`, mas o chunk `supabase-vendor` carregado agora não o fornece.
- A limpeza anterior ajuda alguns browsers, mas não é suficiente porque:
  - a recuperação pode correr tarde demais, depois do `React.lazy` já cair no ErrorBoundary;
  - a chave de recuperação em `sessionStorage` pode bloquear novas tentativas na mesma tab;
  - só existe kill-switch em `/sw.js`, mas browsers podem ter service workers antigos em outro path;
  - o `manualChunks` continua a criar uma superfície frágil para version skew.

**Plano de correção**
1. **Remover a causa estrutural no build**
   - Simplificar `vite.config.ts` removendo o bloco `manualChunks` manual.
   - Deixar o Vite/Rollup gerar os chunks automaticamente, evitando dependências circulares/version skew entre `index`, lazy pages e `supabase-vendor`.

2. **Tornar a recuperação de chunks antigos mais agressiva e versionada**
   - Atualizar `src/utils/recoverStaleAssets.ts` para:
     - escutar também o evento oficial `vite:preloadError`;
     - usar uma nova chave versionada de recuperação para desbloquear sessões que já ficaram presas;
     - limpar caches antigos `alojamento-insights-*` e caches Workbox/runtime/precache associados ao app;
     - unregister de service workers da origem antes do reload único.

3. **Fortalecer o ErrorBoundary para não ficar preso no ecrã de erro**
   - Quando detectar este erro específico de asset/chunk, mostrar um estado temporário de recuperação e forçar reload controlado, em vez de deixar apenas o fallback “Oops!”.

4. **Cobrir paths antigos de service worker**
   - Manter `/sw.js` como kill-switch.
   - Adicionar o mesmo kill-switch em `/service-worker.js`, caso algum browser tenha ficado registado nesse path em versões antigas.
   - Não voltar a ativar offline cache/PWA app-shell agora.

5. **Remover código morto que pode reintroduzir o problema**
   - Remover ou neutralizar `src/utils/registerServiceWorker.ts` se já não estiver usado.
   - Remover botões/ações de “clear cache via service worker” que assumem um SW ativo.

6. **Validar como utilizador real**
   - Abrir `/` e `/admin` no preview com Playwright.
   - Confirmar que não aparece `Export 'supabase' is not defined in module`.
   - Confirmar que `/admin` passa a ter comportamento esperado: redireciona/nega acesso se não houver login, sem crash.

**Resultado esperado**
- A próxima build deixa de gerar o chunk `supabase-vendor-*` manual que está a causar incompatibilidades.
- Browsers presos em caches antigos recebem uma limpeza automática.
- O erro “Export 'supabase' is not defined in module” deixa de aparecer no preview e em produção.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>
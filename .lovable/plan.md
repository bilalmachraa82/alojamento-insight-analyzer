## Diagnóstico confirmado até agora

- O ficheiro fonte `src/integrations/supabase/client.ts` exporta corretamente `supabase` como named export.
- A página `/admin` importa corretamente `supabase` desse cliente.
- O erro acontece no carregamento lazy da página `/admin`, antes da lógica de permissões correr.
- O Service Worker atual intercepta todos os ficheiros `.js` e `.css` com estratégia `cache-first`, ou seja, pode servir bundles antigos mesmo depois de novo deploy.
- O fluxo atual de update do Service Worker depende de banner/click e não garante que todos os clientes saiam imediatamente de bundles incompatíveis.

Isto aponta para um problema de version skew entre chunks JavaScript: um chunk lazy antigo espera um export chamado `supabase`, mas o chunk atualmente servido/importado já não tem esse export com a mesma forma. O fix real não é pedir hard refresh; é impedir a app de voltar a usar bundles JS incompatíveis.

## Plano de correção

1. **Parar de cachear bundles JS/CSS com `cache-first`**
   - Alterar `public/sw.js` para não usar `cache-first` em `/assets/*.js`, `/assets/*.css` e chunks Vite.
   - Usar `network-first` ou simplesmente bypass de cache para assets com hash.
   - Manter cache para imagens, manifest, ícones e offline page.

2. **Forçar limpeza segura de caches antigos**
   - Bump da versão do Service Worker novamente.
   - No `activate`, apagar todos os caches antigos da app, incluindo variantes `static`, `dynamic` e `api`.
   - Garantir `skipWaiting()` + `clients.claim()` para o novo SW assumir imediatamente.

3. **Adicionar recuperação automática de erro de chunk/módulo**
   - No arranque da app, adicionar handlers para erros de carregamento de módulo/chunk, incluindo:
     - `Export 'supabase' is not defined in module`
     - `Failed to fetch dynamically imported module`
     - `does not provide an export named`
   - Quando detetado, limpar caches, desregistar Service Workers antigos e recarregar a página uma única vez com flag anti-loop.

4. **Simplificar a divisão manual de chunks se necessário**
   - Rever `vite.config.ts`: o chunk manual `supabase-vendor` mistura `@supabase/supabase-js` e `@tanstack/react-query`.
   - Se a validação mostrar que continua a haver incompatibilidade, remover essa separação manual para deixar o Vite gerir dependências críticas e reduzir risco de circular/version skew.

5. **Validar em ambiente real de preview**
   - Abrir `/admin` com Playwright em sessão limpa.
   - Simular presença de Service Worker/cache antigo quando possível.
   - Confirmar que `/admin` deixa de cair no ErrorBoundary e que não aparece `Export 'supabase' is not defined in module` na consola.

## Resultado esperado

Depois de implementado, a app deixa de depender de hard refresh/manual cache clear. Mesmo que um utilizador tenha um bundle antigo, a app limpa o cache incompatível e recarrega automaticamente para a versão correta.
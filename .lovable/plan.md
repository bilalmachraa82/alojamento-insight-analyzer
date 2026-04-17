
The build is failing with 17 TypeScript errors across edge functions. There's also a runtime error: "Export 'supabase' is not defined in module" in the client.

Let me analyze:

**Build errors (TS18046)**: `error.message` access on `unknown` type — Deno's stricter TS checking now requires narrowing in catch blocks. Affects ~12 files.

**Build errors (others)**:
- `check-scrape-status/index.ts:782` — implicit `any` parameter `l`
- `enhanced-apify-service.ts:80` — `APIFY_API_TOKEN` possibly undefined
- `generate-premium-pdf/index.ts:231` — async function declared with `: string` return type instead of `Promise<string>`
- `firecrawl-service.ts:101` — `error.name` on unknown
- `send-diagnostic-email/index.ts:371` — `error.message` on unknown

**Runtime error**: "Export 'supabase' is not defined in module" — likely a recent edit to a hook/component that broke the supabase import. Need to investigate.

Let me check the most likely culprits — the new files created in Phase 2 (useGoals, useReviews, usePricingRecommendations, GoalsManager, ReviewsManager, DataExporter).

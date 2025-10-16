/**
 * Analytics Hooks - Central Export
 * Phase 0: Premium Analytics System
 */

// Daily KPIs
export {
  useKPIsDaily,
  useKPIsSummary,
  useKPIsTrend,
  useLatestKPI,
  type DailyKPI,
  type KPISummary,
  type DateRange,
} from './useKPIsDaily';

// Benchmarking
export {
  useCompSetBenchmarking,
  useLatestBenchmark,
  useMarketPerformance,
  type CompSetBenchmark,
} from './useCompSetBenchmarking';

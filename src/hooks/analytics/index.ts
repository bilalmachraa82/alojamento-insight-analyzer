/**
 * Analytics Hooks - Central Export
 * Phase 2: Premium Analytics System
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

// Sentiment Analysis
export {
  useSentimentTopics,
  useSentimentSummary,
  useSentimentTrend,
  useSentimentComparison,
  useTopicTrends,
  useSentimentInsights,
  type SentimentTopic,
  type SentimentSummary,
  type SentimentTrend,
} from './useSentimentAnalysis';

// Goals Management
export {
  usePropertyGoals,
  useAllGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useGoalsSummary,
  type Goal,
  type CreateGoalInput,
  type UpdateGoalInput,
} from './useGoals';

// Reviews Management
export {
  usePropertyReviews,
  useAllReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  useReviewsSummary,
  type Review,
  type CreateReviewInput,
} from './useReviews';

// Pricing Recommendations
export {
  usePricingRecommendations,
  useCalculateDynamicPrice,
  useCalculateDateRangePrices,
  useApplyPriceRecommendation,
  usePricingSummary,
  type PricingRecommendation,
  type CalculatePriceInput,
} from './usePricingRecommendations';

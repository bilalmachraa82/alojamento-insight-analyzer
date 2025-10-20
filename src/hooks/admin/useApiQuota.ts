import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ApiUsageSummary {
  date: string;
  service_name: string;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  total_tokens: number;
  total_cost_usd: number;
  avg_cost_per_call: number;
}

export interface ApiQuotaMetrics {
  serviceName: string;
  totalCalls: number;
  successRate: number;
  totalCost: number;
  avgCostPerCall: number;
  totalTokens?: number;
  quotaLimit?: number;
  quotaUsedPercentage?: number;
}

export const useApiUsageSummary = (days: number = 30) => {
  return useQuery<ApiUsageSummary[]>({
    queryKey: ['admin', 'api-usage-summary', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_api_usage_summary')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

export const useApiQuotaMetrics = (days: number = 30) => {
  return useQuery<ApiQuotaMetrics[]>({
    queryKey: ['admin', 'api-quota-metrics', days],
    queryFn: async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('service_name, success, cost_usd, tokens_used')
        .gte('created_at', cutoffDate.toISOString());

      if (error) throw error;

      // Group by service and calculate metrics
      const metricsByService = new Map<string, {
        totalCalls: number;
        successfulCalls: number;
        totalCost: number;
        totalTokens: number;
      }>();

      data?.forEach((log) => {
        if (!metricsByService.has(log.service_name)) {
          metricsByService.set(log.service_name, {
            totalCalls: 0,
            successfulCalls: 0,
            totalCost: 0,
            totalTokens: 0,
          });
        }

        const metrics = metricsByService.get(log.service_name)!;
        metrics.totalCalls++;
        if (log.success) metrics.successfulCalls++;
        metrics.totalCost += Number(log.cost_usd) || 0;
        metrics.totalTokens += log.tokens_used || 0;
      });

      // Define quota limits (these should come from environment or config)
      const quotaLimits: Record<string, number> = {
        apify: 1000, // Example: 1000 calls per month
        claude: 1000000, // Example: 1M tokens per month
        resend: 3000, // Example: 3000 emails per month
        supabase: 500000, // Example: 500K requests per month
      };

      // Convert to array
      const result: ApiQuotaMetrics[] = [];
      metricsByService.forEach((metrics, serviceName) => {
        const successRate = (metrics.successfulCalls / metrics.totalCalls) * 100;
        const avgCostPerCall = metrics.totalCost / metrics.totalCalls;
        const quotaLimit = quotaLimits[serviceName];
        const quotaUsed = serviceName === 'claude' ? metrics.totalTokens : metrics.totalCalls;
        const quotaUsedPercentage = quotaLimit ? (quotaUsed / quotaLimit) * 100 : undefined;

        result.push({
          serviceName,
          totalCalls: metrics.totalCalls,
          successRate: Math.round(successRate * 100) / 100,
          totalCost: Math.round(metrics.totalCost * 100) / 100,
          avgCostPerCall: Math.round(avgCostPerCall * 1000) / 1000,
          totalTokens: metrics.totalTokens || undefined,
          quotaLimit,
          quotaUsedPercentage: quotaUsedPercentage ? Math.round(quotaUsedPercentage * 100) / 100 : undefined,
        });
      });

      return result.sort((a, b) => b.totalCost - a.totalCost);
    },
    refetchInterval: 300000,
  });
};

export const useApiUsageByService = (serviceName: string, days: number = 7) => {
  return useQuery({
    queryKey: ['admin', 'api-usage-by-service', serviceName, days],
    queryFn: async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('service_name', serviceName)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    },
    refetchInterval: 60000,
  });
};

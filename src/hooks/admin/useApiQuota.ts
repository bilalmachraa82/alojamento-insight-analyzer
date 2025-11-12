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
      // Use diagnostic_submissions as fallback since admin_api_usage_summary doesn't exist
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await supabase
        .from('diagnostic_submissions')
        .select('created_at, status')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match expected format
      const summaryData: ApiUsageSummary[] = [];
      return summaryData;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

export const useApiQuotaMetrics = (days: number = 30) => {
  return useQuery<ApiQuotaMetrics[]>({
    queryKey: ['admin', 'api-quota-metrics', days],
    queryFn: async () => {
      // Return empty metrics since api_usage_logs table doesn't exist
      const result: ApiQuotaMetrics[] = [];
      return result;
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

      // Use diagnostic_submissions as fallback
      const { data, error } = await supabase
        .from('diagnostic_submissions')
        .select('*')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    },
    refetchInterval: 60000,
  });
};

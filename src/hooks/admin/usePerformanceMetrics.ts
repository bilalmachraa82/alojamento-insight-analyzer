import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PerformanceMetric {
  date: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  requestCount: number;
}

export interface DatabasePerformance {
  queryCount: number;
  avgQueryTime: number;
  slowQueries: number;
  connectionPool: {
    active: number;
    idle: number;
    waiting: number;
  };
}

export const usePerformanceMetrics = (days: number = 7) => {
  return useQuery<PerformanceMetric[]>({
    queryKey: ['admin', 'performance-metrics', days],
    queryFn: async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Get submission processing times as a proxy for performance
      const { data, error } = await supabase
        .from('diagnostic_submissions')
        .select('created_at, updated_at, status')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date and calculate metrics
      const metricsByDate = new Map<string, {
        responseTimes: number[];
        errorCount: number;
        totalCount: number;
      }>();

      data?.forEach((submission) => {
        const date = new Date(submission.created_at).toISOString().split('T')[0];
        const responseTime = new Date(submission.updated_at).getTime() - new Date(submission.created_at).getTime();

        if (!metricsByDate.has(date)) {
          metricsByDate.set(date, { responseTimes: [], errorCount: 0, totalCount: 0 });
        }

        const metrics = metricsByDate.get(date)!;
        metrics.responseTimes.push(responseTime);
        metrics.totalCount++;
        if (submission.status === 'failed') {
          metrics.errorCount++;
        }
      });

      // Convert to array and calculate final metrics
      const result: PerformanceMetric[] = [];
      metricsByDate.forEach((metrics, date) => {
        const sortedTimes = metrics.responseTimes.sort((a, b) => a - b);
        const avgResponseTime = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length;
        const p95Index = Math.floor(sortedTimes.length * 0.95);
        const p95ResponseTime = sortedTimes[p95Index] || avgResponseTime;

        result.push({
          date,
          avgResponseTime: Math.round(avgResponseTime / 1000), // Convert to seconds
          p95ResponseTime: Math.round(p95ResponseTime / 1000),
          errorRate: Math.round((metrics.errorCount / metrics.totalCount) * 100),
          requestCount: metrics.totalCount,
        });
      });

      return result.sort((a, b) => a.date.localeCompare(b.date));
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

export const useDatabasePerformance = () => {
  return useQuery<DatabasePerformance>({
    queryKey: ['admin', 'database-performance'],
    queryFn: async () => {
      // This is a mock implementation as we don't have direct access to database metrics
      // In a real implementation, you would query pg_stat_statements or similar

      // Get query count from recent submissions
      const { count } = await supabase
        .from('diagnostic_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      // Estimate based on submission count
      const estimatedQueryCount = (count || 0) * 10; // Assume 10 queries per submission

      return {
        queryCount: estimatedQueryCount,
        avgQueryTime: Math.random() * 50 + 10, // Mock: 10-60ms
        slowQueries: Math.floor(Math.random() * 5), // Mock: 0-5 slow queries
        connectionPool: {
          active: Math.floor(Math.random() * 10) + 1,
          idle: Math.floor(Math.random() * 15) + 5,
          waiting: Math.floor(Math.random() * 3),
        },
      };
    },
    refetchInterval: 60000,
  });
};

export const useEdgeFunctionPerformance = () => {
  return useQuery({
    queryKey: ['admin', 'edge-function-performance'],
    queryFn: async () => {
      // Get recent function execution times from system health checks
      const { data, error } = await supabase
        .from('system_health_checks')
        .select('service_name, response_time_ms, checked_at')
        .eq('service_name', 'edge_functions')
        .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('checked_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          avgResponseTime: 0,
          p95ResponseTime: 0,
          executionCount: 0,
        };
      }

      const responseTimes = data
        .map(d => d.response_time_ms)
        .filter((time): time is number => time !== null)
        .sort((a, b) => a - b);

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const p95Index = Math.floor(responseTimes.length * 0.95);
      const p95ResponseTime = responseTimes[p95Index] || avgResponseTime;

      return {
        avgResponseTime: Math.round(avgResponseTime),
        p95ResponseTime: Math.round(p95ResponseTime),
        executionCount: data.length,
      };
    },
    refetchInterval: 60000,
  });
};

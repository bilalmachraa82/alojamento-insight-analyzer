import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubmissionStat {
  date: string;
  status: string;
  count: number;
  avg_processing_time_seconds: number;
  error_count: number;
  retry_count: number;
}

export interface SubmissionMetrics {
  totalSubmissions: number;
  successRate: number;
  avgProcessingTime: number;
  failedSubmissions: number;
  pendingSubmissions: number;
}

export const useSubmissionStats = (days: number = 30) => {
  return useQuery<SubmissionStat[]>({
    queryKey: ['admin', 'submission-stats', days],
    queryFn: async () => {
      // Return empty array since admin_submission_stats table doesn't exist
      return [];
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useSubmissionMetrics = () => {
  return useQuery<SubmissionMetrics>({
    queryKey: ['admin', 'submission-metrics'],
    queryFn: async () => {
      // Get total submissions in last 30 days
      const { count: totalSubmissions } = await supabase
        .from('diagnostic_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get successful submissions
      const { count: successfulSubmissions } = await supabase
        .from('diagnostic_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get failed submissions
      const { count: failedSubmissions } = await supabase
        .from('diagnostic_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get pending submissions
      const { count: pendingSubmissions } = await supabase
        .from('diagnostic_submissions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'processing']);

      // Get average processing time
      const { data: processingTimes } = await supabase
        .from('diagnostic_submissions')
        .select('created_at, updated_at')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      let avgProcessingTime = 0;
      if (processingTimes && processingTimes.length > 0) {
        const totalTime = processingTimes.reduce((sum, item) => {
          const created = new Date(item.created_at).getTime();
          const updated = new Date(item.updated_at).getTime();
          return sum + (updated - created);
        }, 0);
        avgProcessingTime = totalTime / processingTimes.length / 1000; // Convert to seconds
      }

      const successRate = totalSubmissions ? (successfulSubmissions || 0) / totalSubmissions * 100 : 0;

      return {
        totalSubmissions: totalSubmissions || 0,
        successRate: Math.round(successRate * 100) / 100,
        avgProcessingTime: Math.round(avgProcessingTime),
        failedSubmissions: failedSubmissions || 0,
        pendingSubmissions: pendingSubmissions || 0,
      };
    },
    refetchInterval: 60000,
  });
};

export const useRecentSubmissions = (limit: number = 10) => {
  return useQuery({
    queryKey: ['admin', 'recent-submissions', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
};

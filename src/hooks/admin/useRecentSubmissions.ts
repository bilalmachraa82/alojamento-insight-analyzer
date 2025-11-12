import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RecentSubmission {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
  platform: string;
}

export const useRecentSubmissions = (limit: number = 10) => {
  return useQuery<RecentSubmission[]>({
    queryKey: ['admin', 'recent-submissions', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_submissions')
        .select('id, name, email, status, created_at, updated_at, platform')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000,
  });
};
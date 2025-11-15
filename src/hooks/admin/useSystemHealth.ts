import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemHealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}

export interface SystemHealthResponse {
  overall: 'healthy' | 'degraded' | 'down';
  services: SystemHealthCheck[];
  timestamp: string;
}

export const useSystemHealth = (refetchInterval?: number) => {
  return useQuery<SystemHealthResponse>({
    queryKey: ['admin', 'system-health'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin/get-system-health');

      if (error) {
        throw new Error(error.message || 'Failed to fetch system health');
      }

      return data;
    },
    refetchInterval: refetchInterval || 30000, // Refetch every 30 seconds by default
    staleTime: 20000,
  });
};

export const useSystemHealthLatest = () => {
  return useQuery({
    queryKey: ['admin', 'system-health-latest'],
    queryFn: async () => {
      // Return empty array since admin_system_health_latest table doesn't exist
      return [];
    },
    refetchInterval: 30000,
  });
};

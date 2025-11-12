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
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin/get-system-health`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch system health');
      }

      return response.json();
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

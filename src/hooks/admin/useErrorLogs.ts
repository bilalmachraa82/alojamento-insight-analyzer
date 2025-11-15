import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  user_id?: string;
  submission_id?: string;
  context?: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  user?: {
    email: string;
    full_name?: string;
  };
  submission?: {
    property_url: string;
    status: string;
  };
}

export interface ErrorSummary {
  error_type: string;
  severity: string;
  total_count: number;
  unresolved_count: number;
  last_occurrence: string;
  affected_users: number;
}

export interface ErrorLogsResponse {
  errors: ErrorLog[];
  summary: ErrorSummary[];
  total: number;
}

export const useErrorLogs = (
  limit: number = 100,
  severity?: string,
  resolved?: boolean,
  errorType?: string
) => {
  return useQuery<ErrorLogsResponse>({
    queryKey: ['admin', 'error-logs', limit, severity, resolved, errorType],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (severity) params.append('severity', severity);
        if (resolved !== undefined) params.append('resolved', resolved.toString());
        if (errorType) params.append('error_type', errorType);
        
        const { data, error } = await supabase.functions.invoke(
          `admin_get_error_logs?${params.toString()}`,
          { method: 'GET' }
        );

        if (error) {
          if (error.message?.includes('404') || error.message?.includes('FunctionsRelayError')) {
            throw new Error('Admin function not deployed yet. Please wait for deployment.');
          }
          throw new Error(error.message || 'Failed to fetch error logs');
        }

        if (!data) {
          throw new Error('No data returned from admin function');
        }

        return data as ErrorLogsResponse;
      } catch (error: any) {
        console.error('Error logs fetch error:', error);
        throw error;
      }
    },
    refetchInterval: 30000,
  });
};

export const useErrorSummary = () => {
  return useQuery<ErrorSummary[]>({
    queryKey: ['admin', 'error-summary'],
    queryFn: async () => {
      // Return empty array since admin_error_summary table doesn't exist
      return [];
    },
    refetchInterval: 60000,
  });
};

export const useResolveError = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ errorId, userId }: { errorId: string; userId: string }) => {
      // Return null since error_logs table doesn't exist
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'error-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'error-summary'] });
    },
  });
};

export const useLogError = () => {
  return useMutation({
    mutationFn: async (errorData: {
      error_type: string;
      error_message: string;
      stack_trace?: string;
      user_id?: string;
      submission_id?: string;
      context?: Record<string, any>;
      severity?: 'info' | 'warning' | 'error' | 'critical';
    }) => {
      // Return null since error_logs table doesn't exist
      return null;
    },
  });
};

import { supabase } from '@/integrations/supabase/client';

export interface LogErrorParams {
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  userId?: string;
  submissionId?: string;
  context?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Utility function to log errors to the error_logs table
 * This helps track system errors for the admin dashboard
 */
export const logError = async (params: LogErrorParams) => {
  try {
    const { data, error } = await supabase
      .from('error_logs')
      .insert({
        error_type: params.errorType,
        error_message: params.errorMessage,
        stack_trace: params.stackTrace,
        user_id: params.userId,
        submission_id: params.submissionId,
        context: params.context || {},
        severity: params.severity || 'error',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to log error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to log error:', error);
    return null;
  }
};

/**
 * Wrapper to catch and log errors from async functions
 */
export const withErrorLogging = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorType: string,
  severity: 'info' | 'warning' | 'error' | 'critical' = 'error'
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      await logError({
        errorType,
        errorMessage: error.message || 'Unknown error',
        stackTrace: error.stack,
        severity,
        context: {
          functionName: fn.name,
          args: JSON.stringify(args),
        },
      });
      throw error;
    }
  }) as T;
};

/**
 * Log API usage for tracking quota and costs
 */
export const logApiUsage = async (params: {
  serviceName: 'apify' | 'claude' | 'resend' | 'supabase';
  operation: string;
  tokensUsed?: number;
  costUsd?: number;
  submissionId?: string;
  userId?: string;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}) => {
  try {
    const { data, error } = await supabase
      .from('api_usage_logs')
      .insert({
        service_name: params.serviceName,
        operation: params.operation,
        tokens_used: params.tokensUsed,
        cost_usd: params.costUsd,
        submission_id: params.submissionId,
        user_id: params.userId,
        success: params.success !== false,
        error_message: params.errorMessage,
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to log API usage:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to log API usage:', error);
    return null;
  }
};

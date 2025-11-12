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
 * Utility function to log errors to console
 * Tables don't exist yet, so we just console.error
 */
export const logError = async (params: LogErrorParams) => {
  try {
    console.error('Error logged:', {
      type: params.errorType,
      message: params.errorMessage,
      severity: params.severity || 'error',
      userId: params.userId,
      submissionId: params.submissionId,
    });
    return null;
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
 * Tables don't exist yet, so we just console.log
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
    console.log('API usage:', {
      service: params.serviceName,
      operation: params.operation,
      tokens: params.tokensUsed,
      cost: params.costUsd,
      success: params.success !== false,
    });
    return null;
  } catch (error) {
    console.error('Failed to log API usage:', error);
    return null;
  }
};

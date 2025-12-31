/**
 * Email Service
 *
 * IMPORTANT: This client-side service is for development/testing only.
 * In production, use the 'send-diagnostic-email' Supabase Edge Function
 * which has secure access to the Resend API key.
 *
 * The Edge Function should be called via supabase.functions.invoke()
 */

import { supabase } from '@/integrations/supabase/client';

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s
const RATE_LIMIT_DELAY = 1000; // 1 second between emails

// Types
export interface EmailUser {
  id?: string;
  email: string;
  name: string;
}

export interface EmailReport {
  id: string;
  propertyName: string;
  reportUrl: string;
  reportType?: 'basic' | 'premium';
}

export interface EmailPayment {
  amount: number;
  currency: string;
  transactionId: string;
  planName: string;
  paymentMethod: string;
  invoiceUrl: string;
}

export interface EmailNotificationRecord {
  user_id?: string;
  email: string;
  email_type: string;
  subject: string;
  template_data?: any;
  status: string;
  resend_id?: string;
  error_message?: string;
  sent_at?: string;
}

// Rate limiting
let lastEmailSent = 0;

const enforceRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastEmail = now - lastEmailSent;

  if (timeSinceLastEmail < RATE_LIMIT_DELAY) {
    const delay = RATE_LIMIT_DELAY - timeSinceLastEmail;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  lastEmailSent = Date.now();
};

/**
 * Send email via Supabase Edge Function (recommended for production)
 */
async function sendViaEdgeFunction(params: {
  email: string;
  name: string;
  emailType: string;
  submissionId?: string;
  propertyName?: string;
  reportUrl?: string;
  language?: string;
}): Promise<{ id: string; error?: any }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-diagnostic-email', {
      body: params,
    });

    if (error) {
      return { id: '', error };
    }

    return { id: data?.emailId || `edge_${Date.now()}` };
  } catch (error) {
    return { id: '', error };
  }
}

// Email service using Edge Functions
class EmailService {
  private fromEmail: string = 'Alojamento Insight <noreply@alojamento-insight.com>';

  private async sendWithRetry(
    params: {
      email: string;
      name: string;
      emailType: string;
      submissionId?: string;
      propertyName?: string;
      reportUrl?: string;
      language?: string;
    },
    retryCount = 0
  ): Promise<{ success: boolean; resendId?: string; error?: string }> {
    try {
      await enforceRateLimit();

      const result = await sendViaEdgeFunction(params);

      if (result.error) {
        // Check if we should retry
        if (retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];

          await new Promise(resolve => setTimeout(resolve, delay));
          return this.sendWithRetry(params, retryCount + 1);
        }

        return {
          success: false,
          error: typeof result.error === 'string'
            ? result.error
            : result.error.message || JSON.stringify(result.error)
        };
      }

      return {
        success: true,
        resendId: result.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(params, retryCount + 1);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async trackEmail(
    notification: EmailNotificationRecord
  ): Promise<void> {
    // Email tracking is handled by the Edge Function
  }

  async sendWelcomeEmail(user: EmailUser): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.sendWithRetry({
        email: user.email,
        name: user.name,
        emailType: 'welcome',
      });

      await this.trackEmail({
        user_id: user.id,
        email: user.email,
        email_type: 'welcome',
        subject: `Welcome to Alojamento Insight Analyzer, ${user.name}!`,
        template_data: { userName: user.name },
        status: result.success ? 'sent' : 'failed',
        resend_id: result.resendId,
        error_message: result.error,
        sent_at: result.success ? new Date().toISOString() : undefined,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async sendReportReadyEmail(
    user: EmailUser,
    report: EmailReport
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.sendWithRetry({
        email: user.email,
        name: user.name,
        emailType: 'report_ready',
        submissionId: report.id,
        propertyName: report.propertyName,
        reportUrl: report.reportUrl,
      });

      await this.trackEmail({
        user_id: user.id,
        email: user.email,
        email_type: 'report_ready',
        subject: `Your Report for ${report.propertyName} is Ready!`,
        template_data: {
          userName: user.name,
          propertyName: report.propertyName,
          reportUrl: report.reportUrl,
          submissionId: report.id,
        },
        status: result.success ? 'sent' : 'failed',
        resend_id: result.resendId,
        error_message: result.error,
        sent_at: result.success ? new Date().toISOString() : undefined,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async sendPaymentConfirmationEmail(
    user: EmailUser,
    payment: EmailPayment
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.sendWithRetry({
        email: user.email,
        name: user.name,
        emailType: 'payment_confirmation',
      });

      await this.trackEmail({
        user_id: user.id,
        email: user.email,
        email_type: 'payment_confirmation',
        subject: `Payment Confirmation - ${payment.currency} ${payment.amount.toFixed(2)}`,
        template_data: {
          userName: user.name,
          amount: payment.amount,
          currency: payment.currency,
          transactionId: payment.transactionId,
        },
        status: result.success ? 'sent' : 'failed',
        resend_id: result.resendId,
        error_message: result.error,
        sent_at: result.success ? new Date().toISOString() : undefined,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async sendPasswordResetEmail(
    user: EmailUser,
    token: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.sendWithRetry({
        email: user.email,
        name: user.name,
        emailType: 'password_reset',
      });

      await this.trackEmail({
        user_id: user.id,
        email: user.email,
        email_type: 'password_reset',
        subject: 'Reset Your Password - Alojamento Insight Analyzer',
        template_data: { userName: user.name },
        status: result.success ? 'sent' : 'failed',
        resend_id: result.resendId,
        error_message: result.error,
        sent_at: result.success ? new Date().toISOString() : undefined,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async retryFailedEmails(): Promise<{ retriedCount: number; successCount: number }> {
    // Email retry is handled by the Edge Function
    return { retriedCount: 0, successCount: 0 };
  }

  async getEmailHistory(_email: string): Promise<EmailNotificationRecord[]> {
    // Email history is managed by the Edge Function
    return [];
  }

  async getEmailStatistics(_email: string) {
    return {
      totalSent: 0,
      byType: {} as Record<string, number>,
      lastSent: undefined,
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export class for testing
export { EmailService };

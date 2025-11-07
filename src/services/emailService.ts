import { render } from '@react-email/render';
import { supabase } from '@/integrations/supabase/client';
import WelcomeEmail from '@/emails/WelcomeEmail';
import ReportReadyEmail from '@/emails/ReportReadyEmail';
import PaymentConfirmationEmail from '@/emails/PaymentConfirmationEmail';
import PasswordResetEmail from '@/emails/PasswordResetEmail';

// Configuration
const RESEND_API_URL = 'https://api.resend.com/emails';
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

// Resend API client
class ResendClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(params: {
    from: string;
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ id: string; error?: any }> {
    try {
      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        return { id: '', error: data };
      }

      return { id: data.id };
    } catch (error) {
      return { id: '', error };
    }
  }
}

// Email service with retry logic
class EmailService {
  private resend: ResendClient | null = null;
  private fromEmail: string = 'Alojamento Insight <noreply@alojamento-insight.com>';

  constructor() {
    // Initialize Resend client if API key is available
    const apiKey = import.meta.env.VITE_RESEND_API_KEY;
    if (apiKey) {
      this.resend = new ResendClient(apiKey);
    } else {
      console.warn('RESEND_API_KEY not found. Email sending will be simulated.');
    }
  }

  private async sendWithRetry(
    emailParams: {
      from: string;
      to: string | string[];
      subject: string;
      html: string;
      text?: string;
    },
    retryCount = 0
  ): Promise<{ success: boolean; resendId?: string; error?: string }> {
    if (!this.resend) {
      console.log('Email simulation:', emailParams.subject, 'to', emailParams.to);
      return {
        success: true,
        resendId: `sim_${Date.now()}`
      };
    }

    try {
      await enforceRateLimit();

      const result = await this.resend.send(emailParams);

      if (result.error) {
        // Check if we should retry
        if (retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
          console.warn(`Email send failed, retrying in ${delay}ms...`, result.error);

          await new Promise(resolve => setTimeout(resolve, delay));
          return this.sendWithRetry(emailParams, retryCount + 1);
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
        console.warn(`Email send exception, retrying in ${delay}ms...`, errorMessage);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(emailParams, retryCount + 1);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async checkEmailPreferences(
    email: string,
    emailType: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('should_send_email', {
        p_email: email,
        p_email_type: emailType,
      });

      if (error) {
        console.error('Error checking email preferences:', error);
        // Default to sending if we can't check preferences
        return true;
      }

      return data === true;
    } catch (error) {
      console.error('Exception checking email preferences:', error);
      // Default to sending if we can't check preferences
      return true;
    }
  }

  private async trackEmail(
    notification: EmailNotificationRecord
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_notifications')
        .insert(notification);

      if (error) {
        console.error('Error tracking email:', error);
      }
    } catch (error) {
      console.error('Exception tracking email:', error);
    }
  }

  async sendWelcomeEmail(user: EmailUser): Promise<{ success: boolean; error?: string }> {
    try {
      // Check email preferences
      const shouldSend = await this.checkEmailPreferences(user.email, 'welcome');
      if (!shouldSend) {
        console.log('User has opted out of welcome emails:', user.email);
        return { success: false, error: 'User has opted out' };
      }

      // Render email template
      const html = render(
        WelcomeEmail({
          userName: user.name,
          userEmail: user.email,
          loginUrl: `${window.location.origin}/`,
        })
      );

      const subject = `Welcome to Alojamento Insight Analyzer, ${user.name}!`;

      // Send email
      const result = await this.sendWithRetry({
        from: this.fromEmail,
        to: user.email,
        subject,
        html,
      });

      // Track email
      await this.trackEmail({
        user_id: user.id,
        email: user.email,
        email_type: 'welcome',
        subject,
        template_data: { userName: user.name },
        status: result.success ? 'sent' : 'failed',
        resend_id: result.resendId,
        error_message: result.error,
        sent_at: result.success ? new Date().toISOString() : undefined,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error sending welcome email:', error);
      return { success: false, error: errorMessage };
    }
  }

  async sendReportReadyEmail(
    user: EmailUser,
    report: EmailReport
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check email preferences
      const shouldSend = await this.checkEmailPreferences(user.email, 'report_ready');
      if (!shouldSend) {
        console.log('User has opted out of report notifications:', user.email);
        return { success: false, error: 'User has opted out' };
      }

      // Render email template
      const html = render(
        ReportReadyEmail({
          userName: user.name,
          userEmail: user.email,
          propertyName: report.propertyName,
          reportUrl: report.reportUrl,
          submissionId: report.id,
          reportType: report.reportType || 'premium',
        })
      );

      const subject = `Your ${report.reportType === 'premium' ? 'Premium ' : ''}Report for ${report.propertyName} is Ready!`;

      // Send email
      const result = await this.sendWithRetry({
        from: this.fromEmail,
        to: user.email,
        subject,
        html,
      });

      // Track email
      await this.trackEmail({
        user_id: user.id,
        email: user.email,
        email_type: 'report_ready',
        subject,
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
      console.error('Error sending report ready email:', error);
      return { success: false, error: errorMessage };
    }
  }

  async sendPaymentConfirmationEmail(
    user: EmailUser,
    payment: EmailPayment
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check email preferences
      const shouldSend = await this.checkEmailPreferences(user.email, 'payment_confirmation');
      if (!shouldSend) {
        console.log('User has opted out of payment notifications:', user.email);
        return { success: false, error: 'User has opted out' };
      }

      // Render email template
      const html = render(
        PaymentConfirmationEmail({
          userName: user.name,
          userEmail: user.email,
          amount: payment.amount,
          currency: payment.currency,
          transactionId: payment.transactionId,
          planName: payment.planName,
          paymentMethod: payment.paymentMethod,
          invoiceUrl: payment.invoiceUrl,
        })
      );

      const subject = `Payment Confirmation - ${payment.currency} ${payment.amount.toFixed(2)}`;

      // Send email
      const result = await this.sendWithRetry({
        from: this.fromEmail,
        to: user.email,
        subject,
        html,
      });

      // Track email
      await this.trackEmail({
        user_id: user.id,
        email: user.email,
        email_type: 'payment_confirmation',
        subject,
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
      console.error('Error sending payment confirmation email:', error);
      return { success: false, error: errorMessage };
    }
  }

  async sendPasswordResetEmail(
    user: EmailUser,
    token: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Password reset emails should always be sent (security requirement)
      const resetUrl = `${window.location.origin}/reset-password?token=${token}`;

      // Render email template
      const html = render(
        PasswordResetEmail({
          userName: user.name,
          userEmail: user.email,
          resetUrl,
          expiryHours: 24,
        })
      );

      const subject = 'Reset Your Password - Alojamento Insight Analyzer';

      // Send email
      const result = await this.sendWithRetry({
        from: this.fromEmail,
        to: user.email,
        subject,
        html,
      });

      // Track email
      await this.trackEmail({
        user_id: user.id,
        email: user.email,
        email_type: 'password_reset',
        subject,
        template_data: { userName: user.name },
        status: result.success ? 'sent' : 'failed',
        resend_id: result.resendId,
        error_message: result.error,
        sent_at: result.success ? new Date().toISOString() : undefined,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error sending password reset email:', error);
      return { success: false, error: errorMessage };
    }
  }

  async retryFailedEmails(): Promise<{ retriedCount: number; successCount: number }> {
    try {
      const { data: failedEmails, error } = await supabase
        .from('email_notifications')
        .select('*')
        .eq('status', 'failed')
        .lt('retry_count', 3)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error fetching failed emails:', error);
        return { retriedCount: 0, successCount: 0 };
      }

      if (!failedEmails || failedEmails.length === 0) {
        return { retriedCount: 0, successCount: 0 };
      }

      let successCount = 0;

      for (const email of failedEmails) {
        // Retry based on email type
        let result: { success: boolean; error?: string } | null = null;

        switch (email.email_type) {
          case 'welcome':
            result = await this.sendWelcomeEmail({
              id: email.user_id || undefined,
              email: email.email,
              name: email.template_data?.userName || 'User',
            });
            break;
          case 'report_ready':
            result = await this.sendReportReadyEmail(
              {
                id: email.user_id || undefined,
                email: email.email,
                name: email.template_data?.userName || 'User',
              },
              {
                id: email.template_data?.submissionId || '',
                propertyName: email.template_data?.propertyName || 'Property',
                reportUrl: email.template_data?.reportUrl || '',
              }
            );
            break;
          // Add other email types as needed
        }

        if (result?.success) {
          successCount++;
        }
      }

      return { retriedCount: failedEmails.length, successCount };
    } catch (error) {
      console.error('Error retrying failed emails:', error);
      return { retriedCount: 0, successCount: 0 };
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export class for testing
export { EmailService };

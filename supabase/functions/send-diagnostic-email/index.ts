import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// RESEND_API_KEY is required for production
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailRequest {
  email: string;
  name: string;
  submissionId?: string;
  propertyName?: string;
  reportUrl?: string;
  language?: string;
  emailType?: 'diagnostic_submission' | 'report_ready';
  userId?: string;
}

interface ResendEmailParams {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

// Email templates
const getEmailTemplate = (
  type: string,
  data: {
    name: string;
    propertyName?: string;
    reportUrl?: string;
    submissionId?: string;
    language?: string;
  }
): { subject: string; html: string } => {
  const isPortuguese = data.language === 'pt';

  if (type === 'report_ready') {
    return {
      subject: isPortuguese
        ? `Seu Relatório para ${data.propertyName} está Pronto!`
        : `Your Report for ${data.propertyName} is Ready!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${isPortuguese ? 'Relatório Pronto' : 'Report Ready'}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background-color: #10b981; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">
                Alojamento Insight Analyzer
              </h1>
            </div>

            <!-- Content -->
            <div style="padding: 48px;">
              <div style="text-align: center; margin: 32px 0;">
                <div style="background-color: #10b981; border-radius: 50%; color: #ffffff; display: inline-block; font-size: 32px; font-weight: bold; width: 64px; height: 64px; line-height: 64px; margin: 0 auto 16px;">
                  ✓
                </div>
                <h2 style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 0;">
                  ${isPortuguese ? 'Seu Relatório está Pronto!' : 'Your Report is Ready!'}
                </h2>
              </div>

              <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 16px 0;">
                ${isPortuguese ? 'Olá' : 'Hi'} ${data.name},
              </p>

              <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 16px 0;">
                ${isPortuguese
                  ? `Ótimas notícias! Concluímos a análise de <strong>${data.propertyName}</strong> e o seu relatório premium está agora disponível.`
                  : `Great news! We've completed the analysis for <strong>${data.propertyName}</strong>, and your premium report is now available.`
                }
              </p>

              <!-- Info Box -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="color: #6b7280; font-size: 14px; font-weight: bold; margin: 12px 0 4px 0;">
                  ${isPortuguese ? 'ID de Submissão:' : 'Submission ID:'}
                </p>
                <p style="color: #1f2937; font-size: 16px; margin: 0 0 8px 0;">
                  ${data.submissionId}
                </p>

                <p style="color: #6b7280; font-size: 14px; font-weight: bold; margin: 12px 0 4px 0;">
                  ${isPortuguese ? 'Propriedade:' : 'Property:'}
                </p>
                <p style="color: #1f2937; font-size: 16px; margin: 0 0 8px 0;">
                  ${data.propertyName}
                </p>
              </div>

              <!-- CTA Button -->
              <div style="padding: 27px 0; text-align: center;">
                <a href="${data.reportUrl}" style="background-color: #10b981; border-radius: 8px; color: #fff; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 12px 32px;">
                  ${isPortuguese ? 'Ver Seu Relatório' : 'View Your Report'}
                </a>
              </div>

              <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 16px 0;">
                ${isPortuguese
                  ? 'Este relatório está disponível para download pelos próximos 30 dias. Recomendamos que o descarregue para os seus registos.'
                  : 'This report is available for download for the next 30 days. We recommend downloading it for your records.'
                }
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

              <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 16px 0;">
                ${isPortuguese ? 'Atenciosamente,' : 'Best regards,'}<br>
                ${isPortuguese ? 'A Equipa Alojamento Insight' : 'The Alojamento Insight Team'}
              </p>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding: 24px 48px;">
              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 8px 0; text-align: center;">
                ${isPortuguese
                  ? 'Este relatório foi gerado com base na sua submissão.'
                  : 'This report was generated based on your submission.'
                }
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  // Default: diagnostic_submission
  return {
    subject: isPortuguese
      ? "O Seu Diagnóstico de Propriedade Foi Submetido"
      : "Your Property Diagnostic Has Been Submitted",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isPortuguese ? 'Diagnóstico Submetido' : 'Diagnostic Submitted'}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #2563eb; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">
              Alojamento Insight Analyzer
            </h1>
          </div>

          <!-- Content -->
          <div style="padding: 48px;">
            <h2 style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 40px 0 20px;">
              ${isPortuguese ? 'Olá' : 'Hello'} ${data.name},
            </h2>

            <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 16px 0;">
              ${isPortuguese
                ? 'Obrigado por submeter a sua propriedade para uma avaliação de diagnóstico.'
                : 'Thank you for submitting your property for a diagnostic evaluation.'
              }
            </p>

            <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 16px 0;">
              ${isPortuguese
                ? 'A sua submissão foi recebida e está atualmente a ser processada.'
                : 'Your submission has been received and is currently being processed.'
              }
            </p>

            ${data.submissionId ? `
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="color: #6b7280; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">
                  ${isPortuguese ? 'ID de Submissão:' : 'Submission ID:'}
                </p>
                <p style="color: #1f2937; font-size: 16px; margin: 0;">
                  ${data.submissionId}
                </p>
              </div>
            ` : ''}

            <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 16px 0;">
              ${isPortuguese
                ? 'Estamos a analisar os dados da sua propriedade e iremos notificá-lo assim que os resultados estiverem prontos.'
                : "We're analyzing your property data and will notify you once the results are ready."
              }
            </p>

            <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 16px 0;">
              ${isPortuguese ? 'Atenciosamente,' : 'Best regards,'}<br>
              ${isPortuguese ? 'A Equipa Alojamento Insight' : 'The Alojamento Insight Team'}
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding: 24px 48px;">
            <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 8px 0; text-align: center;">
              ${isPortuguese
                ? 'Está a receber este e-mail porque submeteu uma propriedade para análise.'
                : "You're receiving this email because you submitted a property for analysis."
              }
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// Send email via Resend API
const sendEmail = async (params: ResendEmailParams): Promise<{ id?: string; error?: any }> => {
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY missing - simulating email send");
    return { id: `sim_${Date.now()}` };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data };
    }

    return { id: data.id };
  } catch (error) {
    return { error };
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const emailData: EmailRequest = await req.json();

    console.log(`Sending ${emailData.emailType || 'diagnostic_submission'} email to ${emailData.email}`);

    // Get email template
    const { subject, html } = getEmailTemplate(
      emailData.emailType || 'diagnostic_submission',
      {
        name: emailData.name,
        propertyName: emailData.propertyName,
        reportUrl: emailData.reportUrl,
        submissionId: emailData.submissionId,
        language: emailData.language || 'en',
      }
    );

    // Check email preferences (if user_id is provided)
    if (emailData.userId) {
      const { data: shouldSend, error: prefError } = await supabaseClient.rpc(
        'should_send_email',
        {
          p_email: emailData.email,
          p_email_type: emailData.emailType || 'diagnostic_submission',
        }
      );

      if (prefError) {
        console.error("Error checking email preferences:", prefError);
      } else if (!shouldSend) {
        console.log("User has opted out of this email type:", emailData.email);
        return new Response(
          JSON.stringify({ success: false, warning: "user_opted_out" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Send email
    const emailResult = await sendEmail({
      from: "Alojamento Insight <noreply@alojamento-insight.com>",
      to: [emailData.email],
      subject,
      html,
    });

    if (emailResult.error) {
      console.error("Resend API error:", emailResult.error);

      // Track failed email
      await supabaseClient.from("email_notifications").insert({
        user_id: emailData.userId,
        email: emailData.email,
        email_type: emailData.emailType || 'diagnostic_submission',
        subject,
        template_data: {
          name: emailData.name,
          propertyName: emailData.propertyName,
          submissionId: emailData.submissionId,
        },
        status: 'failed',
        error_message: typeof emailResult.error === 'string'
          ? emailResult.error
          : emailResult.error.message || JSON.stringify(emailResult.error),
      });

      return new Response(
        JSON.stringify({
          success: false,
          warning: "email_send_failed",
          message: emailResult.error.message || String(emailResult.error)
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully:", emailResult.id);

    // Track successful email
    await supabaseClient.from("email_notifications").insert({
      user_id: emailData.userId,
      email: emailData.email,
      email_type: emailData.emailType || 'diagnostic_submission',
      subject,
      template_data: {
        name: emailData.name,
        propertyName: emailData.propertyName,
        submissionId: emailData.submissionId,
      },
      status: 'sent',
      resend_id: emailResult.id,
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in send-diagnostic-email function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || String(error)
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

// Lazy init inside handler to avoid boot errors when key missing
const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  name: string;
  submissionId?: string;
  language?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Determine if this is a test email or a diagnostic email
    const url = new URL(req.url);
    const isTestEmail = url.pathname.endsWith("/test");

    let emailData: EmailRequest;
    
    if (isTestEmail) {
      // For test email, use hardcoded data
      emailData = {
        email: "bilal.machraa@gmail.com", // Replace with your test email
        name: "Test User",
        submissionId: "TEST_" + Date.now(),
        language: "en"
      };
    } else {
      // For diagnostic email, parse request body
      emailData = await req.json() as EmailRequest;
    }

    console.log(`DEBUG: Sending ${isTestEmail ? 'TEST' : 'DIAGNOSTIC'} email to ${emailData.email}`);
    
    const subject = isTestEmail 
      ? "Maria Faz - Email Test" 
      : (emailData.language === "en" 
          ? "Your Property Diagnostic Has Been Submitted" 
          : "O Seu Diagnóstico de Propriedade Foi Submetido");
    
    const html = isTestEmail 
      ? `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Test Successful!</h2>
          <p>This is a test email from Maria Faz.</p>
          <p>If you're seeing this, the email sending functionality is working correctly.</p>
        </div>
      `
      : (emailData.language === "en" 
          ? `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Hello ${emailData.name},</h2>
              <p>Thank you for submitting your property for a diagnostic evaluation.</p>
              <p>Your submission has been received and is currently being processed.</p>
              <p><strong>Submission ID:</strong> ${emailData.submissionId}</p>
              <p>We're analyzing your property data and will notify you once the results are ready.</p>
            </div>
          `
          : `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Olá ${emailData.name},</h2>
              <p>Obrigado por submeter a sua propriedade para uma avaliação de diagnóstico.</p>
              <p>A sua submissão foi recebida e está atualmente a ser processada.</p>
              <p><strong>ID de Submissão:</strong> ${emailData.submissionId}</p>
              <p>Estamos a analisar os dados da sua propriedade e iremos notificá-lo assim que os resultados estiverem prontos.</p>
            </div>
          `);

    console.log(`DEBUG: Preparing to send email to ${emailData.email}`);

    try {
      if (!resendApiKey) {
        console.warn("RESEND_API_KEY missing - skipping email send");
        return new Response(
          JSON.stringify({ success: false, warning: "email_disabled_missing_api_key" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: "onboarding@resend.dev", // Using Resend's verified sender
        to: [emailData.email],
        subject: subject,
        html: html,
      });

      if (error) {
        console.error("Resend API error:", error);
        throw error;
      }

      console.log("DEBUG: Email sent successfully:", data);
      
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (resendError) {
      console.error("Resend send error:", resendError);
      throw resendError;
    }
  } catch (error) {
    console.error("Error in send-diagnostic-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});


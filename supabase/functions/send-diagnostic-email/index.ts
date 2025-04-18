
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  name: string;
  submissionId: string;
  language: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, submissionId, language } = await req.json() as EmailRequest;
    
    console.log(`Sending diagnostic email to ${email} for submission ${submissionId}`);
    
    const subject = language === "en" 
      ? "Your Property Diagnostic Has Been Submitted" 
      : "O Seu Diagnóstico de Propriedade Foi Submetido";
    
    const html = language === "en"
      ? `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${name},</h2>
          <p>Thank you for submitting your property for a diagnostic evaluation.</p>
          <p>Your submission has been received and is currently being processed.</p>
          <p><strong>Submission ID:</strong> ${submissionId}</p>
          <p>We're analyzing your property data and will notify you once the results are ready.</p>
          <p>You can check your results at any time by visiting:</p>
          <p><a href="https://mariafaz.com/results/${submissionId}">View Your Diagnostic Results</a></p>
          <p>Best regards,<br>The Maria Faz Team</p>
        </div>
      `
      : `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Olá ${name},</h2>
          <p>Obrigado por submeter a sua propriedade para uma avaliação de diagnóstico.</p>
          <p>A sua submissão foi recebida e está atualmente a ser processada.</p>
          <p><strong>ID de Submissão:</strong> ${submissionId}</p>
          <p>Estamos a analisar os dados da sua propriedade e iremos notificá-lo assim que os resultados estiverem prontos.</p>
          <p>Pode verificar os seus resultados a qualquer momento visitando:</p>
          <p><a href="https://mariafaz.com/results/${submissionId}">Ver os Resultados do Diagnóstico</a></p>
          <p>Com os melhores cumprimentos,<br>A Equipa Maria Faz</p>
        </div>
      `;

    const { data, error } = await resend.emails.send({
      from: "Maria Faz <noreply@mariafaz.com>",
      to: [email],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Email sending failed:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);
    
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
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

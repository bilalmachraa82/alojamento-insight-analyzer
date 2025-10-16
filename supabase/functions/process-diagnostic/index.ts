
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { startEnhancedApifyRun } from "./enhanced-apify-service.ts";
import { getSubmission, updateSubmissionStatus } from "./db-service.ts";
import { getActorConfig } from "./apify-config.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id } = await req.json();
    
    if (!id) {
      console.error("Missing submission ID");
      return new Response(
        JSON.stringify({ error: "Missing submission ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing diagnostic submission: ${id}`);

    // Fetch the submission
    const submission = await getSubmission(id);
    
    // Update status to "processing"
    await updateSubmissionStatus(id, "processing");

    // Trim any whitespace from the URL
    const startUrl = submission.property_url.trim();
    console.log(`Processing URL: ${startUrl}`);
    
    // Check if the URL is a Booking.com Share URL
    if (startUrl.includes("booking.com/Share-") || startUrl.includes("booking.com/share-")) {
      console.log("Detected Booking.com share URL. These URLs are not recommended.");
      
      await updateSubmissionStatus(id, "pending_manual_review", {
        error: "Booking.com share URL detected",
        error_at: new Date().toISOString(),
        reason: "incompatible_url",
        url: startUrl,
        message: "Os URLs de compartilhamento do Booking.com não são suportados. Por favor, use o URL completo da propriedade."
      });
        
      return new Response(
        JSON.stringify({
          success: false,
          message: "Precisamos processar sua submissão manualmente. Nossa equipe irá analisá-la em breve.",
          details: "URLs de compartilhamento do Booking.com não são suportados. Por favor, use o URL completo da propriedade na próxima vez."
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Start Apify run
    console.log("Starting Apify scraping process");
    const platform = submission.platform.toLowerCase();
    const { actorId } = getActorConfig(platform);
    const apifyResult = await startEnhancedApifyRun(platform, startUrl, id);
    
    if (!apifyResult.success) {
      await updateSubmissionStatus(id, "pending_manual_review", {
        error: apifyResult.error,
        error_at: new Date().toISOString(),
        reason: "api_error",
        url: startUrl,
        message: "Não foi possível acessar os dados da propriedade automaticamente.",
        actor_id: actorId,
        api_urls_tried: apifyResult.endpoints
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          message: "Precisamos processar sua submissão manualmente. Nossa equipe irá analisá-la em breve.",
          details: "Erro ao acessar dados da propriedade"
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Update submission with successful run data
    const runId = apifyResult.data.data.id;
    await updateSubmissionStatus(id, "scraping", {
      apify_run_id: runId,
      actor_id: actorId,
      started_at: new Date().toISOString(),
      url: startUrl,
      platform: platform,
      endpoint_used: apifyResult.fallbackMode ? "basic_fallback" : "enhanced",
      extracted_data_points: apifyResult.extractedDataPoints,
      processing_time_secs: apifyResult.processingTime || 0
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Property data collection started",
        runId,
        actorId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error processing diagnostic:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: String(error),
        message: "An error occurred, but your submission was saved" 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

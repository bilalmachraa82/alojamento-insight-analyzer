
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { startEnhancedApifyRun } from "./enhanced-apify-service.ts";
import { getSubmission, updateSubmissionStatus } from "./db-service.ts";
import { getActorConfig } from "./apify-config.ts";

// FASE 3: Retry configuration
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 5000;

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
    
    // Start Apify run with retry logic (FASE 3)
    console.log("Starting Apify scraping process with retry logic");
    const platform = submission.platform.toLowerCase();
    const { actorId } = getActorConfig(platform);
    
    let apifyResult;
    let lastError;
    
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      console.log(`Scraping attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`);
      
      try {
        apifyResult = await startEnhancedApifyRun(platform, startUrl, id);
        
        if (apifyResult.success) {
          console.log(`Scraping succeeded on attempt ${attempt}`);
          break;
        }
        
        lastError = apifyResult.error;
        console.warn(`Attempt ${attempt} failed:`, lastError);
        
        // Update status to retry if not last attempt
        if (attempt < MAX_RETRY_ATTEMPTS) {
          await updateSubmissionStatus(id, "scraping_retry", {
            retry_attempt: attempt,
            last_error: lastError,
            next_retry_at: new Date(Date.now() + RETRY_DELAY_MS).toISOString()
          });
          
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
      } catch (error) {
        lastError = String(error);
        console.error(`Attempt ${attempt} error:`, error);
        
        if (attempt < MAX_RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    }
    
    if (!apifyResult || !apifyResult.success) {
      console.error(`All ${MAX_RETRY_ATTEMPTS} attempts failed. Last error:`, lastError);
      await updateSubmissionStatus(id, "pending_manual_review", {
        error: lastError,
        error_at: new Date().toISOString(),
        retry_count: MAX_RETRY_ATTEMPTS,
        reason: "apify_failure"
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
    const runId = apifyResult.runId || apifyResult.data?.id;
    console.log(`Apify run started successfully. Run ID: ${runId}, Actor: ${actorId}`);
    
    await updateSubmissionStatus(id, "scraping", {
      actor_run_id: runId,
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

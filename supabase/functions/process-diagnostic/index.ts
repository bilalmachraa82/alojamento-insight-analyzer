
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { startApifyRun } from "./apify-service.ts";
import { getSubmission, updateSubmissionStatus } from "./db-service.ts";

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
    const startUrl = submission.link.trim();
    console.log(`Processing URL: ${startUrl}`);
    
    // Check if the URL is a Booking.com Share URL
    if (startUrl.includes("booking.com/Share-") || startUrl.includes("booking.com/share-")) {
      console.log("Detected Booking.com share URL. These URLs are not recommended.");
      
      await updateSubmissionStatus(id, "pending_manual_review", {
        error: "Booking.com share URL detected",
        error_at: new Date().toISOString(),
        reason: "incompatible_url",
        url: startUrl,
        message: "Share URLs from Booking.com are not supported. Please use the complete property URL."
      });
        
      return new Response(
        JSON.stringify({
          success: false,
          message: "We need to process your submission manually. Our team will review it soon.",
          details: "Booking.com share URLs are not supported. Please use the complete property URL next time."
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Start Apify run
    console.log("Starting Apify scraping process");
    const platform = submission.plataforma.toLowerCase();
    const apifyResult = await startApifyRun(platform, startUrl);
    
    if (!apifyResult.success) {
      await updateSubmissionStatus(id, "pending_manual_review", {
        error: apifyResult.error,
        error_at: new Date().toISOString(),
        reason: "api_error",
        url: startUrl,
        actor_id: platform,
        api_urls_tried: apifyResult.endpoints
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          message: "We need to process your submission manually. Our team will review it soon.",
          details: "Error accessing property data"
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
      actor_id: platform,
      started_at: new Date().toISOString(),
      url: startUrl,
      platform: platform,
      endpoint_used: apifyResult.endpoint || "primary"
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Property data collection started",
        runId,
        actorId: platform
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

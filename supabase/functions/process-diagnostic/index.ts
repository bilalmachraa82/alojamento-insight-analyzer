
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Configure Supabase client
const supabaseUrl = "https://rhrluvhbajdsnmvnpjzk.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure Apify
const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { id } = await req.json();
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing submission ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing diagnostic submission: ${id}`);

    // Fetch the submission from Supabase
    const { data: submission, error: fetchError } = await supabase
      .from("diagnostic_submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !submission) {
      console.error("Error fetching submission:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch submission", details: fetchError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to "processing"
    await supabase
      .from("diagnostic_submissions")
      .update({ status: "processing" })
      .eq("id", id);

    // Determine actor ID based on platform
    const platform = submission.plataforma.toLowerCase();
    let actorId;
    
    switch (platform) {
      case "airbnb":
        actorId = "apify/airbnb-scraper";
        break;
      case "booking":
        actorId = "apify/booking-scraper";
        break;
      case "vrbo":
        actorId = "apify/vrbo-scraper";
        break;
      default:
        // Default to a generic web scraper
        actorId = "apify/web-scraper";
    }

    console.log(`Using actor ${actorId} for platform ${platform}`);

    if (!APIFY_API_TOKEN) {
      console.error("Missing APIFY_API_TOKEN");
      return new Response(
        JSON.stringify({ error: "Missing API token configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const startUrl = submission.link;
    console.log(`Processing URL: ${startUrl}`);
    
    // First try to directly use the actor (skip the task which might not exist)
    try {
      const directActorUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_TOKEN}`;
      
      console.log(`Making direct actor request to: ${directActorUrl}`);
      
      const directRunResponse = await fetch(directActorUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startUrls: [{ url: startUrl }],
          maxPages: 1, // Limiting to keep processing time reasonable
          proxyConfiguration: {
            useApifyProxy: true
          }
        }),
      });
      
      // If direct actor run fails, handle the error
      if (!directRunResponse.ok) {
        const errorText = await directRunResponse.text();
        console.error(`Direct actor run failed: ${errorText}`);
        
        let errorDetails = "Error connecting to data provider";
        try {
          // Try to parse the error for better details
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.error?.message || errorJson.error || errorText;
        } catch (e) {
          errorDetails = errorText;
        }
        
        // Mark for manual review with details
        await supabase
          .from("diagnostic_submissions")
          .update({
            status: "pending_manual_review",
            scraped_data: {
              error: errorDetails,
              error_at: new Date().toISOString(),
              reason: "api_error",
              url: startUrl
            }
          })
          .eq("id", id);
          
        return new Response(
          JSON.stringify({
            success: false,
            message: "We encountered an error accessing the property data, but we've noted your submission for manual review.",
            details: errorDetails
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      // If successful, process the run data
      const runData = await directRunResponse.json();
      const runId = runData.data.id;
      
      console.log(`Successfully started Apify direct actor run with ID: ${runId}`);
      
      // Store the Apify run ID in the database
      await supabase
        .from("diagnostic_submissions")
        .update({
          status: "scraping",
          scraped_data: {
            apify_run_id: runId,
            started_at: new Date().toISOString(),
            url: startUrl
          }
        })
        .eq("id", id);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Diagnostic processing started with direct actor run",
          runId
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } catch (apiError) {
      // Catch any unexpected errors during API calls
      console.error("Apify API error:", apiError);
      
      // Update with detailed error information
      await supabase
        .from("diagnostic_submissions")
        .update({
          status: "pending_manual_review",
          scraped_data: {
            error: String(apiError),
            error_at: new Date().toISOString(),
            reason: "unexpected_error",
            url: startUrl
          }
        })
        .eq("id", id);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "We encountered an unexpected error, but we've noted your submission for manual review.",
          error: String(apiError)
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
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

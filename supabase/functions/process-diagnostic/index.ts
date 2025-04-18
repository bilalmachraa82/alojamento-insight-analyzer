
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

    // Determine platform and select appropriate actor ID
    // IMPORTANT: These must be exact Apify actor IDs that exist in your Apify account or publicly
    let actorId;
    switch (submission.plataforma.toLowerCase()) {
      case "airbnb":
        actorId = "apify/airbnb-scraper";
        break;
      case "booking":
        actorId = "apify/booking-scraper"; // Fixed: was previously incorrect
        break;
      case "vrbo":
        actorId = "apify/vrbo-scraper";
        break;
      default:
        // Default to a generic web scraper
        actorId = "apify/web-scraper";
    }

    console.log(`Using actor ${actorId} for platform ${submission.plataforma}`);

    if (!APIFY_API_TOKEN) {
      console.error("Missing APIFY_API_TOKEN");
      return new Response(
        JSON.stringify({ error: "Missing API token configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Apify API to start the scraper
    const apifyUrl = `https://api.apify.com/v2/acts?token=${APIFY_API_TOKEN}`;
    
    // Create a new task for the actor by running the actor directly
    const runResponse = await fetch(apifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        actId: actorId,
        runInput: {
          url: submission.link,
          maxPages: 1, // Limiting to keep processing time reasonable
          proxyConfiguration: {
            useApifyProxy: true
          }
        },
        // Give the task a name based on the submission ID
        name: `Diagnostic-${id}`,
      }),
    });
    
    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      throw new Error(`Failed to run actor: ${errorText}`);
    }
    
    const runData = await runResponse.json();
    const runId = runData.data.id;
    
    // Store the Apify run ID in the database
    await supabase
      .from("diagnostic_submissions")
      .update({
        status: "scraping",
        scraped_data: {
          apify_run_id: runId,
          started_at: new Date().toISOString(),
        }
      })
      .eq("id", id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Diagnostic processing started successfully",
        runId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error processing diagnostic:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

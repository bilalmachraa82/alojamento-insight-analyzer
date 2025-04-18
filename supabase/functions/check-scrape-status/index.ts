
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

    // Extract Apify run ID
    const scraped_data = submission.scraped_data || {};
    const runId = scraped_data.apify_run_id;

    if (!runId) {
      return new Response(
        JSON.stringify({ error: "Missing Apify run ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check run status
    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_TOKEN}`
    );
    
    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      throw new Error(`Failed to check run status: ${errorText}`);
    }

    const statusData = await statusResponse.json();
    const runStatus = statusData.data.status;

    // If run is finished, fetch the dataset
    if (runStatus === "SUCCEEDED") {
      // Get dataset ID
      const datasetId = statusData.data.defaultDatasetId;
      
      // Fetch dataset items
      const datasetResponse = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`
      );
      
      if (!datasetResponse.ok) {
        const errorText = await datasetResponse.text();
        throw new Error(`Failed to fetch dataset: ${errorText}`);
      }
      
      const propertyData = await datasetResponse.json();
      
      // Update the submission with the scraped data
      await supabase
        .from("diagnostic_submissions")
        .update({
          status: "scraping_completed",
          scraped_data: {
            ...scraped_data,
            property_data: propertyData,
            completed_at: new Date().toISOString(),
          }
        })
        .eq("id", id);
        
      // Trigger the analyze-property function to process the data with Gemini API
      try {
        const analyzeResponse = await supabase.functions.invoke("analyze-property", {
          body: { id }
        });
        
        console.log("Analysis process started:", analyzeResponse);
      } catch (analyzeError) {
        console.error("Error triggering property analysis:", analyzeError);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          status: "scraping_completed",
          message: "Scraping completed successfully, analysis started",
          data: propertyData
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } else {
      // Return the current status
      return new Response(
        JSON.stringify({
          success: true,
          status: runStatus,
          message: `Scraping is ${runStatus.toLowerCase()}`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  } catch (error) {
    console.error("Error checking scrape status:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

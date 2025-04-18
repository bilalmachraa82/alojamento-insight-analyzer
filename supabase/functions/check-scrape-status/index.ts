
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

    // Handle case where there was an error in processing
    if (submission.status === "pending_manual_review") {
      return new Response(
        JSON.stringify({
          success: false,
          status: "pending_manual_review",
          message: "This submission requires manual review"
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
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

    try {
      // Check run status
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_TOKEN}`
      );
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error(`Failed to check run status: ${errorText}`);
        
        // Try the alternative endpoint format if the first one fails
        const alternativeResponse = await fetch(
          `https://api.apify.com/v2/acts/runs/${runId}?token=${APIFY_API_TOKEN}`
        );
        
        if (!alternativeResponse.ok) {
          const altErrorText = await alternativeResponse.text();
          throw new Error(`Failed to check run status with both endpoints: ${altErrorText}`);
        }
        
        const statusData = await alternativeResponse.json();
        const runStatus = statusData.data.status;
        
        return handleRunStatus(runStatus, statusData.data, scraped_data, id);
      }
      
      const statusData = await statusResponse.json();
      const runStatus = statusData.data.status;
      
      return handleRunStatus(runStatus, statusData.data, scraped_data, id);
    } catch (error) {
      console.error("Error checking Apify run status:", error);
      
      // Return a reasonable response even if there's an error checking status
      return new Response(
        JSON.stringify({
          status: submission.status,
          message: "Unable to check current scraping status, will retry later"
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
  
  // Helper function to handle run status
  async function handleRunStatus(runStatus: string, runData: any, scraped_data: any, id: string) {
    // If run is finished, fetch the dataset
    if (runStatus === "SUCCEEDED") {
      // Get dataset ID
      const datasetId = runData.defaultDatasetId;
      
      if (!datasetId) {
        return new Response(
          JSON.stringify({ 
            error: "No dataset ID available in the run",
            status: "error"
          }),
          { 
            status: 200,  // Return 200 to avoid client errors
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      // Fetch dataset items
      try {
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
      } catch (datasetError) {
        console.error("Error fetching dataset:", datasetError);
        
        return new Response(
          JSON.stringify({
            status: "error_fetching_data",
            message: "Error retrieving scraped data",
            error: String(datasetError)
          }),
          { 
            status: 200, // Return 200 to avoid client errors
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
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
  }
});

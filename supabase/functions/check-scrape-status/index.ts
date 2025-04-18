
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = "https://rhrluvhbajdsnmvnpjzk.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id } = await req.json();
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing submission ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    if (submission.status === "pending_manual_review") {
      return new Response(
        JSON.stringify({
          success: false,
          status: "pending_manual_review",
          message: "This submission requires manual review"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const scraped_data = submission.scraped_data || {};
    const runId = scraped_data.apify_run_id;

    if (!runId) {
      return new Response(
        JSON.stringify({ error: "Missing Apify run ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_TOKEN}`
      );

      if (!statusResponse.ok) {
        console.error(`Failed to check run status: ${await statusResponse.text()}`);
        throw new Error("Failed to check run status");
      }

      const statusData = await statusResponse.json();
      const runStatus = statusData.data.status;

      if (runStatus === "SUCCEEDED") {
        const datasetId = statusData.data.defaultDatasetId;

        if (!datasetId) {
          throw new Error("No dataset ID available");
        }

        const datasetResponse = await fetch(
          `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`
        );

        if (!datasetResponse.ok) {
          throw new Error(`Failed to fetch dataset: ${await datasetResponse.text()}`);
        }

        const propertyData = await datasetResponse.json();
        
        // The Website Content Crawler returns an array of pages, we want the first one
        const mainPageData = propertyData[0];

        await supabase
          .from("diagnostic_submissions")
          .update({
            status: "scraping_completed",
            scraped_data: {
              ...scraped_data,
              property_data: mainPageData,
              completed_at: new Date().toISOString(),
            }
          })
          .eq("id", id);

        try {
          await supabase.functions.invoke("analyze-property", {
            body: { id }
          });
        } catch (analyzeError) {
          console.error("Error triggering property analysis:", analyzeError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            status: "scraping_completed",
            message: "Data collection completed, analysis started",
            data: mainPageData
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: runStatus,
          message: `Data collection is ${runStatus.toLowerCase()}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (error) {
      console.error("Error checking status:", error);
      
      return new Response(
        JSON.stringify({
          status: submission.status,
          message: "Unable to check current status, will retry later"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error checking scrape status:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


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
  // Handle CORS preflight requests
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

    const startUrl = submission.link;
    console.log(`Processing URL: ${startUrl}`);
    
    try {
      // Use the Website Content Crawler actor
      const websiteContentCrawlerUrl = `https://api.apify.com/v2/acts/apify~website-content-crawler/runs?token=${APIFY_API_TOKEN}`;
      
      console.log(`Making request to Website Content Crawler`);
      
      const actorInput = {
        startUrls: [{ url: startUrl }],
        maxCrawlPages: 1, // We only need the property page
        crawlerType: "playwright:chrome", // Use the Chrome browser for best compatibility
        saveHtml: false,
        saveMarkdown: true,
        waitForDynamicContent: true,
        maxScrollHeight: 5000, // Ensure we get all content
        htmlTransformer: "readability", // Clean up the HTML content
        removeElements: [
          ".cookie-banner",
          ".cookie-consent",
          "nav",
          "header",
          "footer",
          ".advertisement",
          ".ad-container"
        ]
      };
      
      const runResponse = await fetch(websiteContentCrawlerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(actorInput),
      });
      
      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        console.error(`Website Content Crawler run failed: ${errorText}`);
        
        await supabase
          .from("diagnostic_submissions")
          .update({
            status: "pending_manual_review",
            scraped_data: {
              error: errorText,
              error_at: new Date().toISOString(),
              reason: "api_error",
              url: startUrl,
              actor_input: actorInput
            }
          })
          .eq("id", id);
          
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
      
      const runData = await runResponse.json();
      const runId = runData.data.id;
      
      console.log(`Successfully started Website Content Crawler run with ID: ${runId}`);
      
      await supabase
        .from("diagnostic_submissions")
        .update({
          status: "scraping",
          scraped_data: {
            apify_run_id: runId,
            started_at: new Date().toISOString(),
            url: startUrl,
            actor_input: actorInput
          }
        })
        .eq("id", id);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Property data collection started",
          runId
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
      
    } catch (apiError) {
      console.error("Apify API error:", apiError);
      
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

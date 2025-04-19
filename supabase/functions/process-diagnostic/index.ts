
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
      console.error("Missing submission ID");
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

    let startUrl = submission.link;
    console.log(`Processing URL: ${startUrl}`);
    
    // Check if the URL is a Booking.com Share URL
    if (startUrl.includes("booking.com/Share-") || startUrl.includes("booking.com/share-")) {
      console.log("Detected Booking.com share URL. These URLs are not recommended.");
      
      await supabase
        .from("diagnostic_submissions")
        .update({
          status: "pending_manual_review",
          scraped_data: {
            error: "Booking.com share URL detected",
            error_at: new Date().toISOString(),
            reason: "incompatible_url",
            url: startUrl,
            message: "Share URLs from Booking.com are not supported. Please use the complete property URL."
          }
        })
        .eq("id", id);
        
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
    
    try {
      console.log("Starting Apify scraping process");
      
      // Determine which actor to use based on the platform
      let actorId = "apify/website-content-crawler";
      let actorInput = {};
      
      // Get platform from submission
      const platform = submission.plataforma?.toLowerCase();
      
      if (platform === "booking") {
        console.log("Using Booking Reviews Scraper");
        actorId = "maxcopell/booking-reviews-scraper";
        actorInput = {
          startUrls: [{ url: startUrl }],
          proxyConfiguration: { useApifyProxy: true },
          maxReviews: 100,
          debugLog: true
        };
      } else if (platform === "airbnb") {
        console.log("Using Airbnb Scraper");
        actorId = "apify/airbnb-scraper";
        actorInput = {
          startUrls: [{ url: startUrl }],
          proxyConfiguration: { useApifyProxy: true },
          maxListings: 1,
          includeReviews: true,
          maxReviews: 100
        };
      } else if (platform === "vrbo") {
        console.log("Using VRBO Scraper");
        actorId = "apify/vrbo-scraper";
        actorInput = {
          startUrls: [{ url: startUrl }],
          proxyConfiguration: { useApifyProxy: true },
          maxListings: 1,
          includeReviews: true
        };
      } else {
        // Fallback to website content crawler for other platforms
        console.log("Using generic Website Content Crawler for platform:", platform);
        actorInput = {
          startUrls: [{ url: startUrl }],
          maxCrawlPages: 1,
          crawlerType: "playwright:chrome",
          saveHtml: false,
          saveMarkdown: true,
          saveScreenshots: false,
          waitForDynamicContent: true,
          maxScrollHeight: 5000,
          htmlTransformer: "readableText",
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
      }
      
      // Log which actor we're using and with what input
      console.log(`Using Apify actor: ${actorId}`);
      console.log("Actor input:", JSON.stringify(actorInput));
      
      // Make the API request to Apify
      const apiUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_TOKEN}`;
      console.log("Making request to Apify at URL:", apiUrl);
      
      const runResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(actorInput),
      });
      
      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        console.error(`Apify API request failed: ${errorText}`);
        
        await supabase
          .from("diagnostic_submissions")
          .update({
            status: "pending_manual_review",
            scraped_data: {
              error: errorText,
              error_at: new Date().toISOString(),
              reason: "api_error",
              url: startUrl,
              actor_id: actorId,
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
      
      console.log(`Successfully started Apify run with ID: ${runId}`);
      
      await supabase
        .from("diagnostic_submissions")
        .update({
          status: "scraping",
          scraped_data: {
            apify_run_id: runId,
            actor_id: actorId,
            started_at: new Date().toISOString(),
            url: startUrl,
            platform: platform,
            actor_input: actorInput
          }
        })
        .eq("id", id);
      
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

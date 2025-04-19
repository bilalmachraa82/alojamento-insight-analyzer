
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Configure Supabase client
const supabaseUrl = "https://rhrluvhbajdsnmvnpjzk.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

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

    console.log(`Checking status for submission: ${id}`);

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

    const status = submission.status;
    const analysisResult = submission.analysis_result;
    const scraped_data = submission.scraped_data || {};
    
    console.log(`Current status for submission ${id}: ${status}`);
    
    // If there's an error with a Booking.com Share URL, notify the user
    if (status === "pending_manual_review" && 
        scraped_data.reason === "incompatible_url" && 
        (submission.link.includes("booking.com/Share-") || submission.link.includes("booking.com/share-"))) {
      
      return new Response(
        JSON.stringify({
          status: "error_shortened_link",
          message: "Booking.com share URLs are not supported. Please use the complete property URL.",
          suggestion: "Try submitting again with the full URL from your browser's address bar that starts with https://www.booking.com/hotel/"
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // If the status is "analyzing" and it's been more than 5 minutes, check if we need to retry
    if (status === "analyzing") {
      const startedAt = scraped_data.analysis_started_at;
      if (startedAt) {
        const startTime = new Date(startedAt).getTime();
        const currentTime = new Date().getTime();
        const elapsedTimeMinutes = (currentTime - startTime) / (1000 * 60);
        
        // If analysis has been running for more than 5 minutes, retry it
        if (elapsedTimeMinutes > 5) {
          console.log(`Analysis for ${id} has been running for ${elapsedTimeMinutes.toFixed(1)} minutes. Retrying...`);
          
          // Update the scraped data to include this retry attempt
          const updatedScrapedData = {
            ...scraped_data,
            retry_attempts: ((scraped_data.retry_attempts || 0) + 1),
            last_retry_at: new Date().toISOString()
          };
          
          // If we've retried too many times, move to manual review
          if (updatedScrapedData.retry_attempts > 3) {
            console.log(`Too many retry attempts (${updatedScrapedData.retry_attempts}) for submission ${id}. Moving to manual review.`);
            
            await supabase
              .from("diagnostic_submissions")
              .update({
                status: "pending_manual_review",
                scraped_data: {
                  ...updatedScrapedData,
                  manual_review_reason: "too_many_retries",
                  manual_review_at: new Date().toISOString()
                }
              })
              .eq("id", id);
              
            return new Response(
              JSON.stringify({
                status: "pending_manual_review",
                message: "Your property analysis requires manual review for best results. Our team will contact you soon."
              }),
              { 
                status: 200, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
              }
            );
          }
          
          await supabase
            .from("diagnostic_submissions")
            .update({ scraped_data: updatedScrapedData })
            .eq("id", id);
          
          // Invoke the analyze-property function to retry the analysis
          try {
            const retryResponse = await supabase.functions.invoke("analyze-property", {
              body: { id }
            });
            
            if (retryResponse.error) {
              console.error("Error retrying analysis:", retryResponse.error);
            } else {
              console.log("Analysis retry initiated");
            }
          } catch (retryError) {
            console.error("Exception retrying analysis:", retryError);
          }
        }
      }
    }
    
    // If the analysis is completed or failed, return the current status
    if (status === "completed" || status === "failed") {
      return new Response(
        JSON.stringify({
          status,
          analysisResult: status === "completed" ? analysisResult : null,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // If the status is "pending_manual_review", return the current status
    if (status === "pending_manual_review" || status === "manual_review_requested") {
      return new Response(
        JSON.stringify({
          status,
          message: `Current status: ${status}`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // If the status is "scraping", check the status of the Apify run
    if (status === "scraping" && scraped_data.apify_run_id) {
      try {
        // Invoke the check-scrape-status function to get the latest status
        const checkResponse = await supabase.functions.invoke("check-scrape-status", {
          body: { id }
        });
        
        if (checkResponse.data?.status === "scraping_completed") {
          return new Response(
            JSON.stringify({
              status: "scraping_completed",
              message: "Scraping completed, analysis initiated"
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
        
        return new Response(
          JSON.stringify({
            status,
            message: `Current status: ${status}`
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
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
    }
    
    // For all other statuses, just return the current status
    return new Response(
      JSON.stringify({
        status,
        message: `Current status: ${status}`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error checking status:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

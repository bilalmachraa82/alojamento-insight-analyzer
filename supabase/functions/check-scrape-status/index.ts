
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
      // This checks the status of the Apify actor run
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
        
        if (!mainPageData) {
          throw new Error("No data returned from the crawler");
        }

        // Extract key property information from Website Content Crawler output
        const propertyInfo = {
          property_name: extractPropertyName(mainPageData),
          content: mainPageData.text || mainPageData.markdown || '',
          location: extractLocation(mainPageData.text || mainPageData.markdown || ''),
          url: mainPageData.url,
          property_type: detectPropertyType(mainPageData.text || mainPageData.markdown || ''),
          scraped_at: new Date().toISOString()
        };

        await supabase
          .from("diagnostic_submissions")
          .update({
            status: "scraping_completed",
            scraped_data: {
              ...scraped_data,
              property_data: propertyInfo,
              raw_data: mainPageData,
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
            data: propertyInfo
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

// Helper function to extract property name from data
function extractPropertyName(pageData: any): string {
  // Try to get the title from metadata first
  if (pageData.metadata && pageData.metadata.title) {
    // Clean up the title (sometimes it contains the platform name)
    let title = pageData.metadata.title;
    
    // Remove platform names from the title
    const platformNames = ['Booking.com', 'Airbnb', 'VRBO', 'HomeAway', 'Expedia', 'TripAdvisor'];
    platformNames.forEach(name => {
      title = title.replace(` - ${name}`, '').replace(`${name} - `, '').replace(` | ${name}`, '');
    });
    
    return title.trim();
  }
  
  // If no metadata title, try to find a heading in the content
  if (pageData.text) {
    // Look for what might be a heading (first line or strong text pattern)
    const lines = pageData.text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 0) {
      return lines[0].trim();
    }
  }
  
  // Fallback
  return 'Unknown Property';
}

// Helper function to extract location from text
function extractLocation(text: string): string {
  // Simple extraction - look for common location patterns
  const locationPatterns = [
    /located in ([^,.]+)/i,
    /in ([^,.]+) area/i,
    /situated in ([^,.]+)/i,
    /property in ([^,.]+)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Look for location in common formats
  const match = text.match(/(?:located in|in|near) ([A-Z][a-z]+(?: [A-Z][a-z]+)*)/);
  if (match && match[1]) {
    return match[1];
  }
  
  return 'Unknown location';
}

// Helper function to detect property type
function detectPropertyType(text: string): string {
  const lowerText = text.toLowerCase();
  
  const propertyTypes = [
    { type: 'Apartment', keywords: ['apartment', 'flat', 'condo', 'condominium'] },
    { type: 'House', keywords: ['house', 'home', 'villa', 'cottage', 'bungalow'] },
    { type: 'Room', keywords: ['room', 'private room', 'shared room', 'bedroom'] },
    { type: 'Hotel', keywords: ['hotel', 'inn', 'motel', 'suite', 'lodging'] },
    { type: 'Resort', keywords: ['resort', 'spa', 'retreat'] }
  ];
  
  for (const { type, keywords } of propertyTypes) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return type;
      }
    }
  }
  
  return 'Accommodation';
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const propertyData = submission.property_data || {};
    const runId = submission.actor_run_id;
    const actorId = submission.actor_id || "apify~website-content-crawler";

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

        const scrapedData = await datasetResponse.json();
        
        // Process the data based on which actor was used
        let propertyInfo;
        
        if (actorId.includes("voyager/booking-reviews-scraper")) {
          // Handle Voyager Booking Reviews Scraper format
          propertyInfo = processVoyagerBookingData(scrapedData);
        } else if (actorId.includes("airbnb-scraper")) {
          // Handle Airbnb Scraper format
          propertyInfo = processAirbnbData(scrapedData);
        } else if (actorId.includes("vrbo-scraper")) {
          // Handle VRBO Scraper format
          propertyInfo = processVrboData(scrapedData);
        } else {
          // Default Website Content Crawler processing
          propertyInfo = processWebsiteContentData(scrapedData);
        }
        
        // Add common fields
        propertyInfo.scraped_at = new Date().toISOString();
        propertyInfo.actor_id = actorId;
        propertyInfo.run_id = runId;
        
        console.log("Processed property info:", JSON.stringify(propertyInfo, null, 2));

        await supabase
          .from("diagnostic_submissions")
          .update({
            status: "scraping_completed",
            property_data: {
              ...propertyData,
              property_data: propertyInfo,
              raw_data: scrapedData,
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

function processVoyagerBookingData(data: any[]): any {
  console.log("Processing Voyager Booking Reviews data");
  
  if (!data || data.length === 0) {
    console.log("No Voyager Booking Reviews data found");
    return { property_name: 'Unknown Property', location: 'Unknown location', property_type: 'Accommodation' };
  }
  
  try {
    // Log the structure of the data for debugging
    console.log("Voyager Booking data structure:", JSON.stringify(data.slice(0, 1), null, 2));
    
    // The Voyager Booking Reviews Scraper format has each property as a separate item
    const propertyData = data[0] || {};
    
    // Extract property information based on the format from the documentation
    const property = {
      name: propertyData.hotelName || propertyData.name || 'Unknown Property',
      address: propertyData.hotelAddress || propertyData.address || 'Unknown location',
      url: propertyData.hotelUrl || propertyData.url || '',
      rating: propertyData.hotelRating || propertyData.rating || 0,
      reviewsCount: propertyData.reviewsCount || 0,
      facilities: propertyData.facilities || [],
      location: propertyData.location || ''
    };
    
    // Extract reviews - the format from Voyager puts them in reviewsList
    const reviews = propertyData.reviewsList || [];
    const formattedReviews = (reviews || []).map((review: any) => ({
      author: review.authorName || 'Anonymous',
      rating: review.rating || 0,
      date: review.date || '',
      title: review.title || '',
      text: review.text || '',
      positivePart: review.positivePart || '',
      negativePart: review.negativePart || '',
      stayDate: review.stayDate || '',
      roomType: review.roomType || '',
    }));
    
    return {
      property_name: property.name,
      location: property.address || property.location || 'Unknown location',
      url: property.url,
      property_type: 'Accommodation',
      rating: property.rating,
      review_count: property.reviewsCount || formattedReviews.length,
      reviews: formattedReviews.slice(0, 10), // Take first 10 reviews for analysis
      amenities: property.facilities || [],
      images: propertyData.images || [],
    };
  } catch (e) {
    console.error("Error processing Voyager Booking data:", e);
    return { 
      property_name: 'Error Processing Data',
      location: 'Unknown',
      property_type: 'Accommodation',
      error: String(e)
    };
  }
}

function processBookingReviewsData(data: any[]): any {
  console.log("Processing Booking data");
  
  if (!data || data.length === 0) {
    console.log("No Booking data found");
    return { property_name: 'Unknown Property', location: 'Unknown location', property_type: 'Accommodation' };
  }
  
  try {
    // The Booking Scraper returns information about the property and its reviews
    const property = data[0] || {};
    
    return {
      property_name: property.name || property.propertyName || property.hotelName || 'Unknown Property',
      location: property.address || property.location || 'Unknown location',
      url: property.url || '',
      property_type: property.propertyType || 'Accommodation',
      rating: property.rating || property.overallRating || null,
      review_count: property.reviewCount || property.totalReviewCount || 0,
      reviews: (property.reviews || []).slice(0, 10), // Take first 10 reviews for analysis
      amenities: property.amenities || [],
      images: property.images || [],
      room_types: property.roomTypes || []
    };
  } catch (e) {
    console.error("Error processing Booking data:", e);
    return { 
      property_name: 'Error Processing Data',
      location: 'Unknown',
      property_type: 'Accommodation',
      error: String(e)
    };
  }
}

function processAirbnbData(data: any[]): any {
  console.log("Processing Airbnb data");
  
  if (!data || data.length === 0) {
    console.log("No Airbnb data found");
    return { property_name: 'Unknown Property', location: 'Unknown location', property_type: 'Accommodation' };
  }
  
  try {
    const property = data[0] || {};
    
    return {
      property_name: property.name || property.title || 'Unknown Property',
      location: property.address || property.location?.address || 'Unknown location',
      url: property.url || '',
      property_type: property.roomType || property.type || 'Accommodation',
      rating: property.rating || property.star_rating || null,
      review_count: property.numberOfReviews || property.review_count || 0,
      reviews: (property.reviews || []).slice(0, 10),
      amenities: property.amenities || [],
      images: property.images || [],
      price: property.price || property.pricing
    };
  } catch (e) {
    console.error("Error processing Airbnb data:", e);
    return { 
      property_name: 'Error Processing Data',
      location: 'Unknown',
      property_type: 'Accommodation',
      error: String(e)
    };
  }
}

function processVrboData(data: any[]): any {
  console.log("Processing VRBO data");
  
  if (!data || data.length === 0) {
    console.log("No VRBO data found");
    return { property_name: 'Unknown Property', location: 'Unknown location', property_type: 'Accommodation' };
  }
  
  try {
    const property = data[0] || {};
    
    return {
      property_name: property.name || property.title || 'Unknown Property',
      location: property.location || property.address || 'Unknown location',
      url: property.url || '',
      property_type: property.propertyType || property.type || 'Accommodation',
      rating: property.averageRating || property.rating || null,
      review_count: property.reviewCount || property.numberOfReviews || 0,
      reviews: (property.reviews || []).slice(0, 10),
      amenities: property.amenities || [],
      images: property.images || [],
      price: property.price || property.pricing
    };
  } catch (e) {
    console.error("Error processing VRBO data:", e);
    return { 
      property_name: 'Error Processing Data',
      location: 'Unknown',
      property_type: 'Accommodation',
      error: String(e)
    };
  }
}

function processWebsiteContentData(pageData: any[]): any {
  console.log("Processing Website Content Crawler data");
  
  if (!pageData || pageData.length === 0) {
    console.log("No Website Content Crawler data found");
    return { property_name: 'Unknown Property', location: 'Unknown location', property_type: 'Accommodation' };
  }
  
  try {
    // Get the first page data
    const mainPageData = pageData[0];
    
    // Extract key property information from Website Content Crawler output
    return {
      property_name: extractPropertyName(mainPageData),
      content: mainPageData.text || mainPageData.markdown || '',
      location: extractLocation(mainPageData.text || mainPageData.markdown || ''),
      url: mainPageData.url,
      property_type: detectPropertyType(mainPageData.text || mainPageData.markdown || '')
    };
  } catch (e) {
    console.error("Error processing Website Content Crawler data:", e);
    return { 
      property_name: 'Error Processing Data',
      location: 'Unknown',
      property_type: 'Accommodation',
      error: String(e)
    };
  }
}

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

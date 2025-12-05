import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { requireEnv, SCRAPER_ENV } from "../_shared/env-validator.ts";

const env = requireEnv(SCRAPER_ENV);
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const APIFY_API_TOKEN = env.APIFY_API_TOKEN;

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

    // If submission already moved past scraping, return its DB status immediately
    const passthroughStatuses = [
      "completed",
      "analyzing",
      "failed",
      "pending_manual_review",
      "manual_review_requested",
      "scraping_completed"
    ];
    if (submission.status && passthroughStatuses.includes(submission.status)) {
      return new Response(
        JSON.stringify({
          success: true,
          status: submission.status,
          message: `Current status: ${submission.status}`
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
        
        if (actorId.includes("dtrungtin/booking-scraper") || actorId.includes("booking-scraper")) {
          // Handle dtrungtin Booking Scraper format (PRIORITY)
          propertyInfo = processBookingScraperData(scrapedData);
        } else if (actorId.includes("voyager/booking-reviews-scraper")) {
          // Handle Voyager Booking Reviews Scraper format
          propertyInfo = processVoyagerBookingData(scrapedData);
        } else if (actorId.includes("airbnb-scraper") || actorId.includes("GsNzxEKzE2vQ5d9HN")) {
          // Handle Airbnb Scraper format
          propertyInfo = processAirbnbData(scrapedData);
        } else if (actorId.includes("vrbo") || actorId.includes("powerai/vrbo")) {
          // Handle VRBO Scraper format
          propertyInfo = processVrboData(scrapedData);
        } else if (actorId.includes("agoda") || actorId.includes("eC53oEoee74OTExo3")) {
          // Handle Agoda Scraper format
          propertyInfo = processAgodaData(scrapedData);
        } else if (actorId.includes("expedia") || actorId.includes("jupri/expedia")) {
          // Handle Expedia Scraper format
          propertyInfo = processExpediaData(scrapedData);
        } else if (actorId.includes("hotels.com") || actorId.includes("tri_angle/expedia-hotels-com")) {
          // Handle Hotels.com Scraper format
          propertyInfo = processHotelsComData(scrapedData);
        } else {
          // Default Website Content Crawler processing
          propertyInfo = processWebsiteContentData(scrapedData);
        }
        
        // Add common fields
        propertyInfo.scraped_at = new Date().toISOString();
        propertyInfo.actor_id = actorId;
        propertyInfo.run_id = runId;
        
        console.log("Processed property info:", JSON.stringify(propertyInfo, null, 2));

        // Validate scraped data quality
        if (!validateScrapedData(propertyInfo)) {
          console.warn("Scraped data validation failed - insufficient data quality");
          
          await supabase
            .from("diagnostic_submissions")
            .update({
              status: "pending_manual_review",
              property_data: {
                ...propertyData,
                property_data: propertyInfo,
                raw_data: scrapedData,
                validation_failed: true,
                validation_reason: "insufficient_data_quality",
                completed_at: new Date().toISOString(),
              }
            })
            .eq("id", id);

          return new Response(
            JSON.stringify({
              success: true,
              status: "pending_manual_review",
              message: "Data collection completed but needs manual review due to insufficient data quality",
              data: propertyInfo
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

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
          console.log("Triggering Claude analysis for submission:", id);
          await supabase.functions.invoke("analyze-property-claude", {
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

function validateScrapedData(data: any): boolean {
  // Validate that we have minimum required data for analysis
  return !!(
    data.property_name &&
    data.property_name !== 'Unknown Property' &&
    data.location &&
    data.location !== 'Unknown location' &&
    (data.rating > 0 || data.review_count > 0 || data.amenities?.length > 0)
  );
}

function processBookingScraperData(data: any[]): any {
  console.log("Processing dtrungtin/booking-scraper data");
  
  if (!data || data.length === 0) {
    console.log("No booking scraper data found");
    return { property_name: 'Unknown Property', location: 'Unknown location', property_type: 'Accommodation' };
  }
  
  try {
    const property = data[0] || {};
    
    // Extract comprehensive property information
    const result = {
      property_name: property.name || property.hotelName || 'Unknown Property',
      location: property.address || property.location || 'Unknown location',
      url: property.url || '',
      property_type: property.type || property.propertyType || 'Hotel',
      rating: parseFloat(property.rating || property.reviewScore || '0'),
      review_count: parseInt(property.reviews || property.reviewCount || '0', 10),
      price: property.price || property.avgPrice || 'Preço não disponível',
      description: property.description || property.propertyDescription || '',
      amenities: Array.isArray(property.amenities) ? property.amenities : 
                 (property.facilities ? (Array.isArray(property.facilities) ? property.facilities : []) : []),
      images: Array.isArray(property.photos) ? property.photos.slice(0, 10) : [],
      rooms: property.rooms || property.numberOfRooms || 0,
      facilities: Array.isArray(property.facilities) ? property.facilities : [],
      check_in: property.checkIn || property.checkInTime || '',
      check_out: property.checkOut || property.checkOutTime || '',
      hotel_id: property.hotelId || property.id || ''
    };
    
    console.log("Extracted booking data:", JSON.stringify({
      name: result.property_name,
      rating: result.rating,
      reviews: result.review_count,
      amenities_count: result.amenities.length,
      has_description: result.description.length > 0
    }));
    
    return result;
  } catch (e) {
    console.error("Error processing Booking scraper data:", e);
    return { 
      property_name: 'Error Processing Data',
      location: 'Unknown',
      property_type: 'Accommodation',
      error: String(e)
    };
  }
}

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

function processAgodaData(data: any[]): any {
  console.log("Processing Agoda data");
  
  if (!data || data.length === 0) {
    console.log("No Agoda data found");
    return { property_name: 'Unknown Property', location: 'Unknown location', property_type: 'Accommodation' };
  }
  
  try {
    const property = data[0] || {};
    
    return {
      property_name: property.hotelName || property.name || property.title || 'Unknown Property',
      location: property.address || property.location || property.city || 'Unknown location',
      url: property.url || property.hotelUrl || '',
      property_type: property.propertyType || property.accommodationType || 'Hotel',
      rating: property.rating || property.score || property.reviewScore || null,
      review_count: property.reviewCount || property.numberOfReviews || property.totalReviews || 0,
      reviews: (property.reviews || property.reviewsList || []).slice(0, 10),
      amenities: property.amenities || property.facilities || [],
      images: property.images || property.photos || [],
      price: property.price || property.pricePerNight || property.rate || 'Preço não disponível',
      description: property.description || property.hotelDescription || '',
      star_rating: property.starRating || property.stars || null
    };
  } catch (e) {
    console.error("Error processing Agoda data:", e);
    return { 
      property_name: 'Error Processing Data',
      location: 'Unknown',
      property_type: 'Accommodation',
      error: String(e)
    };
  }
}

function processExpediaData(data: any[]): any {
  console.log("Processing Expedia data");
  
  if (!data || data.length === 0) {
    console.log("No Expedia data found");
    return { property_name: 'Unknown Property', location: 'Unknown location', property_type: 'Accommodation' };
  }
  
  try {
    const property = data[0] || {};
    
    return {
      property_name: property.name || property.hotelName || property.title || 'Unknown Property',
      location: property.address || property.location || property.neighborhood || 'Unknown location',
      url: property.url || property.hotelUrl || '',
      property_type: property.propertyType || property.lodgingType || 'Hotel',
      rating: property.rating || property.guestRating || property.reviewScore || null,
      review_count: property.reviewCount || property.numberOfReviews || property.reviewsCount || 0,
      reviews: (property.reviews || property.guestReviews || []).slice(0, 10),
      amenities: property.amenities || property.hotelAmenities || [],
      images: property.images || property.photos || property.gallery || [],
      price: property.price || property.currentPrice || property.ratePerNight || 'Preço não disponível',
      description: property.description || property.hotelDescription || '',
      star_rating: property.starRating || property.stars || property.hotelClass || null
    };
  } catch (e) {
    console.error("Error processing Expedia data:", e);
    return { 
      property_name: 'Error Processing Data',
      location: 'Unknown',
      property_type: 'Accommodation',
      error: String(e)
    };
  }
}

function processHotelsComData(data: any[]): any {
  console.log("Processing Hotels.com data");
  
  if (!data || data.length === 0) {
    console.log("No Hotels.com data found");
    return { property_name: 'Unknown Property', location: 'Unknown location', property_type: 'Accommodation' };
  }
  
  try {
    const property = data[0] || {};
    
    return {
      property_name: property.hotelName || property.name || property.title || 'Unknown Property',
      location: property.address || property.location || property.neighborhood || 'Unknown location',
      url: property.url || property.hotelUrl || '',
      property_type: property.propertyType || property.accommodationType || 'Hotel',
      rating: property.rating || property.guestRating || property.reviewScore || null,
      review_count: property.reviewCount || property.numberOfReviews || property.totalReviews || 0,
      reviews: (property.reviews || property.guestReviews || []).slice(0, 10),
      amenities: property.amenities || property.hotelAmenities || property.facilities || [],
      images: property.images || property.photos || [],
      price: property.price || property.currentPrice || 'Preço não disponível',
      description: property.description || '',
      star_rating: property.starRating || property.stars || null
    };
  } catch (e) {
    console.error("Error processing Hotels.com data:", e);
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
    const contentText = (mainPageData.text || mainPageData.markdown || '').toString();
    const meta = mainPageData.metadata || {};

    // Extract key property information from Website Content Crawler output
    const property_name = extractPropertyName(mainPageData);

    // Location: try content first, then derive from title (e.g., "Casa do Arco, Sintra, Portugal")
    let location = extractLocation(contentText, property_name);

    // Review count: try to parse from metadata description or page text (pt keywords)
    const reviewSource = (meta.description || contentText || '').toString();
    let review_count = 0;
    const rcMatch = reviewSource.match(/(\d{1,4})\s+(comentários|comentarios|avaliações|avaliacoes)/i);
    if (rcMatch) {
      review_count = parseInt(rcMatch[1], 10);
    }

    // Photo count (optional)
    let photo_count: number | undefined = undefined;
    const pcMatch = reviewSource.match(/(\d{1,4})\s+(fotografias|fotos|imagens)/i);
    if (pcMatch) {
      photo_count = parseInt(pcMatch[1], 10);
    }
    
    // Enhanced: Extract rating
    let rating = 0;
    const ratingMatch = reviewSource.match(/(\d+[.,]\d+)\s*\/\s*10|(\d+[.,]\d+)\s*de\s*10|nota\s*(\d+[.,]\d+)/i);
    if (ratingMatch) {
      const ratingStr = ratingMatch[1] || ratingMatch[2] || ratingMatch[3];
      rating = parseFloat(ratingStr.replace(',', '.')) / 2; // Convert 10-point to 5-point scale
    }
    
    // Enhanced: Extract description (first substantial paragraph)
    const description = extractDescription(contentText);
    
    // Enhanced: Extract amenities/facilities
    const amenities = extractAmenities(contentText);
    
    // Enhanced: Extract price information
    const price = extractPrice(contentText, reviewSource);
    
    // Enhanced: Extract images/photos from metadata
    const images = extractImages(mainPageData);

    return {
      property_name,
      content: contentText,
      description,
      location,
      url: mainPageData.url,
      property_type: detectPropertyType(contentText),
      rating,
      review_count,
      photo_count,
      amenities,
      price,
      images,
      facilities: amenities // Alias for compatibility
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

function extractDescription(text: string): string {
  // Look for common description patterns in Portuguese and English
  const descPatterns = [
    /descrição[:\s]+([^\n]{100,500})/i,
    /description[:\s]+([^\n]{100,500})/i,
    /sobre[:\s]+([^\n]{100,500})/i,
    /about[:\s]+([^\n]{100,500})/i
  ];
  
  for (const pattern of descPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Fallback: get first substantial paragraph (100+ chars)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 100);
  return lines[0] || 'Descrição não disponível';
}

function extractAmenities(text: string): string[] {
  const amenities = new Set<string>();
  const lowerText = text.toLowerCase();
  
  // Common amenities in PT/EN
  const amenityKeywords = {
    'Wi-Fi': ['wi-fi', 'wifi', 'internet'],
    'Ar Condicionado': ['ar condicionado', 'air conditioning', 'a/c'],
    'Estacionamento': ['estacionamento', 'parking', 'garagem'],
    'Piscina': ['piscina', 'pool', 'swimming'],
    'Cozinha': ['cozinha', 'kitchen', 'kitchenette'],
    'TV': ['televisão', 'television', 'tv', 'smart tv'],
    'Máquina de Lavar': ['máquina de lavar', 'washing machine', 'lavandaria'],
    'Aquecimento': ['aquecimento', 'heating', 'calefação'],
    'Varanda': ['varanda', 'balcony', 'terraço'],
    'Jardim': ['jardim', 'garden', 'outdoor'],
    'Animais': ['animais permitidos', 'pets allowed', 'pet friendly'],
    'Ginásio': ['ginásio', 'gym', 'fitness']
  };
  
  for (const [amenity, keywords] of Object.entries(amenityKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        amenities.add(amenity);
        break;
      }
    }
  }
  
  return Array.from(amenities);
}

function extractPrice(text: string, metaText: string): string {
  const combinedText = text + ' ' + metaText;
  
  // Match price patterns
  const pricePatterns = [
    /€\s*(\d+)/,
    /(\d+)\s*€/,
    /(\d+)\s*euros?/i,
    /preço.*?(\d+)/i,
    /price.*?(\d+)/i
  ];
  
  for (const pattern of pricePatterns) {
    const match = combinedText.match(pattern);
    if (match && match[1]) {
      const price = parseInt(match[1]);
      if (price > 20 && price < 5000) { // Reasonable nightly price range
        return `€${price}`;
      }
    }
  }
  
  return 'Preço não disponível';
}

function extractImages(pageData: any): string[] {
  const images: string[] = [];
  
  // Try to get images from metadata
  if (pageData.metadata?.image) {
    images.push(pageData.metadata.image);
  }
  
  // Try to extract from screenshots if available
  if (pageData.screenshot) {
    images.push(pageData.screenshot);
  }
  
  // Try structured data
  if (pageData.structuredData) {
    try {
      const structured = typeof pageData.structuredData === 'string' 
        ? JSON.parse(pageData.structuredData) 
        : pageData.structuredData;
        
      if (structured.image) {
        if (Array.isArray(structured.image)) {
          images.push(...structured.image);
        } else {
          images.push(structured.image);
        }
      }
    } catch (e) {
      console.log("Could not parse structured data for images");
    }
  }
  
  return images.slice(0, 10); // Limit to 10 images
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

function extractLocation(text: string, fallbackTitle?: string): string {
  // Support Portuguese and English patterns
  const patterns: RegExp[] = [
    /(localizado|localizada|situado|situada) em ([^,\.;\n]+)/i,
    /\bem\s+([A-ZÁÉÍÓÚÂÊÎÔÛÀÃÕÇ][\wÀ-ÿ'\-\s]+)/i,
    /(cidade de|região de)\s+([A-ZÁÉÍÓÚÂÊÎÔÛÀÃÕÇ][\wÀ-ÿ'\-\s]+)/i,
    /located in ([^,.]+)/i,
    /situated in ([^,.]+)/i,
    /property in ([^,.]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const loc = match[2] || match[1];
      if (loc) return loc.trim();
    }
  }

  // Fallback: derive from title like "Nome, Cidade, País"
  if (fallbackTitle && fallbackTitle.includes(',')) {
    const parts = fallbackTitle.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return parts.slice(1).join(', ');
    }
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

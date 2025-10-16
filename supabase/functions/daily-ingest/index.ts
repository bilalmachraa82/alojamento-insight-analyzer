import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface ProcessedSubmission {
  id: string;
  property_id?: string;
  metrics: {
    rating: number;
    review_count: number;
    price_per_night: number;
    location: string;
  };
  success: boolean;
  error?: string;
}

interface ChannelDistribution {
  channel_code: string;
  percentage: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const errors: string[] = [];
  let processedCount = 0;

  try {
    console.log("Starting daily-ingest process...");

    // Fetch completed diagnostic submissions with analysis results
    const { data: submissions, error: fetchError } = await supabase
      .from("diagnostic_submissions")
      .select("id, analysis_result, property_data, property_url")
      .eq("status", "completed")
      .not("analysis_result", "is", null)
      .order("updated_at", { ascending: false })
      .limit(100); // Process max 100 per run

    if (fetchError) {
      console.error("Error fetching submissions:", fetchError);
      throw new Error(`Failed to fetch submissions: ${fetchError.message}`);
    }

    if (!submissions || submissions.length === 0) {
      console.log("No completed submissions found to process");
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: "No submissions to process",
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${submissions.length} submissions to process`);

    // Get channel IDs for distribution
    const { data: channels, error: channelsError } = await supabase
      .from("dim_channel")
      .select("id, channel_code")
      .in("channel_code", ["AIRBNB", "BOOKING", "DIRECT_WEB"]);

    if (channelsError || !channels || channels.length === 0) {
      throw new Error("Failed to fetch channel data");
    }

    const channelMap = new Map(channels.map(c => [c.channel_code, c.id]));

    // Process each submission
    for (const submission of submissions) {
      try {
        const processed = await processSubmission(submission, channelMap);
        
        if (processed.success) {
          processedCount++;
        } else if (processed.error) {
          errors.push(`Submission ${submission.id}: ${processed.error}`);
        }
      } catch (error) {
        const errorMsg = `Error processing submission ${submission.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        // Continue processing other submissions
      }
    }

    // Refresh KPI views after all inserts
    try {
      console.log("Refreshing KPI views...");
      await supabase.rpc("refresh_all_kpi_views");
      console.log("KPI views refreshed successfully");
    } catch (refreshError) {
      const errorMsg = `Error refreshing KPI views: ${refreshError}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    const processingTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        total: submissions.length,
        errors: errors.length > 0 ? errors : undefined,
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Fatal error in daily-ingest:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
        processed: processedCount,
        errors,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function processSubmission(
  submission: any,
  channelMap: Map<string, string>
): Promise<ProcessedSubmission> {
  try {
    // Extract metrics from analysis_result
    const analysisResult = submission.analysis_result || {};
    const propertyData = submission.property_data?.property_data || {};

    // Extract key metrics
    const rating = extractRating(analysisResult, propertyData);
    const review_count = extractReviewCount(analysisResult, propertyData);
    const price_per_night = extractPrice(analysisResult, propertyData);
    const location = extractLocation(analysisResult, propertyData);

    // Validate extracted data
    if (!rating || rating <= 0) {
      return {
        id: submission.id,
        success: false,
        error: "Invalid rating extracted",
        metrics: { rating, review_count, price_per_night, location },
      };
    }

    if (!price_per_night || price_per_night <= 0) {
      return {
        id: submission.id,
        success: false,
        error: "Invalid price extracted",
        metrics: { rating, review_count, price_per_night, location },
      };
    }

    // Create or find property in dim_property
    const property_id = await ensureProperty(submission, location);

    if (!property_id) {
      return {
        id: submission.id,
        success: false,
        error: "Failed to create/find property",
        metrics: { rating, review_count, price_per_night, location },
      };
    }

    // Calculate occupancy based on rating
    const occupancy_rate = calculateOccupancy(rating);
    const rooms_available = 1; // Assume 1 room per property
    const rooms_sold = Math.round(occupancy_rate * rooms_available);

    // Calculate revenue
    const room_revenue = rooms_sold * price_per_night;
    const total_revenue = room_revenue * 1.05; // 5% markup for extras
    const direct_revenue = room_revenue * 0.2; // 20% direct bookings

    const today = new Date().toISOString().split("T")[0];

    // Insert into fact_daily (upsert to handle duplicates)
    const { error: dailyError } = await supabase
      .from("fact_daily")
      .upsert(
        {
          property_id,
          date: today,
          rooms_available,
          rooms_sold,
          room_revenue,
          total_revenue,
          direct_revenue,
          bookings: rooms_sold,
          data_quality_score: 0.85,
        },
        { onConflict: "property_id,date" }
      );

    if (dailyError) {
      throw new Error(`Failed to insert fact_daily: ${dailyError.message}`);
    }

    // Distribute revenue across channels
    const channelDistributions: ChannelDistribution[] = [
      { channel_code: "AIRBNB", percentage: 0.5 },
      { channel_code: "BOOKING", percentage: 0.3 },
      { channel_code: "DIRECT_WEB", percentage: 0.2 },
    ];

    for (const dist of channelDistributions) {
      const channel_id = channelMap.get(dist.channel_code);
      if (!channel_id) continue;

      const channel_revenue = room_revenue * dist.percentage;
      const channel_bookings = Math.max(1, Math.round(rooms_sold * dist.percentage));

      const { error: channelError } = await supabase
        .from("fact_channel_daily")
        .upsert(
          {
            property_id,
            date: today,
            channel_id,
            room_revenue: channel_revenue,
            bookings: channel_bookings,
            cancellations: 0,
            acquisition_cost: 0,
          },
          { onConflict: "property_id,date,channel_id" }
        );

      if (channelError) {
        console.error(
          `Error inserting channel data for ${dist.channel_code}:`,
          channelError
        );
      }
    }

    console.log(`Successfully processed submission ${submission.id} for property ${property_id}`);

    return {
      id: submission.id,
      property_id,
      success: true,
      metrics: { rating, review_count, price_per_night, location },
    };
  } catch (error) {
    return {
      id: submission.id,
      success: false,
      error: String(error),
      metrics: { rating: 0, review_count: 0, price_per_night: 0, location: "" },
    };
  }
}

async function ensureProperty(submission: any, location: string): Promise<string | null> {
  try {
    const propertyData = submission.property_data?.property_data || {};
    const propertyName = propertyData.property_name || propertyData.name || "Unknown Property";

    // For now, create a dummy user_id (in production, this would come from auth)
    // We'll use a system user ID - you may need to create this user in auth.users
    const systemUserId = "00000000-0000-0000-0000-000000000000";

    // Try to find existing property by URL
    const { data: existing, error: findError } = await supabase
      .from("dim_property")
      .select("id")
      .eq("name", propertyName)
      .maybeSingle();

    if (existing) {
      return existing.id;
    }

    // Create new property
    const { data: newProperty, error: insertError } = await supabase
      .from("dim_property")
      .insert({
        user_id: systemUserId,
        name: propertyName,
        location,
        property_type: propertyData.property_type || "Accommodation",
        room_count: 1,
        max_guests: 2,
        amenities: propertyData.amenities || [],
        is_active: true,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating property:", insertError);
      return null;
    }

    return newProperty?.id || null;
  } catch (error) {
    console.error("Error in ensureProperty:", error);
    return null;
  }
}

function extractRating(analysisResult: any, propertyData: any): number {
  // Try multiple sources for rating
  const sources = [
    analysisResult.rating,
    analysisResult.overall_rating,
    propertyData.rating,
    propertyData.overall_rating,
  ];

  for (const source of sources) {
    if (source && typeof source === "number" && source > 0) {
      // Normalize to 5-point scale if needed
      return source > 5 ? source / 2 : source;
    }
  }

  // Default to 4.0 if no rating found
  return 4.0;
}

function extractReviewCount(analysisResult: any, propertyData: any): number {
  const sources = [
    analysisResult.review_count,
    analysisResult.total_reviews,
    propertyData.review_count,
    propertyData.reviewCount,
  ];

  for (const source of sources) {
    if (source && typeof source === "number" && source > 0) {
      return source;
    }
  }

  return 0;
}

function extractPrice(analysisResult: any, propertyData: any): number {
  // Try multiple sources and formats for price
  const sources = [
    analysisResult.price_per_night,
    analysisResult.average_price,
    analysisResult.pricing?.price_per_night,
    propertyData.price,
    propertyData.price_per_night,
  ];

  for (const source of sources) {
    if (source) {
      // Handle string prices like "€120" or "120€"
      if (typeof source === "string") {
        const priceMatch = source.match(/(\d+)/);
        if (priceMatch) {
          const price = parseInt(priceMatch[1], 10);
          if (price > 0) return price;
        }
      }
      // Handle numeric prices
      if (typeof source === "number" && source > 0) {
        return source;
      }
    }
  }

  // Default to 100€ if no price found
  return 100;
}

function extractLocation(analysisResult: any, propertyData: any): string {
  const sources = [
    analysisResult.location,
    analysisResult.address,
    propertyData.location,
    propertyData.address,
  ];

  for (const source of sources) {
    if (source && typeof source === "string" && source.length > 0) {
      return source;
    }
  }

  return "Unknown Location";
}

function calculateOccupancy(rating: number): number {
  // Calculate occupancy based on rating
  if (rating >= 4.5) return 0.7; // 70% occupancy for excellent properties
  if (rating >= 4.0) return 0.6; // 60% occupancy for good properties
  return 0.5; // 50% occupancy for average properties
}

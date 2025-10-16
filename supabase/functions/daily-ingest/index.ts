// Edge Function: daily-ingest
// Phase 0: Daily Data Ingestion
// Purpose: Ingest daily performance data from PMS/diagnostic submissions into fact tables

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface BookingData {
  property_id: string;
  date: string;
  rooms_available: number;
  rooms_sold: number;
  room_revenue: number;
  total_revenue: number;
  bookings: number;
  cancellations?: number;
  searches?: number;
  views?: number;
  inquiries?: number;
  direct_revenue?: number;
  room_cost?: number;
  guest_count?: number;
  channel_breakdown?: ChannelData[];
}

interface ChannelData {
  channel_code: string;
  revenue: number;
  bookings: number;
  cancellations?: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('[daily-ingest] Starting daily data ingestion...');

    // 1. Fetch data from diagnostic_submissions (temporary source)
    const bookingsData = await fetchFromDiagnosticSubmissions(supabase);
    
    console.log(`[daily-ingest] Fetched ${bookingsData.length} booking records`);

    if (bookingsData.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No new data to process',
          processed: 0 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 2. Validate data
    const validated = validateBookingsData(bookingsData);
    if (!validated.valid) {
      console.error('[daily-ingest] Validation errors:', validated.errors);
      throw new Error(`Validation failed: ${validated.errors.join(", ")}`);
    }

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // 3. Process each booking record
    for (const booking of bookingsData) {
      try {
        // Upsert fact_daily
        const { error: dailyError } = await supabase
          .from("fact_daily")
          .upsert({
            property_id: booking.property_id,
            date: booking.date,
            rooms_available: booking.rooms_available,
            rooms_sold: booking.rooms_sold,
            room_revenue: booking.room_revenue,
            total_revenue: booking.total_revenue,
            direct_revenue: booking.direct_revenue || 0,
            room_cost: booking.room_cost || 0,
            bookings: booking.bookings,
            cancellations: booking.cancellations || 0,
            searches: booking.searches || 0,
            views: booking.views || 0,
            inquiries: booking.inquiries || 0,
            guest_count: booking.guest_count || 0,
            data_source: 'diagnostic_submission',
            data_quality_score: 0.85, // Initial quality score
          }, {
            onConflict: "property_id,date",
          });

        if (dailyError) {
          console.error(`[daily-ingest] Error upserting fact_daily for ${booking.property_id}:`, dailyError);
          errors.push(`fact_daily: ${dailyError.message}`);
          errorCount++;
          continue;
        }

        // 4. Process channel breakdown if available
        if (booking.channel_breakdown && booking.channel_breakdown.length > 0) {
          for (const channel of booking.channel_breakdown) {
            // Get channel_id from dim_channel
            const { data: channelData } = await supabase
              .from('dim_channel')
              .select('channel_id, commission_rate')
              .eq('channel_code', channel.channel_code)
              .single();

            if (!channelData) {
              console.warn(`[daily-ingest] Channel not found: ${channel.channel_code}`);
              continue;
            }

            const acquisitionCost = channel.revenue * channelData.commission_rate;
            
            const { error: channelError } = await supabase
              .from("fact_channel_daily")
              .upsert({
                property_id: booking.property_id,
                date: booking.date,
                channel_id: channelData.channel_id,
                room_revenue: channel.revenue,
                bookings: channel.bookings,
                cancellations: channel.cancellations || 0,
                acquisition_cost: acquisitionCost,
                commission_paid: acquisitionCost,
              }, {
                onConflict: "property_id,date,channel_id",
              });

            if (channelError) {
              console.error(`[daily-ingest] Error upserting fact_channel_daily:`, channelError);
              errors.push(`fact_channel_daily: ${channelError.message}`);
            }
          }
        }

        processedCount++;
        
      } catch (recordError) {
        console.error(`[daily-ingest] Error processing record:`, recordError);
        errors.push(`record_error: ${recordError.message}`);
        errorCount++;
      }
    }

    // 5. Refresh materialized views
    console.log('[daily-ingest] Refreshing KPI views...');
    const { error: refreshError } = await supabase.rpc('refresh_all_kpi_views');
    
    if (refreshError) {
      console.error('[daily-ingest] Error refreshing views:', refreshError);
      // Don't fail the whole operation, just log
    } else {
      console.log('[daily-ingest] KPI views refreshed successfully');
    }

    const responseData = {
      success: true,
      processed: processedCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log('[daily-ingest] Completed:', responseData);

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('[daily-ingest] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// =====================================================
// Helper Functions
// =====================================================

async function fetchFromDiagnosticSubmissions(supabase: any): Promise<BookingData[]> {
  // TODO: In production, this should fetch from actual PMS/booking system
  // For now, we'll transform data from diagnostic_submissions
  
  // Get recent submissions with analysis results
  const { data: submissions, error } = await supabase
    .from('diagnostic_submissions')
    .select(`
      id,
      property_id,
      property_url,
      scraped_data,
      analysis_result,
      created_at,
      properties:property_id (
        id,
        name,
        location
      )
    `)
    .eq('status', 'completed')
    .not('analysis_result', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[fetchFromDiagnosticSubmissions] Error:', error);
    return [];
  }

  if (!submissions || submissions.length === 0) {
    return [];
  }

  const bookingsData: BookingData[] = [];

  for (const submission of submissions) {
    try {
      // Extract metrics from scraped_data or analysis_result
      const scrapedData = submission.scraped_data || {};
      const analysisResult = submission.analysis_result || {};
      
      // Get property from diagnostic_submissions or create dummy data
      const property_id = submission.property_id || submission.id;
      
      // Extract basic metrics
      const rating = scrapedData.rating || analysisResult.rating || 4.0;
      const reviewCount = scrapedData.review_count || analysisResult.review_count || 0;
      const pricePerNight = scrapedData.price_per_night || analysisResult.price_per_night || 100;
      
      // Estimate daily metrics (this is simplified - in production use actual PMS data)
      const roomsAvailable = 1; // Single property
      const occupancyRate = estimateOccupancy(rating, reviewCount);
      const roomsSold = Math.round(occupancyRate * roomsAvailable);
      
      // Calculate revenue
      const roomRevenue = roomsSold * pricePerNight;
      const totalRevenue = roomRevenue * 1.05; // Include ancillary revenue estimate
      
      const bookingData: BookingData = {
        property_id: property_id,
        date: new Date().toISOString().split('T')[0], // Today
        rooms_available: roomsAvailable,
        rooms_sold: roomsSold,
        room_revenue: roomRevenue,
        total_revenue: totalRevenue,
        bookings: roomsSold, // Simplified: 1 booking = 1 room sold
        direct_revenue: roomRevenue * 0.2, // Estimate 20% direct bookings
        guest_count: roomsSold * 2, // Estimate 2 guests per booking
        channel_breakdown: [
          {
            channel_code: 'airbnb',
            revenue: roomRevenue * 0.5,
            bookings: Math.round(roomsSold * 0.5),
          },
          {
            channel_code: 'booking',
            revenue: roomRevenue * 0.3,
            bookings: Math.round(roomsSold * 0.3),
          },
          {
            channel_code: 'direct-web',
            revenue: roomRevenue * 0.2,
            bookings: Math.round(roomsSold * 0.2),
          },
        ],
      };
      
      bookingsData.push(bookingData);
      
    } catch (parseError) {
      console.error('[fetchFromDiagnosticSubmissions] Error parsing submission:', parseError);
      continue;
    }
  }

  return bookingsData;
}

function estimateOccupancy(rating: number, reviewCount: number): number {
  // Simple estimation based on rating and reviews
  // In production, use actual occupancy data
  let baseOccupancy = 0.50; // 50% base
  
  // Rating impact
  if (rating >= 4.5) baseOccupancy += 0.20;
  else if (rating >= 4.0) baseOccupancy += 0.10;
  else if (rating < 3.5) baseOccupancy -= 0.10;
  
  // Review count impact (social proof)
  if (reviewCount > 50) baseOccupancy += 0.10;
  else if (reviewCount > 20) baseOccupancy += 0.05;
  
  return Math.min(Math.max(baseOccupancy, 0.1), 1.0);
}

function validateBookingsData(data: BookingData[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const booking of data) {
    if (!booking.property_id) {
      errors.push('Missing property_id');
    }
    
    if (!booking.date) {
      errors.push('Missing date');
    }
    
    if (booking.rooms_sold > booking.rooms_available) {
      errors.push(`${booking.property_id}: rooms_sold (${booking.rooms_sold}) > rooms_available (${booking.rooms_available})`);
    }
    
    if (booking.room_revenue < 0) {
      errors.push(`${booking.property_id}: negative room_revenue`);
    }
    
    if (booking.total_revenue < booking.room_revenue) {
      errors.push(`${booking.property_id}: total_revenue < room_revenue`);
    }
  }
  
  return { 
    valid: errors.length === 0, 
    errors 
  };
}

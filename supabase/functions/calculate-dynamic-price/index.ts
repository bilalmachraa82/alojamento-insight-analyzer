import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PricingRequest {
  property_id: string;
  base_price: number;
  target_date: string;
  market_id?: string;
}

interface PricingFactors {
  day_of_week_factor: number;
  seasonality_factor: number;
  event_factor: number;
  competitor_factor: number;
  occupancy_factor: number;
  lead_time_factor: number;
}

interface EventInfo {
  name: string;
  event_type: string;
  impact_score: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { property_id, base_price, target_date, market_id } = await req.json() as PricingRequest;

    if (!property_id || !base_price || !target_date) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: property_id, base_price, target_date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const date = new Date(target_date);
    const dayOfWeek = date.getDay();
    const month = date.getMonth() + 1;
    const today = new Date();
    const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`Calculating dynamic price for property ${property_id} on ${target_date}`);

    // 1. Day of Week Factor (weekend premium)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    let dayOfWeekFactor = 1.0;
    if (dayOfWeek === 5) dayOfWeekFactor = 1.15; // Friday
    else if (dayOfWeek === 6) dayOfWeekFactor = 1.25; // Saturday
    else if (dayOfWeek === 0) dayOfWeekFactor = 1.10; // Sunday

    // 2. Seasonality Factor
    let seasonalityFactor = 1.0;
    const marketToUse = market_id || 'sintra'; // default
    
    const { data: seasonality } = await supabase
      .from("dim_seasonality")
      .select("*")
      .eq("market_id", marketToUse.toLowerCase())
      .eq("month", month)
      .maybeSingle();

    if (seasonality) {
      seasonalityFactor = Number(seasonality.factor);
      // Add weekend premium from seasonality if applicable
      if (isWeekend) {
        dayOfWeekFactor = Math.max(dayOfWeekFactor, 1 + Number(seasonality.weekend_premium));
      }
    }

    // 3. Event Factor - check for events on this date
    let eventFactor = 1.0;
    const relevantEvents: EventInfo[] = [];

    const { data: events } = await supabase
      .from("dim_event")
      .select("*")
      .lte("start_date", target_date)
      .gte("end_date", target_date);

    if (events && events.length > 0) {
      // Filter events for this market or 'all'
      const marketEvents = events.filter(e => 
        e.market_id === 'all' || 
        e.market_id?.toLowerCase() === marketToUse.toLowerCase()
      );

      if (marketEvents.length > 0) {
        // Use the highest impact event
        const maxImpact = Math.max(...marketEvents.map(e => Number(e.impact_score)));
        // Convert impact score (1-10) to factor (1.05 - 1.50)
        eventFactor = 1 + (maxImpact / 10) * 0.45;
        
        relevantEvents.push(...marketEvents.map(e => ({
          name: e.name,
          event_type: e.event_type,
          impact_score: Number(e.impact_score)
        })));
      }
    }

    // 4. Competitor Factor (based on ARI from comp set)
    let competitorFactor = 1.0;
    
    const { data: compSetData } = await supabase
      .from("kpi_comp_set_daily")
      .select("ari")
      .eq("property_id", property_id)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (compSetData?.ari) {
      const ari = Number(compSetData.ari);
      // If ARI > 1, we're priced higher than market, slight decrease
      // If ARI < 1, we're priced lower, can increase
      if (ari > 1.2) {
        competitorFactor = 0.95; // Reduce if significantly above market
      } else if (ari < 0.8) {
        competitorFactor = 1.10; // Increase if significantly below market
      } else {
        competitorFactor = 1.0;
      }
    }

    // 5. Occupancy Factor (based on recent occupancy rate)
    let occupancyFactor = 1.0;
    
    const { data: kpiData } = await supabase
      .from("kpi_daily")
      .select("occupancy_rate")
      .eq("property_id", property_id)
      .order("date", { ascending: false })
      .limit(7);

    if (kpiData && kpiData.length > 0) {
      const avgOccupancy = kpiData.reduce((sum, k) => sum + (Number(k.occupancy_rate) || 0), 0) / kpiData.length;
      if (avgOccupancy > 0.85) {
        occupancyFactor = 1.15; // High demand, increase price
      } else if (avgOccupancy > 0.70) {
        occupancyFactor = 1.05;
      } else if (avgOccupancy < 0.40) {
        occupancyFactor = 0.90; // Low demand, decrease price
      }
    }

    // 6. Lead Time Factor (last-minute vs advance booking)
    let leadTimeFactor = 1.0;
    if (daysUntil <= 3) {
      leadTimeFactor = 0.85; // Last minute discount
    } else if (daysUntil <= 7) {
      leadTimeFactor = 0.92;
    } else if (daysUntil > 90) {
      leadTimeFactor = 0.95; // Early bird slight discount
    }

    // Calculate final price
    const factors: PricingFactors = {
      day_of_week_factor: dayOfWeekFactor,
      seasonality_factor: seasonalityFactor,
      event_factor: eventFactor,
      competitor_factor: competitorFactor,
      occupancy_factor: occupancyFactor,
      lead_time_factor: leadTimeFactor,
    };

    const suggestedPrice = base_price * 
      dayOfWeekFactor * 
      seasonalityFactor * 
      eventFactor * 
      competitorFactor * 
      occupancyFactor * 
      leadTimeFactor;

    // Round to nearest euro
    const finalPrice = Math.round(suggestedPrice);

    // Save recommendation to database
    await supabase
      .from("fact_pricing_recommendations")
      .upsert({
        property_id,
        date: target_date,
        base_price,
        suggested_price: finalPrice,
        ...factors,
        relevant_events: relevantEvents,
      }, {
        onConflict: "property_id,date"
      });

    console.log(`Price calculated: ${base_price} -> ${finalPrice} (factors: ${JSON.stringify(factors)})`);

    return new Response(
      JSON.stringify({
        success: true,
        base_price,
        suggested_price: finalPrice,
        price_change_percent: ((finalPrice - base_price) / base_price * 100).toFixed(1),
        factors,
        relevant_events: relevantEvents,
        market_id: marketToUse,
        target_date,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error calculating dynamic price:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
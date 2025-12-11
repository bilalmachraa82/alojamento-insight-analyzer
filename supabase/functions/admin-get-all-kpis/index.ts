import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin ${user.email} requesting all KPIs`);

    // Get all properties
    const { data: properties, error: propError } = await supabase
      .from("dim_property")
      .select("id, name, location, property_type, is_active, is_system")
      .eq("is_active", true);

    if (propError) throw propError;

    // Get latest KPIs for all properties from analytics schema
    const { data: dailyKpis, error: kpiError } = await supabase
      .rpc('refresh_all_kpi_views')
      .then(() => supabase
        .from("kpi_daily")
        .select("*")
        .order("date", { ascending: false })
      );

    // Get comp set KPIs
    const { data: compSetKpis } = await supabase
      .from("kpi_comp_set_daily")
      .select("*")
      .order("date", { ascending: false });

    // Aggregate KPIs by property
    const propertyKpis = properties?.map(property => {
      // Get latest daily KPI for this property
      const latestKpi = dailyKpis?.find(k => k.property_id === property.id);
      const latestCompSet = compSetKpis?.find(k => k.property_id === property.id);

      // Calculate 7-day averages
      const last7Days = dailyKpis?.filter(k => k.property_id === property.id).slice(0, 7) || [];
      const avgAdr = last7Days.length > 0 
        ? last7Days.reduce((sum, k) => sum + (Number(k.adr) || 0), 0) / last7Days.length 
        : null;
      const avgOccupancy = last7Days.length > 0 
        ? last7Days.reduce((sum, k) => sum + (Number(k.occupancy_rate) || 0), 0) / last7Days.length 
        : null;
      const avgRevpar = last7Days.length > 0 
        ? last7Days.reduce((sum, k) => sum + (Number(k.revpar) || 0), 0) / last7Days.length 
        : null;

      // Determine market position based on RGI
      let marketPosition: 'leader' | 'competitive' | 'lagging' | 'distressed' = 'competitive';
      const rgi = latestCompSet?.rgi ? Number(latestCompSet.rgi) : null;
      if (rgi) {
        if (rgi >= 1.15) marketPosition = 'leader';
        else if (rgi >= 0.95) marketPosition = 'competitive';
        else if (rgi >= 0.75) marketPosition = 'lagging';
        else marketPosition = 'distressed';
      }

      return {
        property_id: property.id,
        property_name: property.name,
        location: property.location,
        property_type: property.property_type,
        is_system: property.is_system,
        // Latest KPIs
        latest_date: latestKpi?.date || null,
        adr: latestKpi?.adr ? Number(latestKpi.adr) : null,
        occupancy_rate: latestKpi?.occupancy_rate ? Number(latestKpi.occupancy_rate) : null,
        revpar: latestKpi?.revpar ? Number(latestKpi.revpar) : null,
        // Comp Set KPIs
        ari: latestCompSet?.ari ? Number(latestCompSet.ari) : null,
        mpi: latestCompSet?.mpi ? Number(latestCompSet.mpi) : null,
        rgi: rgi,
        market_position: marketPosition,
        // 7-day averages
        avg_adr_7d: avgAdr,
        avg_occupancy_7d: avgOccupancy,
        avg_revpar_7d: avgRevpar,
      };
    }) || [];

    // Calculate summary stats
    const activeProperties = propertyKpis.filter(p => !p.is_system);
    const summary = {
      total_properties: activeProperties.length,
      avg_adr: activeProperties.reduce((sum, p) => sum + (p.adr || 0), 0) / (activeProperties.length || 1),
      avg_occupancy: activeProperties.reduce((sum, p) => sum + (p.occupancy_rate || 0), 0) / (activeProperties.length || 1),
      avg_revpar: activeProperties.reduce((sum, p) => sum + (p.revpar || 0), 0) / (activeProperties.length || 1),
      avg_rgi: activeProperties.reduce((sum, p) => sum + (p.rgi || 1), 0) / (activeProperties.length || 1),
      leaders: activeProperties.filter(p => p.market_position === 'leader').length,
      competitive: activeProperties.filter(p => p.market_position === 'competitive').length,
      lagging: activeProperties.filter(p => p.market_position === 'lagging').length,
      distressed: activeProperties.filter(p => p.market_position === 'distressed').length,
    };

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        properties: propertyKpis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching all KPIs:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Alert {
  id: string;
  type: 'rgi_low' | 'event_upcoming' | 'occupancy_low' | 'competitor_change';
  severity: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  property_id?: string;
  property_name?: string;
  event_id?: string;
  event_name?: string;
  value?: number;
  threshold?: number;
  date?: string;
  created_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const alerts: Alert[] = [];
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Check for low RGI properties (< 0.9)
    console.log("Checking for low RGI properties...");
    const { data: properties } = await supabase
      .from("dim_property")
      .select("id, name")
      .eq("is_active", true);

    if (properties) {
      const { data: kpiData } = await supabase
        .from("kpi_comp_set_daily")
        .select("property_id, rgi, date")
        .order("date", { ascending: false });

      // Get latest RGI per property
      const latestRgiByProperty = new Map<string, { rgi: number; date: string }>();
      kpiData?.forEach((row) => {
        if (row.property_id && row.rgi !== null && !latestRgiByProperty.has(row.property_id)) {
          latestRgiByProperty.set(row.property_id, { rgi: row.rgi, date: row.date });
        }
      });

      for (const property of properties) {
        const rgiData = latestRgiByProperty.get(property.id);
        if (rgiData && rgiData.rgi < 0.9) {
          const severity = rgiData.rgi < 0.7 ? 'critical' : 'warning';
          alerts.push({
            id: `rgi_${property.id}`,
            type: 'rgi_low',
            severity,
            title: `RGI Baixo: ${property.name}`,
            message: `Propriedade com RGI de ${(rgiData.rgi * 100).toFixed(1)}% está abaixo do mercado. Considere ajustar preços ou melhorar oferta.`,
            property_id: property.id,
            property_name: property.name,
            value: rgiData.rgi,
            threshold: 0.9,
            date: rgiData.date,
            created_at: now.toISOString(),
          });
        }
      }
    }

    // 2. Check for upcoming events (next 7 days)
    console.log("Checking for upcoming events...");
    const { data: upcomingEvents } = await supabase
      .from("dim_event")
      .select("*")
      .gte("start_date", now.toISOString().split("T")[0])
      .lte("start_date", sevenDaysFromNow.toISOString().split("T")[0])
      .order("start_date", { ascending: true });

    if (upcomingEvents) {
      for (const event of upcomingEvents) {
        const daysUntil = Math.ceil(
          (new Date(event.start_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const severity = event.impact_score >= 8 ? 'critical' : 
                        event.impact_score >= 5 ? 'warning' : 'info';
        
        alerts.push({
          id: `event_${event.id}`,
          type: 'event_upcoming',
          severity,
          title: `Evento em ${daysUntil} dia${daysUntil !== 1 ? 's' : ''}: ${event.name}`,
          message: `${event.event_type} em ${event.location || event.market_id} (${event.start_date} - ${event.end_date}). Impacto: ${event.impact_score}/10. Verifique preços dinâmicos.`,
          event_id: event.id,
          event_name: event.name,
          value: event.impact_score,
          date: event.start_date,
          created_at: now.toISOString(),
        });
      }
    }

    // 3. Check for low occupancy (< 50% in next 7 days)
    console.log("Checking for low occupancy...");
    const { data: dailyKpis } = await supabase
      .from("kpi_daily")
      .select("property_id, occupancy_rate, date")
      .gte("date", now.toISOString().split("T")[0])
      .lte("date", sevenDaysFromNow.toISOString().split("T")[0]);

    if (dailyKpis && properties) {
      const propertyMap = new Map(properties.map(p => [p.id, p.name]));
      const occupancyByProperty = new Map<string, number[]>();
      
      dailyKpis.forEach((row) => {
        if (row.property_id && row.occupancy_rate !== null) {
          const existing = occupancyByProperty.get(row.property_id) || [];
          existing.push(row.occupancy_rate);
          occupancyByProperty.set(row.property_id, existing);
        }
      });

      occupancyByProperty.forEach((rates, propertyId) => {
        const avgOccupancy = rates.reduce((a, b) => a + b, 0) / rates.length;
        if (avgOccupancy < 0.5) {
          const propertyName = propertyMap.get(propertyId) || 'Desconhecida';
          alerts.push({
            id: `occ_${propertyId}`,
            type: 'occupancy_low',
            severity: avgOccupancy < 0.3 ? 'critical' : 'warning',
            title: `Ocupação Baixa: ${propertyName}`,
            message: `Média de ${(avgOccupancy * 100).toFixed(1)}% nos próximos 7 dias. Considere promoções ou ajuste de preços.`,
            property_id: propertyId,
            property_name: propertyName,
            value: avgOccupancy,
            threshold: 0.5,
            created_at: now.toISOString(),
          });
        }
      });
    }

    // Sort by severity (critical first) then by date
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(a.date || a.created_at).getTime() - new Date(b.date || b.created_at).getTime();
    });

    console.log(`Generated ${alerts.length} alerts`);

    return new Response(
      JSON.stringify({
        success: true,
        alerts,
        summary: {
          total: alerts.length,
          critical: alerts.filter(a => a.severity === 'critical').length,
          warning: alerts.filter(a => a.severity === 'warning').length,
          info: alerts.filter(a => a.severity === 'info').length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating alerts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

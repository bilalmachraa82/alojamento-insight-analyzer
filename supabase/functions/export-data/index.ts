import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExportRequest {
  export_type: 'submissions' | 'reviews' | 'kpis' | 'pricing' | 'goals' | 'all';
  format: 'json' | 'csv';
  date_range?: {
    start: string;
    end: string;
  };
  property_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });

    const { export_type, format, date_range, property_id } = await req.json() as ExportRequest;

    console.log(`Export request: type=${export_type}, format=${format}, user=${user.id}, isAdmin=${isAdmin}`);

    const exportData: Record<string, any[]> = {};

    // Helper function to apply date range filter
    const applyDateFilter = (query: any, dateColumn: string) => {
      if (date_range) {
        return query.gte(dateColumn, date_range.start).lte(dateColumn, date_range.end);
      }
      return query;
    };

    // Get user's property IDs (or all if admin)
    let propertyIds: string[] = [];
    
    if (property_id) {
      propertyIds = [property_id];
    } else if (isAdmin) {
      const { data: allProps } = await supabase.from('dim_property').select('id');
      propertyIds = allProps?.map(p => p.id) || [];
    } else {
      const { data: userProps } = await supabase
        .from('dim_property')
        .select('id')
        .eq('user_id', user.id);
      propertyIds = userProps?.map(p => p.id) || [];
    }

    if (propertyIds.length === 0 && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "No properties found for export" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Export submissions (admin only)
    if ((export_type === 'submissions' || export_type === 'all') && isAdmin) {
      let query = supabase
        .from('diagnostic_submissions')
        .select('id, name, email, platform, property_url, status, submission_date, created_at');
      
      query = applyDateFilter(query, 'submission_date');
      const { data } = await query.order('submission_date', { ascending: false });
      exportData.submissions = data || [];
    }

    // Export reviews
    if (export_type === 'reviews' || export_type === 'all') {
      let query = supabase
        .from('fact_reviews')
        .select('*')
        .in('property_id', propertyIds);
      
      query = applyDateFilter(query, 'date');
      const { data } = await query.order('date', { ascending: false });
      exportData.reviews = data || [];
    }

    // Export KPIs
    if (export_type === 'kpis' || export_type === 'all') {
      let query = supabase
        .from('kpi_daily')
        .select('*')
        .in('property_id', propertyIds);
      
      query = applyDateFilter(query, 'date');
      const { data } = await query.order('date', { ascending: false });
      exportData.kpis = data || [];
    }

    // Export pricing recommendations
    if (export_type === 'pricing' || export_type === 'all') {
      let query = supabase
        .from('fact_pricing_recommendations')
        .select('*')
        .in('property_id', propertyIds);
      
      query = applyDateFilter(query, 'date');
      const { data } = await query.order('date', { ascending: false });
      exportData.pricing = data || [];
    }

    // Export goals
    if (export_type === 'goals' || export_type === 'all') {
      const { data } = await supabase
        .from('fact_goals')
        .select('*')
        .in('property_id', propertyIds);
      
      exportData.goals = data || [];
    }

    // Calculate summary
    const summary = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      is_admin: isAdmin,
      export_type,
      format,
      date_range,
      record_counts: Object.fromEntries(
        Object.entries(exportData).map(([key, value]) => [key, value.length])
      ),
    };

    // Format output
    if (format === 'csv') {
      // Convert to CSV format
      const csvParts: string[] = [];
      
      for (const [tableName, records] of Object.entries(exportData)) {
        if (records.length === 0) continue;
        
        csvParts.push(`\n# ${tableName.toUpperCase()}\n`);
        
        const headers = Object.keys(records[0]);
        csvParts.push(headers.join(','));
        
        for (const record of records) {
          const values = headers.map(h => {
            const val = record[h];
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return JSON.stringify(val).replace(/,/g, ';');
            return String(val).replace(/,/g, ';').replace(/\n/g, ' ');
          });
          csvParts.push(values.join(','));
        }
      }

      const csvContent = csvParts.join('\n');
      
      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="maria-faz-export-${export_type}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // JSON format
    return new Response(
      JSON.stringify({
        success: true,
        summary,
        data: exportData,
      }, null, 2),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="maria-faz-export-${export_type}-${new Date().toISOString().split('T')[0]}.json"`,
        },
      }
    );

  } catch (error) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

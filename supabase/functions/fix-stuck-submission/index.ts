import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

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
    const submissionId = "f8ee7428-25d1-4bf9-a558-6a3ce1a7ecc6";
    
    console.log(`Fixing stuck submission: ${submissionId}`);
    
    // Update the actor_id to the correct value
    await supabase
      .from("diagnostic_submissions")
      .update({ 
        actor_id: "apify~website-content-crawler"
      })
      .eq("id", submissionId);
    
    // Trigger the analysis
    console.log("Triggering Claude analysis...");
    const { data, error } = await supabase.functions.invoke("analyze-property-claude", {
      body: { id: submissionId }
    });
    
    if (error) {
      console.error("Error triggering analysis:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Submission fixed and analysis triggered",
        data 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

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
    // Testar a chave Claude primeiro
    const submissionId = "2f78ed4c-de41-463f-bd27-626255b92f96";
    
    console.log("Testing Claude API key and reprocessing submission:", submissionId);
    
    // Resetar o status para scraping_completed para que o check-scrape-status possa reprocessar
    const { error: updateError } = await supabase
      .from("diagnostic_submissions")
      .update({ 
        status: "scraping_completed",
        analysis_result: null
      })
      .eq("id", submissionId);
    
    if (updateError) {
      console.error("Error updating submission:", updateError);
      throw updateError;
    }
    
    console.log("Submission reset to scraping_completed. Now triggering analysis...");
    
    // Invocar diretamente o analyze-property-claude
    const { data, error } = await supabase.functions.invoke("analyze-property-claude", {
      body: { id: submissionId }
    });
    
    if (error) {
      console.error("Error from analyze-property-claude:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          details: error
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    console.log("Analysis triggered successfully:", data);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Claude analysis completed successfully!",
        submissionId,
        data 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Test error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: String(error),
        message: "Failed to test Claude analysis"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

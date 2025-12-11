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
    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, limit = 10 } = await req.json();

    if (action === "get_stuck") {
      // Get stuck submissions
      const { data: stuckSubmissions, error } = await supabase
        .from("diagnostic_submissions")
        .select("id, email, property_url, platform, status, error_message, created_at")
        .eq("status", "pending_manual_review")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          count: stuckSubmissions?.length || 0,
          submissions: stuckSubmissions 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reprocess_all") {
      // Get all stuck submissions (Apify-related failures)
      const { data: stuckSubmissions, error: fetchError } = await supabase
        .from("diagnostic_submissions")
        .select("id, property_url, platform")
        .eq("status", "pending_manual_review")
        .limit(limit);

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: fetchError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      console.log(`Starting batch reprocess of ${stuckSubmissions?.length || 0} submissions`);

      for (const submission of stuckSubmissions || []) {
        try {
          // Reset status to pending first
          await supabase
            .from("diagnostic_submissions")
            .update({ 
              status: "pending", 
              error_message: null,
              retry_count: 0,
              updated_at: new Date().toISOString()
            })
            .eq("id", submission.id);

          // Trigger reprocessing
          const { error: invokeError } = await supabase.functions.invoke("process-diagnostic", {
            body: { id: submission.id }
          });

          if (invokeError) {
            console.error(`Failed to reprocess ${submission.id}:`, invokeError);
            errorCount++;
            results.push({ id: submission.id, success: false, error: invokeError.message });
          } else {
            successCount++;
            results.push({ id: submission.id, success: true });
          }

          // Small delay between submissions to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
          console.error(`Error processing ${submission.id}:`, err);
          errorCount++;
          results.push({ id: submission.id, success: false, error: String(err) });
        }
      }

      // Log the action
      await supabase.from("admin_audit_logs").insert({
        admin_id: user.id,
        action: "batch_reprocess",
        resource_type: "diagnostic_submissions",
        new_values: { 
          total: stuckSubmissions?.length || 0,
          success: successCount,
          errors: errorCount
        }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Batch reprocess completed`,
          total: stuckSubmissions?.length || 0,
          successCount,
          errorCount,
          results 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reprocess_single") {
      const { submissionId } = await req.json();
      
      if (!submissionId) {
        return new Response(
          JSON.stringify({ error: "submissionId required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Reset and reprocess
      await supabase
        .from("diagnostic_submissions")
        .update({ 
          status: "pending", 
          error_message: null,
          retry_count: 0 
        })
        .eq("id", submissionId);

      const { error: invokeError } = await supabase.functions.invoke("process-diagnostic", {
        body: { id: submissionId }
      });

      if (invokeError) {
        return new Response(
          JSON.stringify({ success: false, error: invokeError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Reprocessing started" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: get_stuck, reprocess_all, reprocess_single" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

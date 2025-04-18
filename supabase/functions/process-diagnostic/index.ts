
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Configure Supabase client
const supabaseUrl = "https://rhrluvhbajdsnmvnpjzk.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure Apify
const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { id } = await req.json();
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing submission ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing diagnostic submission: ${id}`);

    // Fetch the submission from Supabase
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

    // Update status to "processing"
    await supabase
      .from("diagnostic_submissions")
      .update({ status: "processing" })
      .eq("id", id);

    // Determine platform and select appropriate actor
    let actorId;
    switch (submission.plataforma.toLowerCase()) {
      case "airbnb":
        actorId = "apify/airbnb-scraper";
        break;
      case "booking":
        actorId = "apify/booking-scraper";
        break;
      case "vrbo":
        actorId = "apify/vrbo-scraper";
        break;
      default:
        // Default to a generic web scraper
        actorId = "apify/web-scraper";
    }

    console.log(`Using actor ${actorId} for platform ${submission.plataforma}`);

    // Call Apify API to start the scraper
    const apifyUrl = `https://api.apify.com/v2/actor-tasks?token=${APIFY_API_TOKEN}`;
    
    // Create a new task for the actor
    const taskResponse = await fetch(apifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        actId: actorId,
        name: `Diagnostic-${id}`,
      }),
    });
    
    if (!taskResponse.ok) {
      const errorText = await taskResponse.text();
      throw new Error(`Failed to create task: ${errorText}`);
    }
    
    const taskData = await taskResponse.json();
    const taskId = taskData.data.id;
    
    // Run the task with the URL
    const runResponse = await fetch(`https://api.apify.com/v2/actor-tasks/${taskId}/runs?token=${APIFY_API_TOKEN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: submission.link,
      }),
    });
    
    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      throw new Error(`Failed to run task: ${errorText}`);
    }
    
    const runData = await runResponse.json();
    const runId = runData.data.id;
    
    // Store the Apify task and run IDs in the database
    await supabase
      .from("diagnostic_submissions")
      .update({
        status: "scraping",
        scraped_data: {
          apify_task_id: taskId,
          apify_run_id: runId,
          started_at: new Date().toISOString(),
        }
      })
      .eq("id", id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Diagnostic processing started successfully",
        taskId,
        runId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error processing diagnostic:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

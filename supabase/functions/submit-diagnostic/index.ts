import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, property_url, platform } = await req.json();

    // Input validation
    if (!name || !email || !property_url || !platform) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid email format" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate platform
    const validPlatforms = ['airbnb', 'booking', 'vrbo'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid platform" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert submission using service role
    const { data: submissionData, error } = await supabase
      .from("diagnostic_submissions")
      .insert({
        name,
        email,
        property_url: property_url.trim(),
        platform: platform.toLowerCase(),
        submission_date: new Date().toISOString(),
        status: "pending"
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to create submission" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Submission created successfully: ${submissionData.id}`);

    // Trigger processing
    try {
      const { error: processError } = await supabase.functions.invoke("process-diagnostic", {
        body: { id: submissionData.id }
      });

      if (processError) {
        console.error("Error triggering processing:", processError);
        // Don't fail the submission, just log the error
      }
    } catch (err) {
      console.error("Exception triggering processing:", err);
      // Don't fail the submission, processing will be retried
    }

    return new Response(
      JSON.stringify({
        success: true,
        submissionId: submissionData.id,
        message: "Submission created successfully"
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Error in submit-diagnostic:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: String(error) 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

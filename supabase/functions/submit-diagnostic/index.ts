import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import {
  checkSubmissionRateLimit,
  getClientIp,
  validatePropertyUrl,
} from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (status: number, body: Record<string, unknown>, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extraHeaders },
  });

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, property_url, platform, user_id } = await req.json();

    // Input validation
    if (!name || !email || !property_url || !platform) {
      return jsonResponse(400, { success: false, error: "Missing required fields" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return jsonResponse(400, { success: false, error: "Invalid email format" });
    }

    // Validate platform
    const validPlatforms = ['airbnb', 'booking', 'vrbo'];
    const platformLower = platform.toLowerCase();
    if (!validPlatforms.includes(platformLower)) {
      return jsonResponse(400, { success: false, error: "Invalid platform" });
    }

    // Validate URL format and domain
    const trimmedUrl = property_url.trim();
    const urlValidation = validatePropertyUrl(trimmedUrl, platformLower);
    if (!urlValidation.valid) {
      return jsonResponse(400, { success: false, error: urlValidation.error });
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting check
    const clientIp = getClientIp(req);
    const rateLimitResult = await checkSubmissionRateLimit(supabase, email, clientIp);
    if (!rateLimitResult.allowed) {
      return jsonResponse(
        429,
        { success: false, error: rateLimitResult.reason },
        rateLimitResult.retryAfterSeconds
          ? { 'Retry-After': String(rateLimitResult.retryAfterSeconds) }
          : {}
      );
    }

    // Insert submission using service role
    const { data: submissionData, error } = await supabase
      .from("diagnostic_submissions")
      .insert({
        name,
        email: email.toLowerCase(),
        property_url: trimmedUrl,
        platform: platformLower,
        submission_date: new Date().toISOString(),
        status: "pending",
        user_id: user_id || null,
        client_ip: clientIp !== "unknown" ? clientIp : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return jsonResponse(500, { success: false, error: "Failed to create submission" });
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

    return jsonResponse(200, {
      success: true,
      submissionId: submissionData.id,
      message: "Submission created successfully",
    });
  } catch (error) {
    console.error("Error in submit-diagnostic:", error);
    return jsonResponse(500, { success: false, error: String(error) });
  }
});

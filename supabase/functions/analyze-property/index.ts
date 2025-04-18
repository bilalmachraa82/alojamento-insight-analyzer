
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Configure Supabase client
const supabaseUrl = "https://rhrluvhbajdsnmvnpjzk.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure Gemini API
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

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

    console.log(`Analyzing property data for submission: ${id}`);

    // Fetch the submission with scraped data from Supabase
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

    if (!submission.scraped_data?.property_data) {
      return new Response(
        JSON.stringify({ error: "No property data found in submission" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to "analyzing"
    await supabase
      .from("diagnostic_submissions")
      .update({ status: "analyzing" })
      .eq("id", id);

    // Prepare property data for analysis
    const propertyData = submission.scraped_data.property_data;
    
    // Extract relevant information from property data
    const propertyInfo = {
      name: propertyData.name || "Unknown property",
      url: submission.link,
      platform: submission.plataforma,
      location: propertyData.location || "Unknown location",
      rating: propertyData.rating || "No rating",
      reviewCount: propertyData.reviewCount || 0,
      amenities: propertyData.amenities || [],
      price: propertyData.price || "Unknown price",
      description: propertyData.description || "No description",
      host: propertyData.host || {},
      similarListings: propertyData.similarListings || []
    };

    // Create prompt for Gemini API
    const prompt = `
      Analyze this short-term rental property and provide a detailed optimization report:
      
      PROPERTY INFORMATION:
      Name: ${propertyInfo.name}
      Platform: ${propertyInfo.platform}
      Location: ${propertyInfo.location}
      Rating: ${propertyInfo.rating}
      Review Count: ${propertyInfo.reviewCount}
      Price: ${propertyInfo.price}
      
      AMENITIES:
      ${JSON.stringify(propertyInfo.amenities)}
      
      DESCRIPTION:
      ${propertyInfo.description}
      
      HOST INFORMATION:
      ${JSON.stringify(propertyInfo.host)}
      
      SIMILAR LISTINGS:
      ${JSON.stringify(propertyInfo.similarListings.slice(0, 5))}
      
      Based on this data, please provide:
      
      1. VISIBILITY SCORE (1-10): How well is this property marketed? What could be improved in the listing?
      2. PRICING ANALYSIS: Is the price competitive? Suggest optimal pricing strategy.
      3. GUEST EXPERIENCE: What amenities are missing compared to competitors? How could the guest experience be improved?
      4. OPTIMIZATION RECOMMENDATIONS: Provide 5 specific, actionable recommendations to improve the property's performance.
      5. COMPETITIVE ANALYSIS: How does this property compare to similar listings?
      6. EXPECTED ROI: If the owner implements your recommendations, what ROI could they expect?
      
      Format the response as a well-structured report with clear sections, bullet points, and emphasis on key insights.
    `;

    // Call Gemini API
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Failed to analyze with Gemini: ${errorText}`);
    }
    
    const geminiData = await geminiResponse.json();
    const analysisResult = geminiData.candidates[0].content.parts[0].text;
    
    // Store analysis result in Supabase
    await supabase
      .from("diagnostic_submissions")
      .update({
        status: "completed",
        analysis_result: {
          full_report: analysisResult,
          generated_at: new Date().toISOString()
        }
      })
      .eq("id", id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Property analysis completed successfully",
        analysisResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error analyzing property:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

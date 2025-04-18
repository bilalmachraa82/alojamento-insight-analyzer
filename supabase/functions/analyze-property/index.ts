
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = "https://rhrluvhbajdsnmvnpjzk.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id } = await req.json();
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing submission ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing property data for submission: ${id}`);

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

    // Check if we already have scraped data
    if (!submission.scraped_data?.property_data) {
      console.error("No property data found for submission:", id);
      
      // Update status to indicate an issue
      await supabase
        .from("diagnostic_submissions")
        .update({ 
          status: "pending_manual_review",
          scraped_data: {
            ...submission.scraped_data,
            error_reason: "missing_property_data",
            error_at: new Date().toISOString()
          }
        })
        .eq("id", id);
      
      return new Response(
        JSON.stringify({ 
          error: "No property data found in submission",
          message: "The submission has been marked for manual review"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("diagnostic_submissions")
      .update({ status: "analyzing" })
      .eq("id", id);

    const propertyData = submission.scraped_data.property_data;
    
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

    console.log("Starting Gemini analysis with property info:", JSON.stringify(propertyInfo));

    // Prompt aprimorado com estrutura específica para análise detalhada
    const prompt = `
      Você é um consultor especialista de elite em alojamento local com experiência em otimização de propriedades no Booking.com, Airbnb e outras plataformas. 
      Analise detalhadamente esta propriedade e forneça um relatório estratégico completo com insights de nível profissional.
      
      DADOS DA PROPRIEDADE:
      Nome: ${propertyInfo.name}
      Plataforma: ${propertyInfo.platform}
      Localização: ${propertyInfo.location}
      Avaliação: ${propertyInfo.rating}
      Número de Avaliações: ${propertyInfo.reviewCount}
      Preço: ${propertyInfo.price}
      
      COMODIDADES:
      ${JSON.stringify(propertyInfo.amenities)}
      
      DESCRIÇÃO:
      ${propertyInfo.description}
      
      INFORMAÇÕES DO ANFITRIÃO:
      ${JSON.stringify(propertyInfo.host)}
      
      LISTAGENS SIMILARES:
      ${JSON.stringify(propertyInfo.similarListings.slice(0, 5))}
      
      Forneça uma análise detalhada estruturada no seguinte formato JSON, com dados qualitativos e quantitativos específicos:
      
      {
        "diagnostico_inicial": {
          "pontuacao_visibilidade": number (1-10),
          "analise_precos": string,
          "analise_ocupacao": string,
          "taxa_ocupacao_estimada": number (1-100),
          "pontuacao_rating": number (1-10),
          "comparativo_mercado": string
        },
        "performance_metrics": {
          "occupancyRate": number,
          "averageRating": number,
          "reviewCount": number,
          "responseRate": number,
          "averageDailyRate": string,
          "revenueGrowth": string
        },
        "recommendations": [
          {
            "category": string,
            "items": string[]
          }
        ],
        "pricing_strategy": {
          "base_price": string,
          "current_analysis": string,
          "seasonal_pricing": [
            {
              "season": "high" | "medium" | "low",
              "months": string[],
              "price": number,
              "strategy": string
            }
          ],
          "special_events": object,
          "discount_policies": object,
          "weekly_price": string,
          "monthly_price": string,
          "min_stay": string
        },
        "competitor_analysis": {
          "directCompetitors": [
            {
              "name": string,
              "price": string,
              "rating": number,
              "strengths": string,
              "weaknesses": string
            }
          ],
          "marketInsights": string[]
        },
        "property_data": {
          "property_name": string,
          "location": string,
          "property_type": string,
          "rating": number
        }
      }
      
      Forneça uma análise crítica e prática com recomendações ESPECÍFICAS e ACIONÁVEIS. 
      Inclua números e estimativas sempre que possível. Seja preciso nas estimativas de custos e ROI.
      Foque em sugestões que tragam o melhor retorno sobre investimento possível.
      Todas as seções devem ter dados concretos e mensuráveis, evitando generalidades.
      Seja direto, pragmático e preciso, mantendo um tom profissional e construtivo.
      
      Importante: Responda apenas com o JSON válido, sem texto adicional antes ou depois.`;

    console.log("Sending request to Gemini API");
    
    try {
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
        console.error(`Failed to analyze with Gemini (HTTP ${geminiResponse.status}):`, errorText);
        throw new Error(`Failed to analyze with Gemini: ${errorText}`);
      }
      
      console.log("Received response from Gemini API");
      const geminiData = await geminiResponse.json();
      
      if (!geminiData.candidates || geminiData.candidates.length === 0) {
        console.error("Empty response from Gemini API:", geminiData);
        throw new Error("Empty response from Gemini API");
      }
      
      const analysisResult = geminiData.candidates[0].content.parts[0].text;
      
      // Parse the JSON response to ensure it's valid
      let parsedAnalysis;
      try {
        // Limpar o texto para garantir que só temos o JSON válido
        const jsonString = analysisResult.trim().replace(/```json|```/g, '');
        parsedAnalysis = JSON.parse(jsonString);
        console.log("Successfully parsed analysis JSON");
      } catch (error) {
        console.error("Error parsing Gemini response:", error, "Raw response:", analysisResult);
        throw new Error("Failed to parse analysis result as valid JSON");
      }
      
      console.log("Updating submission with analysis results");
      
      await supabase
        .from("diagnostic_submissions")
        .update({
          status: "completed",
          analysis_result: parsedAnalysis,
        })
        .eq("id", id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Property analysis completed successfully",
          analysisResult: parsedAnalysis,
          propertyInfo
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } catch (geminiError) {
      console.error("Error in Gemini analysis:", geminiError);
      
      // Update status to indicate an issue with analysis
      await supabase
        .from("diagnostic_submissions")
        .update({ 
          status: "pending_manual_review",
          scraped_data: {
            ...submission.scraped_data,
            analysis_error: String(geminiError),
            analysis_error_at: new Date().toISOString()
          }
        })
        .eq("id", id);
      
      throw geminiError;
    }
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

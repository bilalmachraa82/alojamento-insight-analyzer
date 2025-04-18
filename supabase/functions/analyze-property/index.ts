
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

    if (!submission.scraped_data?.property_data) {
      return new Response(
        JSON.stringify({ error: "No property data found in submission" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    const prompt = `
      Você é um consultor especialista em alojamento local com anos de experiência em otimização de propriedades no Booking.com, Airbnb e outras plataformas. 
      Analise detalhadamente esta propriedade e forneça um relatório estratégico completo.
      
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
      
      Forneça uma análise detalhada estruturada no seguinte formato JSON:
      
      {
        "diagnostico_inicial": {
          "desempenho_atual": {
            "pontuacao_visibilidade": number (1-10),
            "analise_precos": string,
            "analise_ocupacao": string
          },
          "pontos_fortes": string[],
          "areas_melhoria": string[]
        },
        "estrategia_melhoria": {
          "recomendacoes_tecnicas": [
            {
              "descricao": string,
              "prioridade": "alta" | "media" | "baixa",
              "custo_estimado": string,
              "impacto_esperado": string
            }
          ],
          "recomendacoes_marketing": string[],
          "sugestoes_rebranding": string | null
        },
        "experiencia_hospede": {
          "pontos_positivos": string[],
          "sugestoes_melhoria": [
            {
              "descricao": string,
              "implementacao": string,
              "custo_estimado": string
            }
          ],
          "ideias_valor_agregado": string[]
        },
        "estrategia_precos": {
          "analise_atual": string,
          "recomendacao_preco_base": string,
          "estrategia_sazonalidade": {
            "alta_temporada": string,
            "baixa_temporada": string,
            "eventos_especiais": string[]
          },
          "politica_descontos": string[]
        },
        "gestao_canais": {
          "plataformas_recomendadas": string[],
          "estrategia_distribuicao": string,
          "dicas_otimizacao": string[]
        },
        "monitorizacao_desempenho": {
          "kpis_principais": [
            {
              "metrica": string,
              "objetivo": string,
              "frequencia_monitoramento": string
            }
          ],
          "projecoes_financeiras": {
            "cenario_conservador": string,
            "cenario_otimista": string,
            "retorno_investimento": string
          }
        },
        "analise_concorrencia": {
          "posicionamento_mercado": string,
          "vantagens_competitivas": string[],
          "areas_desvantagem": string[],
          "oportunidades": string[],
          "ameacas": string[]
        }
      }
      
      Forneça uma análise crítica e prática com recomendações ESPECÍFICAS e ACIONÁVEIS. 
      Inclua números e estimativas sempre que possível.
      Foque em sugestões que tragam o melhor ROI possível.
      Seja direto e objetivo, mas mantenha um tom profissional e construtivo.`;

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
    
    // Parse the JSON response to ensure it's valid
    const parsedAnalysis = JSON.parse(analysisResult);
    
    await supabase
      .from("diagnostic_submissions")
      .update({
        status: "completed",
        analysis_result: {
          full_report: parsedAnalysis,
          generated_at: new Date().toISOString()
        }
      })
      .eq("id", id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Property analysis completed successfully",
        analysisResult: parsedAnalysis
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


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
          "desempenho_atual": {
            "pontuacao_visibilidade": number (1-10),
            "analise_precos": string,
            "analise_ocupacao": string,
            "taxa_ocupacao_estimada": number (1-100),
            "pontuacao_rating": number (1-10),
            "comparativo_mercado": string
          },
          "pontos_fortes": string[],
          "areas_melhoria": string[],
          "metricas_chave": {
            "previsao_receita_anual": string,
            "preco_medio_noite": number,
            "preco_otimizado_sugerido": number,
            "potencial_crescimento": string
          }
        },
        "estrategia_melhoria": {
          "recomendacoes_tecnicas": [
            {
              "descricao": string,
              "prioridade": "alta" | "media" | "baixa",
              "custo_estimado": string,
              "impacto_esperado": string,
              "roi_estimado": string,
              "tempo_implementacao": string
            }
          ],
          "recomendacoes_marketing": [
            {
              "descricao": string,
              "canal": string,
              "impacto_esperado": string,
              "recursos_necessarios": string
            }
          ],
          "sugestoes_rebranding": string | null
        },
        "experiencia_hospede": {
          "pontos_positivos": string[],
          "sugestoes_melhoria": [
            {
              "descricao": string,
              "implementacao": string,
              "custo_estimado": string,
              "impacto_experiencia": string
            }
          ],
          "ideias_valor_agregado": string[],
          "analise_comentarios": {
            "temas_positivos": string[],
            "temas_negativos": string[],
            "sentimento_geral": string
          }
        },
        "estrategia_precos": {
          "analise_atual": string,
          "recomendacao_preco_base": string,
          "dados_sazonalidade": {
            "alta_temporada": {
              "meses": string[],
              "preco_recomendado": string,
              "estrategia": string
            },
            "media_temporada": {
              "meses": string[],
              "preco_recomendado": string,
              "estrategia": string
            },
            "baixa_temporada": {
              "meses": string[],
              "preco_recomendado": string,
              "estrategia": string
            }
          },
          "eventos_especiais": [
            {
              "nome": string,
              "data": string,
              "estrategia_preco": string
            }
          ],
          "politica_descontos": string[],
          "tabela_precos_sugeridos": {
            "semanal": number,
            "mensal": number,
            "minimo_estadia_recomendado": number
          }
        },
        "gestao_canais": {
          "plataformas_recomendadas": string[],
          "estrategia_distribuicao": string,
          "dicas_otimizacao": [
            {
              "plataforma": string,
              "acao": string,
              "beneficio": string
            }
          ],
          "canais_adicionais_sugeridos": string[]
        },
        "monitorizacao_desempenho": {
          "kpis_principais": [
            {
              "metrica": string,
              "valor_atual": string,
              "objetivo": string,
              "frequencia_monitoramento": string
            }
          ],
          "projecoes_financeiras": {
            "cenario_conservador": {
              "receita_anual": string,
              "despesas": string,
              "lucro_estimado": string
            },
            "cenario_otimista": {
              "receita_anual": string,
              "despesas": string,
              "lucro_estimado": string
            },
            "retorno_investimento": {
              "tempo_estimado": string,
              "roi_percentual": string
            }
          }
        },
        "analise_concorrencia": {
          "posicionamento_mercado": string,
          "vantagens_competitivas": string[],
          "areas_desvantagem": string[],
          "oportunidades": string[],
          "ameacas": string[],
          "benchmark_concorrentes": [
            {
              "nome": string,
              "preco": string,
              "pontos_fortes": string[],
              "diferencial_competitivo": string
            }
          ]
        }
      }
      
      Forneça uma análise crítica e prática com recomendações ESPECÍFICAS e ACIONÁVEIS. 
      Inclua números e estimativas sempre que possível. Seja preciso nas estimativas de custos e ROI.
      Foque em sugestões que tragam o melhor retorno sobre investimento possível.
      Todas as seções devem ter dados concretos e mensuráveis, evitando generalidades.
      Seja direto, pragmático e preciso, mantendo um tom profissional e construtivo.`;

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
    let parsedAnalysis;
    try {
      // Limpar o texto para garantir que só temos o JSON válido
      const jsonString = analysisResult.trim().replace(/```json|```/g, '');
      parsedAnalysis = JSON.stringify(JSON.parse(jsonString));
    } catch (error) {
      console.error("Error parsing Gemini response:", error);
      throw new Error("Failed to parse analysis result as valid JSON");
    }
    
    await supabase
      .from("diagnostic_submissions")
      .update({
        status: "completed",
        analysis_result: JSON.parse(parsedAnalysis),
      })
      .eq("id", id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Property analysis completed successfully",
        analysisResult: JSON.parse(parsedAnalysis),
        propertyInfo
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


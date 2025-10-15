import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

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
    const { id } = await req.json();
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing submission ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing property data with Claude for submission: ${id}`);

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

    if (!submission.property_data?.property_data) {
      console.error("No property data found for submission:", id);
      
      await supabase
        .from("diagnostic_submissions")
        .update({ 
          status: "pending_manual_review",
          error_message: "missing_property_data",
          property_data: {
            ...submission.property_data,
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

    const propertyData = submission.property_data.property_data;
    
    const propertyInfo = {
      name: propertyData.name || "Propriedade",
      url: submission.property_url,
      platform: submission.platform,
      location: propertyData.location || "Portugal",
      rating: propertyData.rating || 0,
      reviewCount: propertyData.reviewCount || 0,
      amenities: propertyData.amenities || [],
      price: propertyData.price || "Preço não disponível",
      description: propertyData.description || "Sem descrição",
      host: propertyData.host || {},
      reviews: propertyData.reviews || [],
      similarListings: propertyData.similarListings || []
    };

    // FASE 2: Enhanced prompt for Claude with premium analysis structure + Advanced KPIs (FASE 4)
    const prompt = `Você é um consultor especialista de elite em alojamento local, com 20+ anos de experiência internacional em gestão de propriedades no Booking.com, Airbnb, Vrbo e outras plataformas. Você domina análise de mercado, revenue management, e estratégias de optimização operacional.

Analise detalhadamente esta propriedade e forneça um relatório estratégico completo seguindo EXATAMENTE a estrutura A Maria Faz para relatórios premium.

DADOS DA PROPRIEDADE:
Nome: ${propertyInfo.name}
Plataforma: ${propertyInfo.platform}  
Localização: ${propertyInfo.location}
Avaliação: ${propertyInfo.rating}
Número de Avaliações: ${propertyInfo.reviewCount}
Preço: ${propertyInfo.price}
Reviews: ${JSON.stringify(propertyInfo.reviews?.slice(0, 10) || [])}
Comodidades: ${JSON.stringify(propertyInfo.amenities)}
Descrição: ${propertyInfo.description}
Anfitrião: ${JSON.stringify(propertyInfo.host)}
Propriedades Similares: ${JSON.stringify(propertyInfo.similarListings.slice(0, 5))}

CALCULE O HEALTH SCORE (0-100) usando esta fórmula exata:
Health Score = (
    (Classificação/5 * 25) +
    (Presença_Digital * 20) +
    (Performance_Financeira * 20) +
    (Infraestrutura * 15) +
    (Experiência_Hóspede * 10) +
    (Gestão_Reputação * 10)
)

Forneça uma análise no seguinte formato JSON EXATO para relatório premium:

{
  "health_score": {
    "total": number (0-100),
    "breakdown": {
      "classificacao": number (0-25),
      "presenca_digital": number (0-20), 
      "performance_financeira": number (0-20),
      "infraestrutura": number (0-15),
      "experiencia_hospede": number (0-10),
      "gestao_reputacao": number (0-10)
    },
    "categoria": "excelente" | "bom" | "medio" | "critico"
  },
  "diagnostico_inicial": {
    "resumo_executivo": string,
    "problemas_criticos": string[],
    "pontos_fortes": string[],
    "receita_anual_estimada": string,
    "taxa_ocupacao_estimada": number,
    "preco_medio_noite": string,
    "analise_competitiva": {
      "posicao_mercado": string,
      "gap_preco": string,
      "gap_qualidade": string
    }
  },
  "reputacao_reviews": {
    "situacao_atual": string,
    "comentarios_positivos": string[],
    "comentarios_negativos": string[], 
    "estrategia_melhoria": string[],
    "meta_6_meses": {
      "classificacao_objetivo": number,
      "reviews_objetivo": number
    }
  },
  "infraestrutura_conforto": {
    "intervencoes_prioritarias": [
      {
        "problema": string,
        "solucao": string,
        "investimento": string,
        "prioridade": "urgente" | "alta" | "media" | "baixa",
        "impacto": string
      }
    ],
    "cronograma": {
      "semana_1_2": string[],
      "semana_3_4": string[],
      "mes_2": string[],
      "mes_3": string[]
    }
  },
  "estrategia_precos": {
    "analise_atual": string,
    "precos_dinamicos": {
      "alta_epoca": { "atual": string, "sugerido": string, "justificacao": string },
      "epoca_media": { "atual": string, "sugerido": string, "justificacao": string },
      "baixa_epoca": { "atual": string, "sugerido": string, "justificacao": string },
      "fins_semana": { "atual": string, "sugerido": string, "justificacao": string },
      "dias_semana": { "atual": string, "sugerido": string, "justificacao": string }
    },
    "estrategias_complementares": string[]
  },
  "presenca_online": {
    "auditoria_atual": {
      "qualidade_fotos": number (0-100),
      "qualidade_descricao": number (0-100),
      "plataformas_ativas": string[]
    },
    "plano_otimizacao": {
      "fotografia": string[],
      "descricao": string[],
      "expansao_canais": string[]
    }
  },
  "experiencia_hospede": {
    "welcome_kit": string[],
    "parcerias_estrategicas": [
      {
        "tipo": string,
        "beneficio_hospede": string,
        "beneficio_propriedade": string
      }
    ],
    "automacao_comunicacao": string[]
  },
  "kpis_acompanhamento": {
    "metricas_principais": {
      "taxa_ocupacao": { "atual": string, "meta": string },
      "adr": { "atual": string, "meta": string },
      "revpar": { "atual": string, "meta": string },
      "guest_score": { "atual": string, "meta": string },
      "trevpar": { "atual": string, "meta": string, "descricao": "Total RevPAR incluindo receitas complementares" },
      "goppar": { "atual": string, "meta": string, "descricao": "Gross Operating Profit per Available Room" }
    },
    "metricas_avancadas": {
      "pickup_analysis": {
        "reservas_last_30_days": number,
        "reservas_same_period_last_year": number,
        "variacao_percentual": string
      },
      "channel_performance": [
        {
          "canal": string,
          "receita_percentual": number,
          "ocupacao_percentual": number,
          "custo_aquisicao": string
        }
      ],
      "compression_analysis": {
        "dias_alta_demanda": number,
        "oportunidade_preco_premium": string
      }
    },
    "objetivos_12_meses": {
      "classificacao": string,
      "ocupacao": string,
      "crescimento_receita": string,
      "novas_reviews": string,
      "reducao_custo_aquisicao": string,
      "aumento_ancillary_revenue": string
    }
  },
  "property_data": {
    "property_name": string,
    "location": string,
    "property_type": string,
    "rating": number,
    "platform": string
  }
}

CÁLCULOS AVANÇADOS OBRIGATÓRIOS:

1. **TRevPAR** (Total Revenue Per Available Room): 
   - TRevPAR = (Receita Alojamento + Receitas Ancilares) / Total Quartos Disponíveis
   - Inclua estimativas realistas de receitas complementares (serviços adicionais, upgrades, parcerias)

2. **GOPPAR** (Gross Operating Profit per Available Room):
   - GOPPAR = (Receita Total - Custos Operacionais) / Total Quartos Disponíveis
   - Estime custos: limpeza (15-20% receita), comissões plataformas (15-18%), utilities (8-12%), manutenção (5-8%)

3. **Pickup Analysis**:
   - Compare reservas dos últimos 30 dias vs mesmo período ano anterior
   - Identifique tendências de antecedência de reserva

4. **Channel Performance**:
   - Analise distribuição de receita por canal (Booking, Airbnb, direto)
   - Calcule CAC (Customer Acquisition Cost) por canal
   - Identifique canal mais rentável

5. **Compression Analysis**:
   - Identifique períodos de alta demanda onde preço premium é possível
   - Analise elasticidade de preço vs ocupação

REGRAS DE INFERÊNCIA quando dados estão em falta:
- Se não houver dados históricos, use benchmarks da indústria para a localização
- Para propriedades em Lisboa: Ocupação média 65-75%, ADR €80-150 dependendo do bairro
- Para propriedades em Porto: Ocupação média 60-70%, ADR €70-120
- Para propriedades em Algarve: Ocupação média 70-80% (sazonal), ADR €90-180
- Use o rating e número de reviews para ajustar estimativas (rating >4.5 = +15% ADR)
- Estime receitas ancilares em 8-12% da receita de alojamento para propriedades bem geridas

IMPORTANTE: 
- Seja específico e prático em todas as recomendações com AÇÕES CONCRETAS
- Use dados reais da propriedade para todos os cálculos
- Quando dados não disponíveis, use benchmarks e EXPLIQUE as suposições
- Mantenha tom profissional e consultivo tipo "A Maria Faz"
- Todos os valores devem estar em euros com 2 casas decimais
- Todas as percentagens devem incluir o símbolo %
- Forneça pelo menos 5 intervenções prioritárias na infraestrutura
- Inclua pelo menos 3 estratégias complementares de preços
- Responda APENAS com o JSON válido, sem texto adicional antes ou depois`;

    console.log("Sending request to Claude API");
    
    try {
      const claudeResponse = await fetch(CLAUDE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 8192,
          temperature: 0.3,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text();
        console.error(`Failed to analyze with Claude (HTTP ${claudeResponse.status}):`, errorText);
        throw new Error(`Failed to analyze with Claude: ${errorText}`);
      }
      
      console.log("Received response from Claude API");
      const claudeData = await claudeResponse.json();
      
      if (!claudeData.content || claudeData.content.length === 0) {
        console.error("Empty response from Claude API:", claudeData);
        throw new Error("Empty response from Claude API");
      }
      
      const analysisResult = claudeData.content[0].text;
      
      // Parse the JSON response
      let parsedAnalysis;
      try {
        const jsonString = analysisResult.trim().replace(/```json|```/g, '');
        parsedAnalysis = JSON.parse(jsonString);
        console.log("Successfully parsed Claude analysis JSON");
      } catch (error) {
        console.error("Error parsing Claude response:", error, "Raw response:", analysisResult);
        throw new Error("Failed to parse analysis result as valid JSON");
      }
      
      console.log("Updating submission with Claude analysis results");
      
      await supabase
        .from("diagnostic_submissions")
        .update({
          status: "completed",
          analysis_result: parsedAnalysis,
        })
        .eq("id", id);

      // CRITICAL: Generate Premium PDF after successful analysis
      console.log("Triggering premium PDF generation for submission:", id);
      try {
        const { data: pdfData, error: pdfError } = await supabase.functions.invoke("generate-premium-pdf", {
          body: {
            submissionId: id,
            analysisData: parsedAnalysis
          }
        });

        if (pdfError) {
          console.error("Error generating premium PDF:", pdfError);
          // Don't fail the whole request if PDF generation fails
        } else {
          console.log("Premium PDF generated successfully:", pdfData);
        }
      } catch (pdfException) {
        console.error("Exception during PDF generation:", pdfException);
        // Continue without failing the analysis
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Property analysis completed successfully with Claude",
          analysisResult: parsedAnalysis,
          propertyInfo
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } catch (claudeError) {
      console.error("Error in Claude analysis:", claudeError);
      
      await supabase
        .from("diagnostic_submissions")
        .update({ 
          status: "pending_manual_review",
          error_message: String(claudeError),
          property_data: {
            ...submission.property_data,
            analysis_error: String(claudeError),
            analysis_error_at: new Date().toISOString()
          }
        })
        .eq("id", id);
      
      throw claudeError;
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
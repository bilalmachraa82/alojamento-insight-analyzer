import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
// Puppeteer removed - generating HTML report instead
import Handlebars from "https://esm.sh/handlebars@4.7.8";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId, analysisData } = await req.json();
    
    if (!submissionId || !analysisData) {
      return new Response(
        JSON.stringify({ error: "Missing submission ID or analysis data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("=================================");
    console.log("📄 GERAR RELATÓRIO HTML PREMIUM");
    console.log(`Submission ID: ${submissionId}`);
    console.log("=================================");

    // Generate premium HTML report
    console.log("🔨 Compilando template Handlebars...");
    const html = await generatePremiumHTML(analysisData);
    console.log("✅ Template compilado com sucesso");
    
    console.log("📦 Preparando bytes do HTML...");
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(html);
    console.log(`✅ HTML gerado: ${htmlBytes.length} bytes (${(htmlBytes.length / 1024).toFixed(2)} KB)`);
    
    const fileName = `relatorio_premium_${analysisData.property_data.property_name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`;
    console.log(`📝 Nome do ficheiro: ${fileName}`);
    
    // Store the HTML report in Storage
    console.log("☁️ Enviando para Supabase Storage (bucket: premium-reports)...");
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('premium-reports')
      .upload(fileName, htmlBytes, {
        contentType: 'text/html; charset=utf-8',
        upsert: false
      });

    if (uploadError) {
      console.log("=================================");
      console.error("❌ ERRO NO UPLOAD");
      console.error(uploadError);
      console.log("=================================");
      throw uploadError;
    }
    console.log("✅ Upload concluído com sucesso");

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('premium-reports')
      .getPublicUrl(fileName);
    console.log(`🌐 URL pública gerada: ${publicUrl}`);

    // Update submission with report URL
    console.log("💾 Atualizando submission com URL do relatório...");
    await supabase
      .from("diagnostic_submissions")
      .update({
        premium_report_url: publicUrl,
        report_generated_at: new Date().toISOString()
      })
      .eq("id", submissionId);
    console.log("✅ Submission atualizada");

    console.log("=================================");
    console.log("✅ RELATÓRIO PREMIUM CONCLUÍDO");
    console.log("=================================");
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Premium report generated successfully",
        reportUrl: publicUrl,
        fileName
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error generating premium PDF:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function generatePremiumHTML(analysisData: any): Promise<string> {
  const templateString = await getPremiumTemplate();
  
  // Compile template with Handlebars
  const template = Handlebars.compile(templateString);
  
  // Prepare structured data for Handlebars
  const templateData = {
    // Property basics
    property_name: analysisData.property_data?.property_name || "Propriedade",
    current_date: new Date().toLocaleDateString('pt-PT'),
    
    // Health Score
    health_score_total: analysisData.health_score?.total || 0,
    health_score_class: `score-${analysisData.health_score?.categoria || 'medio'}`,
    
    // Diagnostico Inicial
    resumo_executivo: analysisData.diagnostico_inicial?.resumo_executivo || "",
    rating_display: analysisData.property_data?.rating || 0,
    review_count: analysisData.property_data?.review_count || 0,
    receita_anual: analysisData.diagnostico_inicial?.receita_anual_estimada || "€0",
    preco_medio_noite: analysisData.diagnostico_inicial?.preco_medio_noite || "€0",
    taxa_ocupacao: analysisData.diagnostico_inicial?.taxa_ocupacao_estimada || 0,
    analise_competitiva_resumo: analysisData.diagnostico_inicial?.analise_competitiva?.posicao_mercado || "",
    
    // Reputação & Reviews - Arrays
    comentarios_positivos: analysisData.reputacao_reviews?.comentarios_positivos || [],
    comentarios_negativos: analysisData.reputacao_reviews?.comentarios_negativos || [],
    estrategia_melhoria: analysisData.reputacao_reviews?.estrategia_melhoria || [],
    meta_classificacao: analysisData.reputacao_reviews?.meta_6_meses?.classificacao_objetivo || 0,
    meta_reviews: analysisData.reputacao_reviews?.meta_6_meses?.reviews_objetivo || 0,
    
    // Infraestrutura - Array
    intervencoes_prioritarias: analysisData.infraestrutura_conforto?.intervencoes_prioritarias || [],
    
    // Estratégia de Preços
    analise_precos_atual: analysisData.estrategia_precos?.analise_atual || "",
    alta_epoca_atual: analysisData.estrategia_precos?.precos_dinamicos?.alta_epoca?.atual || "€0",
    alta_epoca_sugerido: analysisData.estrategia_precos?.precos_dinamicos?.alta_epoca?.sugerido || "€0",
    alta_epoca_justificacao: analysisData.estrategia_precos?.precos_dinamicos?.alta_epoca?.justificacao || "",
    epoca_media_atual: analysisData.estrategia_precos?.precos_dinamicos?.epoca_media?.atual || "€0",
    epoca_media_sugerido: analysisData.estrategia_precos?.precos_dinamicos?.epoca_media?.sugerido || "€0",
    epoca_media_justificacao: analysisData.estrategia_precos?.precos_dinamicos?.epoca_media?.justificacao || "",
    baixa_epoca_atual: analysisData.estrategia_precos?.precos_dinamicos?.baixa_epoca?.atual || "€0",
    baixa_epoca_sugerido: analysisData.estrategia_precos?.precos_dinamicos?.baixa_epoca?.sugerido || "€0",
    baixa_epoca_justificacao: analysisData.estrategia_precos?.precos_dinamicos?.baixa_epoca?.justificacao || "",
    fins_semana_atual: analysisData.estrategia_precos?.precos_dinamicos?.fins_semana?.atual || "€0",
    fins_semana_sugerido: analysisData.estrategia_precos?.precos_dinamicos?.fins_semana?.sugerido || "€0",
    fins_semana_justificacao: analysisData.estrategia_precos?.precos_dinamicos?.fins_semana?.justificacao || "",
    dias_semana_atual: analysisData.estrategia_precos?.precos_dinamicos?.dias_semana?.atual || "€0",
    dias_semana_sugerido: analysisData.estrategia_precos?.precos_dinamicos?.dias_semana?.sugerido || "€0",
    dias_semana_justificacao: analysisData.estrategia_precos?.precos_dinamicos?.dias_semana?.justificacao || "",
    estrategias_complementares: analysisData.estrategia_precos?.estrategias_complementares || [],
    
    // Presença Online
    qualidade_fotos: analysisData.presenca_online?.auditoria_atual?.qualidade_fotos || 0,
    qualidade_descricao: analysisData.presenca_online?.auditoria_atual?.qualidade_descricao || 0,
    plano_fotografia: analysisData.presenca_online?.plano_otimizacao?.fotografia || [],
    plano_descricao: analysisData.presenca_online?.plano_otimizacao?.descricao || [],
    expansao_canais: analysisData.presenca_online?.plano_otimizacao?.expansao_canais || [],
    
    // Experiência do Hóspede
    welcome_kit: analysisData.experiencia_hospede?.welcome_kit || [],
    parcerias_estrategicas: analysisData.experiencia_hospede?.parcerias_estrategicas || [],
    automacao_comunicacao: analysisData.experiencia_hospede?.automacao_comunicacao || [],
    
    // KPIs
    taxa_ocupacao_atual: analysisData.kpis_acompanhamento?.metricas_principais?.taxa_ocupacao?.atual || "0",
    taxa_ocupacao_meta: analysisData.kpis_acompanhamento?.metricas_principais?.taxa_ocupacao?.meta || "0",
    adr_atual: analysisData.kpis_acompanhamento?.metricas_principais?.adr?.atual || "0",
    adr_meta: analysisData.kpis_acompanhamento?.metricas_principais?.adr?.meta || "0",
    revpar_atual: analysisData.kpis_acompanhamento?.metricas_principais?.revpar?.atual || "0",
    revpar_meta: analysisData.kpis_acompanhamento?.metricas_principais?.revpar?.meta || "0",
    guest_score_atual: analysisData.kpis_acompanhamento?.metricas_principais?.guest_score?.atual || "0",
    guest_score_meta: analysisData.kpis_acompanhamento?.metricas_principais?.guest_score?.meta || "0",
    objetivo_classificacao: analysisData.kpis_acompanhamento?.objetivos_12_meses?.classificacao || "",
    objetivo_ocupacao: analysisData.kpis_acompanhamento?.objetivos_12_meses?.ocupacao || "",
    objetivo_crescimento: analysisData.kpis_acompanhamento?.objetivos_12_meses?.crescimento_receita || "",
    objetivo_reviews: analysisData.kpis_acompanhamento?.objetivos_12_meses?.novas_reviews || ""
  };
  
  return template(templateData);
}

async function getPremiumTemplate(): string {
  // Full premium template with ALL sections from A Maria Faz
  return `<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Consultoria Premium - {{property_name}}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Montserrat:wght@300;400;500;600;700;800&display=swap');
        
        :root {
            --rosa-primary: #E8B4B8;
            --rosa-claro: #F5D5D8;
            --azul-primary: #89CFF0;
            --azul-suave: #B8E0F0;
            --preto-suave: #2C2C2C;
            --cinza-medio: #666666;
            --cinza-claro: #F8F9FA;
            --branco: #FFFFFF;
            --verde: #4CAF50;
            --amarelo: #FFB74D;
            --laranja: #FF9800;
            --vermelho: #E57373;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Montserrat', sans-serif;
            line-height: 1.7;
            color: var(--preto-suave);
            background: var(--branco);
            font-size: 11pt;
        }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 40px; }
        
        /* Typography */
        h1, h2, h3, h4 { font-family: 'Playfair Display', serif; font-weight: 700; }
        h1 { font-size: 36pt; color: var(--rosa-primary); margin-bottom: 10px; }
        h2 { font-size: 24pt; color: var(--azul-primary); margin: 30px 0 15px; border-bottom: 3px solid var(--rosa-primary); padding-bottom: 8px; }
        h3 { font-size: 18pt; color: var(--preto-suave); margin: 20px 0 10px; }
        h4 { font-size: 14pt; color: var(--cinza-medio); margin: 15px 0 8px; }
        
        /* Header */
        header { 
            background: linear-gradient(135deg, var(--rosa-claro) 0%, var(--azul-suave) 100%);
            padding: 40px;
            border-radius: 15px;
            margin-bottom: 40px;
            text-align: center;
        }
        
        header h1 { color: var(--preto-suave); }
        header p { font-size: 12pt; color: var(--cinza-medio); margin: 5px 0; }
        
        /* Sections */
        .section { 
            background: var(--cinza-claro);
            padding: 30px;
            margin-bottom: 30px;
            border-radius: 12px;
            page-break-inside: avoid;
        }
        
        /* Health Score */
        .health-score-container { text-align: center; margin: 30px 0; }
        .health-score { 
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 180px;
            height: 180px;
            border-radius: 50%;
            font-size: 48pt;
            font-weight: 900;
            color: white;
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        .score-excelente { background: linear-gradient(135deg, var(--verde) 0%, #66BB6A 100%); }
        .score-bom { background: linear-gradient(135deg, var(--amarelo) 0%, #FFA726 100%); }
        .score-medio { background: linear-gradient(135deg, var(--laranja) 0%, #FF7043 100%); }
        .score-critico { background: linear-gradient(135deg, var(--vermelho) 0%, #EF5350 100%); }
        .score-label { font-size: 12pt; margin-top: 15px; font-weight: 600; color: var(--cinza-medio); }
        
        /* Cards & Grid */
        .kpi-grid { 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin: 25px 0;
        }
        
        .kpi-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border-left: 4px solid var(--rosa-primary);
        }
        
        .kpi-card h4 { margin: 0 0 10px; font-size: 11pt; color: var(--cinza-medio); }
        .kpi-value { font-size: 28pt; font-weight: 700; color: var(--azul-primary); line-height: 1; }
        .kpi-meta { font-size: 10pt; color: var(--cinza-medio); margin-top: 8px; }
        
        /* Tables */
        table { 
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
        }
        
        th, td {
            padding: 14px;
            text-align: left;
            border-bottom: 1px solid #E0E0E0;
        }
        
        th {
            background: linear-gradient(135deg, var(--rosa-primary) 0%, var(--azul-primary) 100%);
            color: white;
            font-weight: 600;
            font-size: 11pt;
        }
        
        tr:hover { background: #F5F5F5; }
        
        /* Lists */
        ul, ol { margin: 15px 0 15px 30px; }
        li { 
            margin-bottom: 12px;
            line-height: 1.6;
            padding-left: 10px;
        }
        
        ul li::marker { color: var(--rosa-primary); font-size: 14pt; }
        
        /* Highlight Boxes */
        .destaque {
            background: linear-gradient(135deg, var(--rosa-claro) 0%, white 100%);
            border-left: 5px solid var(--rosa-primary);
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        
        .alerta {
            background: linear-gradient(135deg, #FFEBEE 0%, white 100%);
            border-left: 5px solid var(--vermelho);
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        
        .sucesso {
            background: linear-gradient(135deg, #E8F5E9 0%, white 100%);
            border-left: 5px solid var(--verde);
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        
        /* Progress Bars */
        .progress-container {
            background: #E0E0E0;
            height: 24px;
            border-radius: 12px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, var(--rosa-primary) 0%, var(--azul-primary) 100%);
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 10px;
            color: white;
            font-weight: 600;
            font-size: 10pt;
        }
        
        /* Intervention Cards */
        .intervention-card {
            background: white;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            border-left: 4px solid var(--azul-primary);
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        
        .priority-urgente { border-left-color: var(--vermelho); }
        .priority-alta { border-left-color: var(--laranja); }
        .priority-media { border-left-color: var(--amarelo); }
        .priority-baixa { border-left-color: var(--verde); }
        
        .intervention-card h4 { 
            color: var(--preto-suave);
            margin-bottom: 10px;
            font-size: 13pt;
        }
        
        .intervention-meta {
            display: flex;
            gap: 20px;
            margin-top: 12px;
            font-size: 10pt;
            color: var(--cinza-medio);
        }
        
        .intervention-meta span {
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        /* Timeline */
        .timeline {
            position: relative;
            padding-left: 40px;
            margin: 20px 0;
        }
        
        .timeline::before {
            content: '';
            position: absolute;
            left: 15px;
            top: 0;
            bottom: 0;
            width: 3px;
            background: linear-gradient(180deg, var(--rosa-primary) 0%, var(--azul-primary) 100%);
        }
        
        .timeline-item {
            position: relative;
            margin-bottom: 25px;
            padding-left: 20px;
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: -28px;
            top: 5px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: var(--rosa-primary);
            border: 3px solid white;
            box-shadow: 0 0 0 2px var(--rosa-primary);
        }
        
        .timeline-item h4 {
            color: var(--azul-primary);
            margin-bottom: 8px;
        }
        
        /* Footer */
        footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid var(--rosa-primary);
        }
        
        footer p {
            margin: 10px 0;
            color: var(--cinza-medio);
        }
        
        .quote {
            font-style: italic;
            font-size: 13pt;
            color: var(--azul-primary);
            margin: 20px 0;
            font-weight: 500;
        }
        
        /* Page breaks */
        .page-break { page-break-before: always; }
        
        @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- HEADER -->
        <header>
            <h1>{{property_name}}</h1>
            <p style="font-size: 16pt; font-weight: 600; margin-top: 10px;">Relatório de Consultoria Premium</p>
            <p>Data: {{current_date}} | Consultor: A Maria Faz - Especialistas em Alojamento Local</p>
        </header>

        <!-- RESUMO EXECUTIVO -->
        <div class="destaque">
            <h3 style="margin-top: 0;">📋 Resumo Executivo</h3>
            <p style="font-size: 12pt; line-height: 1.8;">{{resumo_executivo}}</p>
        </div>

        <!-- HEALTH SCORE -->
        <section class="section">
            <h2>🏆 Health Score Global</h2>
            <div class="health-score-container">
                <div class="health-score {{health_score_class}}">
                    {{health_score_total}}
                </div>
                <p class="score-label">Pontuação de Saúde da Propriedade</p>
            </div>
        </section>

        <!-- DIAGNÓSTICO INICIAL -->
        <section class="section">
            <h2>📊 Diagnóstico Inicial & Performance</h2>
            
            <div class="kpi-grid">
                <div class="kpi-card">
                    <h4>Classificação Atual</h4>
                    <div class="kpi-value">{{rating_display}}</div>
                    <p class="kpi-meta">⭐ de 5.0</p>
                </div>
                <div class="kpi-card">
                    <h4>Receita Anual Estimada</h4>
                    <div class="kpi-value" style="color: var(--verde);">{{receita_anual}}</div>
                </div>
                <div class="kpi-card">
                    <h4>Preço Médio/Noite</h4>
                    <div class="kpi-value" style="color: var(--rosa-primary);">{{preco_medio_noite}}</div>
                </div>
                <div class="kpi-card">
                    <h4>Taxa de Ocupação</h4>
                    <div class="kpi-value" style="color: var(--laranja);">{{taxa_ocupacao}}%</div>
                </div>
            </div>
            
            <h3>🎯 Análise Competitiva</h3>
            <p>{{analise_competitiva_resumo}}</p>
            
            {{#if comentarios_positivos}}
            <div class="sucesso">
                <h4>✅ Pontos Fortes</h4>
                <ul>
                    {{#each comentarios_positivos}}
                    <li>{{this}}</li>
                    {{/each}}
                </ul>
            </div>
            {{/if}}
            
            {{#if comentarios_negativos}}
            <div class="alerta">
                <h4>⚠️ Problemas Críticos Identificados</h4>
                <ul>
                    {{#each comentarios_negativos}}
                    <li>{{this}}</li>
                    {{/each}}
                </ul>
            </div>
            {{/if}}
        </section>

        <div class="page-break"></div>

        <!-- REPUTAÇÃO & REVIEWS -->
        <section class="section">
            <h2>⭐ Reputação & Gestão de Reviews</h2>
            
            <p style="margin-bottom: 20px;"><strong>Situação Atual:</strong> A propriedade possui {{review_count}} avaliações com uma classificação média de {{rating_display}}/5.0</p>
            
            {{#if estrategia_melhoria}}
            <h3>🎯 Estratégias de Melhoria</h3>
            <ul>
                {{#each estrategia_melhoria}}
                <li>{{this}}</li>
                {{/each}}
            </ul>
            {{/if}}
            
            <div class="destaque">
                <h4>📈 Metas para os Próximos 6 Meses</h4>
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <h4>Classificação Objetivo</h4>
                        <div class="kpi-value">{{meta_classificacao}}</div>
                    </div>
                    <div class="kpi-card">
                        <h4>Número de Reviews</h4>
                        <div class="kpi-value">{{meta_reviews}}</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- INFRAESTRUTURA & CONFORTO -->
        <section class="section">
            <h2>🔧 Infraestrutura & Intervenções</h2>
            
            {{#if intervencoes_prioritarias}}
            <h3>Plano de Intervenções Prioritárias</h3>
            {{#each intervencoes_prioritarias}}
            <div class="intervention-card priority-{{prioridade}}">
                <h4>{{problema}}</h4>
                <p><strong>Solução:</strong> {{solucao}}</p>
                <div class="intervention-meta">
                    <span><strong>💰 Investimento:</strong> {{investimento}}</span>
                    <span><strong>⚡ Prioridade:</strong> {{prioridade}}</span>
                    <span><strong>📈 Impacto:</strong> {{impacto}}</span>
                </div>
            </div>
            {{/each}}
            {{/if}}
        </section>

        <div class="page-break"></div>

        <!-- ESTRATÉGIA DE PREÇOS -->
        <section class="section">
            <h2>💰 Estratégia de Preços Dinâmicos</h2>
            
            <p style="margin-bottom: 20px;">{{analise_precos_atual}}</p>
            
            <h3>Tabela de Preços Recomendados</h3>
            <table>
                <thead>
                    <tr>
                        <th>Período</th>
                        <th>Preço Atual</th>
                        <th>Preço Sugerido</th>
                        <th>Justificação</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Alta Época</strong></td>
                        <td>{{alta_epoca_atual}}</td>
                        <td style="color: var(--verde); font-weight: 600;">{{alta_epoca_sugerido}}</td>
                        <td>{{alta_epoca_justificacao}}</td>
                    </tr>
                    <tr>
                        <td><strong>Época Média</strong></td>
                        <td>{{epoca_media_atual}}</td>
                        <td style="color: var(--verde); font-weight: 600;">{{epoca_media_sugerido}}</td>
                        <td>{{epoca_media_justificacao}}</td>
                    </tr>
                    <tr>
                        <td><strong>Baixa Época</strong></td>
                        <td>{{baixa_epoca_atual}}</td>
                        <td style="color: var(--verde); font-weight: 600;">{{baixa_epoca_sugerido}}</td>
                        <td>{{baixa_epoca_justificacao}}</td>
                    </tr>
                    <tr>
                        <td><strong>Fins de Semana</strong></td>
                        <td>{{fins_semana_atual}}</td>
                        <td style="color: var(--verde); font-weight: 600;">{{fins_semana_sugerido}}</td>
                        <td>{{fins_semana_justificacao}}</td>
                    </tr>
                    <tr>
                        <td><strong>Dias de Semana</strong></td>
                        <td>{{dias_semana_atual}}</td>
                        <td style="color: var(--verde); font-weight: 600;">{{dias_semana_sugerido}}</td>
                        <td>{{dias_semana_justificacao}}</td>
                    </tr>
                </tbody>
            </table>
            
            {{#if estrategias_complementares}}
            <div class="destaque">
                <h4>💡 Estratégias Complementares</h4>
                <ul>
                    {{#each estrategias_complementares}}
                    <li>{{this}}</li>
                    {{/each}}
                </ul>
            </div>
            {{/if}}
        </section>

        <!-- KPIs & ACOMPANHAMENTO -->
        <section class="section">
            <h2>📈 KPIs & Acompanhamento</h2>
            
            <h3>Métricas Principais</h3>
            <div class="kpi-grid">
                <div class="kpi-card">
                    <h4>Taxa de Ocupação</h4>
                    <div class="kpi-value">{{taxa_ocupacao_atual}}</div>
                    <p class="kpi-meta">Meta: {{taxa_ocupacao_meta}}</p>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: {{taxa_ocupacao_atual}};">{{taxa_ocupacao_atual}}</div>
                    </div>
                </div>
                <div class="kpi-card">
                    <h4>ADR (Average Daily Rate)</h4>
                    <div class="kpi-value">{{adr_atual}}</div>
                    <p class="kpi-meta">Meta: {{adr_meta}}</p>
                </div>
                <div class="kpi-card">
                    <h4>RevPAR</h4>
                    <div class="kpi-value">{{revpar_atual}}</div>
                    <p class="kpi-meta">Meta: {{revpar_meta}}</p>
                </div>
                <div class="kpi-card">
                    <h4>Guest Score</h4>
                    <div class="kpi-value">{{guest_score_atual}}</div>
                    <p class="kpi-meta">Meta: {{guest_score_meta}}</p>
                </div>
            </div>
            
            <div class="destaque">
                <h4>🎯 Objetivos a 12 Meses</h4>
                <ul>
                    <li><strong>Classificação:</strong> {{objetivo_classificacao}}</li>
                    <li><strong>Ocupação:</strong> {{objetivo_ocupacao}}</li>
                    <li><strong>Crescimento Receita:</strong> {{objetivo_crescimento}}</li>
                    <li><strong>Novas Reviews:</strong> {{objetivo_reviews}}</li>
                </ul>
            </div>
        </section>

        <!-- FOOTER -->
        <footer>
            <p class="quote">
                "Respira fundo e trabalha este plano passo a passo. O sucesso da tua propriedade está ao alcance com dedicação e estratégia."
            </p>
            <p style="font-weight: 600; font-size: 12pt; margin-top: 30px;">
                A Maria Faz - Especialistas em Alojamento Local
            </p>
            <p style="font-size: 10pt; color: var(--cinza-medio);">
                © 2024 A Maria Faz. Todos os direitos reservados.<br>
                Este relatório é confidencial e destinado exclusivamente ao proprietário mencionado.
            </p>
        </footer>
    </div>
</body>
</html>`;
}

// This function is no longer needed as Handlebars handles all array iterations
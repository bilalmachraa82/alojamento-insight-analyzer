import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import Handlebars from "https://esm.sh/handlebars@4.7.8";

const supabaseUrl = "https://rhrluvhbajdsnmvnpjzk.supabase.co";
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

    console.log(`Generating premium PDF for submission: ${submissionId}`);

    // Generate premium HTML report
    const html = await generatePremiumHTML(analysisData);
    
    console.log("Launching Puppeteer browser...");
    
    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF with optimized settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    
    console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);
    
    const fileName = `relatorio_premium_${analysisData.property_data.property_name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    
    // Store the PDF report in Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error("Error uploading report:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('reports')
      .getPublicUrl(fileName);

    // Update submission with report URL
    await supabase
      .from("diagnostic_submissions")
      .update({
        premium_report_url: publicUrl,
        premium_report_generated_at: new Date().toISOString()
      })
      .eq("id", submissionId);

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
  // Premium template with A Maria Faz styling
  return `<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Consultoria - {{property_name}}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@300;400;600;700&display=swap');
        
        :root {
            --rosa-claro: #EECAC9;
            --azul-suave: #A8DADF;
            --preto-suave: #1E1E1E;
            --branco-puro: #FFFFFF;
            --cinza-claro: #F8F9FA;
            --verde-sucesso: #28A745;
            --amarelo-atencao: #FFC107;
            --vermelho-critico: #DC3545;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Montserrat', sans-serif;
            line-height: 1.6;
            color: var(--preto-suave);
            background: var(--branco-puro);
        }
        
        h1, h2, h3 { font-family: 'Playfair Display', serif; margin-bottom: 1rem; }
        h1 { font-size: 2.5rem; color: var(--preto-suave); }
        h2 { font-size: 2rem; color: var(--preto-suave); border-bottom: 3px solid var(--rosa-claro); padding-bottom: 0.5rem; }
        h3 { font-size: 1.4rem; color: var(--azul-suave); }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .section { margin-bottom: 3rem; padding: 2rem; background: var(--cinza-claro); border-radius: 10px; }
        
        .health-score { 
            font-size: 3rem; font-weight: bold; text-align: center; padding: 2rem; 
            border-radius: 50%; width: 150px; height: 150px; margin: 0 auto; 
            display: flex; align-items: center; justify-content: center; 
        }
        .score-excelente { background: var(--verde-sucesso); color: white; }
        .score-bom { background: var(--amarelo-atencao); color: white; }
        .score-medio { background: #FF8C00; color: white; }
        .score-critico { background: var(--vermelho-critico); color: white; }
        
        .destaque { background: var(--rosa-claro); padding: 1rem; border-radius: 5px; margin: 1rem 0; }
        .alerta { background: var(--vermelho-critico); color: white; padding: 1rem; border-radius: 5px; margin: 1rem 0; }
        .sucesso { background: var(--verde-sucesso); color: white; padding: 1rem; border-radius: 5px; margin: 1rem 0; }
        
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin: 2rem 0; }
        .kpi-card { background: white; padding: 1.5rem; border-radius: 10px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: var(--azul-suave); color: white; }
        
        ul, ol { margin-left: 2rem; margin-bottom: 1rem; }
        li { margin-bottom: 0.5rem; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Relatório de Consultoria</h1>
            <h2>{{property_name}}</h2>
            <p><strong>Data do Relatório:</strong> {{current_date}}</p>
            <p><strong>Consultor:</strong> Equipa A Maria Faz - Especialistas em Alojamento Local</p>
            
            <div class="destaque">
                <h3>Resumo Executivo</h3>
                <p>{{resumo_executivo}}</p>
            </div>
        </header>

        <section class="section">
            <h2>1. Diagnóstico Inicial</h2>
            
            <div class="health-score {{health_score_class}}">
                {{health_score_total}}/100
            </div>
            <p style="text-align: center; margin-top: 1rem;"><strong>Health Score Global</strong></p>
            
            <h3>Indicadores de Performance Atual</h3>
            <div class="kpi-grid">
                <div class="kpi-card">
                    <h4>Classificação Média</h4>
                    <p style="font-size: 2rem; color: var(--azul-suave);">{{rating_display}}</p>
                </div>
                <div class="kpi-card">
                    <h4>Receita Anual Estimada</h4>
                    <p style="font-size: 2rem; color: var(--verde-sucesso);">{{receita_anual}}</p>
                </div>
                <div class="kpi-card">
                    <h4>Preço Médio/Noite</h4>
                    <p style="font-size: 2rem; color: var(--rosa-claro);">{{preco_medio_noite}}</p>
                </div>
                <div class="kpi-card">
                    <h4>Taxa de Ocupação</h4>
                    <p style="font-size: 2rem; color: var(--amarelo-atencao);">{{taxa_ocupacao}}%</p>
                </div>
            </div>
            
            <p><strong>Análise Competitiva:</strong> {{analise_competitiva_resumo}}</p>
        </section>

        <footer style="text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--rosa-claro);">
            <p style="font-style: italic; font-size: 1.1rem; color: var(--azul-suave);">
                "Respira fundo e trabalha este plano passo a passo para alcançar o sucesso da tua propriedade. — A Maria Faz"
            </p>
            <p style="margin-top: 2rem; font-size: 0.9rem; color: #666;">
                Relatório gerado pela A Maria Faz - Especialistas em Alojamento Local<br>
                © 2024 A Maria Faz. Todos os direitos reservados.
            </p>
        </footer>
    </div>
</body>
</html>`;
}

// This function is no longer needed as Handlebars handles all array iterations
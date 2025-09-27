import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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
    
    // For now, return the HTML directly
    // In production, this would use Puppeteer to generate PDF
    const fileName = `relatorio_premium_${analysisData.property_data.property_name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`;
    
    // Store the HTML report in Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, new Blob([html], { type: 'text/html' }), {
        contentType: 'text/html',
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
  // Get the premium template
  const template = await getPremiumTemplate();
  
  // Calculate health score class
  const healthScoreClass = `score-${analysisData.health_score.categoria}`;
  
  // Format current date
  const currentDate = new Date().toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Replace template variables
  let html = template
    .replace(/{{property_name}}/g, analysisData.property_data?.property_name || 'Propriedade')
    .replace(/{{current_date}}/g, currentDate)
    .replace(/{{health_score_class}}/g, healthScoreClass)
    .replace(/{{health_score_total}}/g, analysisData.health_score?.total?.toString() || '0')
    .replace(/{{resumo_executivo}}/g, analysisData.diagnostico_inicial?.resumo_executivo || 'Resumo não disponível')
    .replace(/{{rating_display}}/g, `${analysisData.property_data?.rating || 0}/5`)
    .replace(/{{receita_anual}}/g, analysisData.diagnostico_inicial?.receita_anual_estimada || 'N/A')
    .replace(/{{preco_medio_noite}}/g, analysisData.diagnostico_inicial?.preco_medio_noite || 'N/A')
    .replace(/{{taxa_ocupacao}}/g, analysisData.diagnostico_inicial?.taxa_ocupacao_estimada?.toString() || '0')
    .replace(/{{analise_competitiva_resumo}}/g, analysisData.diagnostico_inicial?.analise_competitiva?.posicao_mercado || 'Análise não disponível');
  
  // Handle arrays and complex objects
  html = replaceArraysInHTML(html, analysisData);
  
  return html;
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

function replaceArraysInHTML(html: string, data: any): string {
  // Simple array replacement - in production would use proper templating
  try {
    // Handle comments arrays if they exist
    if (data.reputacao_reviews?.comentarios_positivos) {
      const positivos = data.reputacao_reviews.comentarios_positivos
        .map((comment: string) => `<li>${comment}</li>`)
        .join('');
      html = html.replace('{{comentarios_positivos_list}}', positivos);
    }
    
    if (data.reputacao_reviews?.comentarios_negativos) {
      const negativos = data.reputacao_reviews.comentarios_negativos
        .map((comment: string) => `<li>${comment}</li>`)
        .join('');
      html = html.replace('{{comentarios_negativos_list}}', negativos);
    }
  } catch (error) {
    console.warn("Error replacing arrays in HTML:", error);
  }
  
  return html;
}
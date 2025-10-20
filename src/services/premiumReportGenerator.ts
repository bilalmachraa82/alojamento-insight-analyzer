export interface HealthScoreBreakdown {
  classificacao: number;
  presenca_digital: number;
  performance_financeira: number;
  infraestrutura: number;
  experiencia_hospede: number;
  gestao_reputacao: number;
}

export interface HealthScore {
  total: number;
  breakdown: HealthScoreBreakdown;
  categoria: 'excelente' | 'bom' | 'medio' | 'critico';
}

export interface SentimentAnalysisData {
  overall_sentiment: {
    score: number; // -1 to +1
    category: 'positive' | 'neutral' | 'negative';
    trend: 'improving' | 'stable' | 'declining';
  };
  topic_scores: Array<{
    topic: string;
    score: number;
    mention_count: number;
    trend: 'improving' | 'stable' | 'declining';
  }>;
  key_insights: {
    top_positive_aspects: string[];
    areas_for_improvement: string[];
    notable_quotes: Array<{
      text: string;
      sentiment: 'positive' | 'negative';
    }>;
  };
  action_items: string[];
}

export interface PremiumAnalysisData {
  health_score: HealthScore;
  diagnostico_inicial: {
    resumo_executivo: string;
    problemas_criticos: string[];
    pontos_fortes: string[];
    receita_anual_estimada: string;
    taxa_ocupacao_estimada: number;
    preco_medio_noite: string;
    analise_competitiva: {
      posicao_mercado: string;
      gap_preco: string;
      gap_qualidade: string;
    };
  };
  sentiment_analysis?: SentimentAnalysisData;
  reputacao_reviews: {
    situacao_atual: string;
    comentarios_positivos: string[];
    comentarios_negativos: string[];
    estrategia_melhoria: string[];
    meta_6_meses: {
      classificacao_objetivo: number;
      reviews_objetivo: number;
    };
  };
  infraestrutura_conforto: {
    intervencoes_prioritarias: Array<{
      problema: string;
      solucao: string;
      investimento: string;
      prioridade: 'urgente' | 'alta' | 'media' | 'baixa';
      impacto: string;
    }>;
    cronograma: {
      semana_1_2: string[];
      semana_3_4: string[];
      mes_2: string[];
      mes_3: string[];
    };
  };
  estrategia_precos: {
    analise_atual: string;
    precos_dinamicos: {
      alta_epoca: { atual: string; sugerido: string; justificacao: string };
      epoca_media: { atual: string; sugerido: string; justificacao: string };
      baixa_epoca: { atual: string; sugerido: string; justificacao: string };
      fins_semana: { atual: string; sugerido: string; justificacao: string };
      dias_semana: { atual: string; sugerido: string; justificacao: string };
    };
    estrategias_complementares: string[];
  };
  presenca_online: {
    auditoria_atual: {
      qualidade_fotos: number;
      qualidade_descricao: number;
      plataformas_ativas: string[];
    };
    plano_otimizacao: {
      fotografia: string[];
      descricao: string[];
      expansao_canais: string[];
    };
  };
  experiencia_hospede: {
    welcome_kit: string[];
    parcerias_estrategicas: Array<{
      tipo: string;
      beneficio_hospede: string;
      beneficio_propriedade: string;
    }>;
    automacao_comunicacao: string[];
  };
  kpis_acompanhamento: {
    metricas_principais: {
      taxa_ocupacao: { atual: string; meta: string };
      adr: { atual: string; meta: string };
      revpar: { atual: string; meta: string };
      guest_score: { atual: string; meta: string };
    };
    objetivos_12_meses: {
      classificacao: string;
      ocupacao: string;
      crescimento_receita: string;
      novas_reviews: string;
    };
  };
  property_data: {
    property_name: string;
    location: string;
    property_type: string;
    rating: number;
    platform: string;
  };
}

export class PremiumReportGenerator {
  static calculateHealthScore(
    rating: number,
    reviewCount: number,
    hasPhotos: boolean,
    hasDescription: boolean,
    priceCompetitiveness: number
  ): HealthScore {
    // Health Score Formula:
    // (Rating/5 * 25) + (Presença_Digital * 20) + (Performance_Financeira * 20) + 
    // (Infraestrutura * 15) + (Experiência_Hóspede * 10) + (Gestão_Reputação * 10)
    
    const classificacao = Math.min((rating / 5) * 25, 25);
    
    const presenca_digital = Math.min(
      (hasPhotos ? 10 : 0) + 
      (hasDescription ? 5 : 0) + 
      Math.min(reviewCount / 10, 5), 20
    );
    
    const performance_financeira = Math.min(priceCompetitiveness * 20, 20);
    
    const infraestrutura = rating >= 4 ? 12 : rating >= 3 ? 8 : 4;
    
    const experiencia_hospede = hasDescription && hasPhotos ? 8 : 5;
    
    const gestao_reputacao = reviewCount > 10 ? 8 : reviewCount > 5 ? 6 : 3;
    
    const breakdown: HealthScoreBreakdown = {
      classificacao,
      presenca_digital,
      performance_financeira,
      infraestrutura,
      experiencia_hospede,
      gestao_reputacao
    };
    
    const total = Math.round(
      breakdown.classificacao +
      breakdown.presenca_digital +
      breakdown.performance_financeira +
      breakdown.infraestrutura +
      breakdown.experiencia_hospede +
      breakdown.gestao_reputacao
    );
    
    let categoria: 'excelente' | 'bom' | 'medio' | 'critico';
    if (total >= 85) categoria = 'excelente';
    else if (total >= 70) categoria = 'bom';
    else if (total >= 50) categoria = 'medio';
    else categoria = 'critico';
    
    return { total, breakdown, categoria };
  }
  
  static generatePremiumHTML(analysisData: PremiumAnalysisData): string {
    // Load template and replace variables
    const template = this.getTemplate();
    
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
      .replace(/{{property_name}}/g, analysisData.property_data.property_name)
      .replace(/{{current_date}}/g, currentDate)
      .replace(/{{health_score_class}}/g, healthScoreClass)
      .replace(/{{health_score_total}}/g, analysisData.health_score.total.toString())
      .replace(/{{resumo_executivo}}/g, analysisData.diagnostico_inicial.resumo_executivo)
      .replace(/{{rating_display}}/g, `${analysisData.property_data.rating}/5`)
      .replace(/{{review_count}}/g, '0') // Default for now
      .replace(/{{receita_anual}}/g, analysisData.diagnostico_inicial.receita_anual_estimada)
      .replace(/{{preco_medio_noite}}/g, analysisData.diagnostico_inicial.preco_medio_noite)
      .replace(/{{taxa_ocupacao}}/g, analysisData.diagnostico_inicial.taxa_ocupacao_estimada.toString())
      .replace(/{{analise_competitiva_resumo}}/g, analysisData.diagnostico_inicial.analise_competitiva.posicao_mercado)
      .replace(/{{meta_classificacao}}/g, analysisData.reputacao_reviews.meta_6_meses.classificacao_objetivo.toString())
      .replace(/{{meta_reviews}}/g, analysisData.reputacao_reviews.meta_6_meses.reviews_objetivo.toString())
      .replace(/{{analise_precos_atual}}/g, analysisData.estrategia_precos.analise_atual)
      .replace(/{{alta_epoca_atual}}/g, analysisData.estrategia_precos.precos_dinamicos.alta_epoca.atual)
      .replace(/{{alta_epoca_sugerido}}/g, analysisData.estrategia_precos.precos_dinamicos.alta_epoca.sugerido)
      .replace(/{{alta_epoca_justificacao}}/g, analysisData.estrategia_precos.precos_dinamicos.alta_epoca.justificacao)
      .replace(/{{epoca_media_atual}}/g, analysisData.estrategia_precos.precos_dinamicos.epoca_media.atual)
      .replace(/{{epoca_media_sugerido}}/g, analysisData.estrategia_precos.precos_dinamicos.epoca_media.sugerido)
      .replace(/{{epoca_media_justificacao}}/g, analysisData.estrategia_precos.precos_dinamicos.epoca_media.justificacao)
      .replace(/{{baixa_epoca_atual}}/g, analysisData.estrategia_precos.precos_dinamicos.baixa_epoca.atual)
      .replace(/{{baixa_epoca_sugerido}}/g, analysisData.estrategia_precos.precos_dinamicos.baixa_epoca.sugerido)
      .replace(/{{baixa_epoca_justificacao}}/g, analysisData.estrategia_precos.precos_dinamicos.baixa_epoca.justificacao)
      .replace(/{{fins_semana_atual}}/g, analysisData.estrategia_precos.precos_dinamicos.fins_semana.atual)
      .replace(/{{fins_semana_sugerido}}/g, analysisData.estrategia_precos.precos_dinamicos.fins_semana.sugerido)
      .replace(/{{fins_semana_justificacao}}/g, analysisData.estrategia_precos.precos_dinamicos.fins_semana.justificacao)
      .replace(/{{dias_semana_atual}}/g, analysisData.estrategia_precos.precos_dinamicos.dias_semana.atual)
      .replace(/{{dias_semana_sugerido}}/g, analysisData.estrategia_precos.precos_dinamicos.dias_semana.sugerido)
      .replace(/{{dias_semana_justificacao}}/g, analysisData.estrategia_precos.precos_dinamicos.dias_semana.justificacao)
      .replace(/{{qualidade_fotos}}/g, analysisData.presenca_online.auditoria_atual.qualidade_fotos.toString())
      .replace(/{{qualidade_descricao}}/g, analysisData.presenca_online.auditoria_atual.qualidade_descricao.toString())
      .replace(/{{taxa_ocupacao_atual}}/g, analysisData.kpis_acompanhamento.metricas_principais.taxa_ocupacao.atual)
      .replace(/{{taxa_ocupacao_meta}}/g, analysisData.kpis_acompanhamento.metricas_principais.taxa_ocupacao.meta)
      .replace(/{{adr_atual}}/g, analysisData.kpis_acompanhamento.metricas_principais.adr.atual)
      .replace(/{{adr_meta}}/g, analysisData.kpis_acompanhamento.metricas_principais.adr.meta)
      .replace(/{{revpar_atual}}/g, analysisData.kpis_acompanhamento.metricas_principais.revpar.atual)
      .replace(/{{revpar_meta}}/g, analysisData.kpis_acompanhamento.metricas_principais.revpar.meta)
      .replace(/{{guest_score_atual}}/g, analysisData.kpis_acompanhamento.metricas_principais.guest_score.atual)
      .replace(/{{guest_score_meta}}/g, analysisData.kpis_acompanhamento.metricas_principais.guest_score.meta)
      .replace(/{{objetivo_classificacao}}/g, analysisData.kpis_acompanhamento.objetivos_12_meses.classificacao)
      .replace(/{{objetivo_ocupacao}}/g, analysisData.kpis_acompanhamento.objetivos_12_meses.ocupacao)
      .replace(/{{objetivo_crescimento}}/g, analysisData.kpis_acompanhamento.objetivos_12_meses.crescimento_receita)
      .replace(/{{objetivo_reviews}}/g, analysisData.kpis_acompanhamento.objetivos_12_meses.novas_reviews);
    
    // Handle array replacements (simplified for now)
    html = this.replaceArrays(html, analysisData);

    // Add sentiment analysis section if available
    html = this.addSentimentSection(html, analysisData);

    return html;
  }
  
  private static getTemplate(): string {
    // This would load the actual template file in a real implementation
    // For now, return a basic template structure
    return `<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Consultoria - {{property_name}}</title>
    <style>
        /* Premium styling would be loaded here from the template */
        body { font-family: 'Montserrat', sans-serif; }
        .score-excelente { background: #28A745; color: white; }
        .score-bom { background: #FFC107; color: white; }
        .score-medio { background: #FF8C00; color: white; }
        .score-critico { background: #DC3545; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Relatório Premium - {{property_name}}</h1>
        <div class="health-score {{health_score_class}}">
            {{health_score_total}}/100
        </div>
        <p>{{resumo_executivo}}</p>
        <!-- Full template content would be here -->
    </div>
</body>
</html>`;
  }
  
  private static replaceArrays(html: string, data: PremiumAnalysisData): string {
    // Handle array replacements (simplified implementation)
    // In a full implementation, this would use a proper templating engine like Handlebars

    // Replace comments arrays
    const positivos = data.reputacao_reviews.comentarios_positivos
      .map(comment => `<li>${comment}</li>`)
      .join('');

    const negativos = data.reputacao_reviews.comentarios_negativos
      .map(comment => `<li>${comment}</li>`)
      .join('');

    html = html.replace('{{#each comentarios_positivos}}', '').replace('{{/each}}', positivos);
    html = html.replace('{{#each comentarios_negativos}}', '').replace('{{/each}}', negativos);

    return html;
  }

  private static addSentimentSection(html: string, data: PremiumAnalysisData): string {
    if (!data.sentiment_analysis) {
      return html;
    }

    const sentiment = data.sentiment_analysis;

    // Create sentiment section HTML
    const sentimentSection = `
      <section class="sentiment-analysis-section">
        <h2>Análise de Sentimento dos Hóspedes</h2>

        <div class="sentiment-overview">
          <div class="sentiment-gauge">
            <h3>Sentimento Geral</h3>
            <div class="gauge-container">
              <div class="gauge-score ${sentiment.overall_sentiment.category}">
                ${(sentiment.overall_sentiment.score * 100).toFixed(0)}
              </div>
              <div class="gauge-label">${this.getSentimentLabel(sentiment.overall_sentiment.category)}</div>
              <div class="gauge-trend ${sentiment.overall_sentiment.trend}">
                ${this.getTrendIcon(sentiment.overall_sentiment.trend)} ${this.getTrendLabel(sentiment.overall_sentiment.trend)}
              </div>
            </div>
          </div>
        </div>

        <div class="topic-sentiment">
          <h3>Sentimento por Categoria</h3>
          <div class="topic-grid">
            ${sentiment.topic_scores.map(topic => `
              <div class="topic-card ${this.getSentimentCategory(topic.score)}">
                <h4>${this.translateTopic(topic.topic)}</h4>
                <div class="topic-score">${(topic.score * 100).toFixed(0)}</div>
                <div class="topic-mentions">${topic.mention_count} menções</div>
                <div class="topic-trend ${topic.trend}">
                  ${this.getTrendIcon(topic.trend)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="key-insights">
          <div class="positive-aspects">
            <h3>Pontos Fortes Destacados</h3>
            <ul>
              ${sentiment.key_insights.top_positive_aspects.map(aspect =>
                `<li class="positive">${aspect}</li>`
              ).join('')}
            </ul>
          </div>

          <div class="improvement-areas">
            <h3>Áreas de Melhoria</h3>
            <ul>
              ${sentiment.key_insights.areas_for_improvement.map(area =>
                `<li class="negative">${area}</li>`
              ).join('')}
            </ul>
          </div>
        </div>

        <div class="notable-quotes">
          <h3>Comentários Notáveis</h3>
          ${sentiment.key_insights.notable_quotes.map(quote => `
            <blockquote class="${quote.sentiment}">
              "${quote.text}"
            </blockquote>
          `).join('')}
        </div>

        <div class="action-items">
          <h3>Ações Recomendadas</h3>
          <ol class="action-list">
            ${sentiment.action_items.map(action =>
              `<li>${action}</li>`
            ).join('')}
          </ol>
        </div>

        <style>
          .sentiment-analysis-section {
            margin: 40px 0;
            padding: 30px;
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }

          .sentiment-overview {
            margin: 30px 0;
          }

          .sentiment-gauge {
            text-align: center;
          }

          .gauge-container {
            display: inline-block;
            padding: 20px;
          }

          .gauge-score {
            font-size: 72px;
            font-weight: bold;
            margin: 20px 0;
          }

          .gauge-score.positive { color: #28A745; }
          .gauge-score.neutral { color: #FFC107; }
          .gauge-score.negative { color: #DC3545; }

          .gauge-label {
            font-size: 24px;
            margin: 10px 0;
          }

          .gauge-trend {
            font-size: 18px;
            margin-top: 10px;
          }

          .gauge-trend.improving { color: #28A745; }
          .gauge-trend.stable { color: #FFC107; }
          .gauge-trend.declining { color: #DC3545; }

          .topic-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }

          .topic-card {
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #e0e0e0;
          }

          .topic-card.positive {
            background-color: #e8f5e9;
            border-color: #28A745;
          }

          .topic-card.neutral {
            background-color: #fff8e1;
            border-color: #FFC107;
          }

          .topic-card.negative {
            background-color: #ffebee;
            border-color: #DC3545;
          }

          .topic-score {
            font-size: 36px;
            font-weight: bold;
            margin: 10px 0;
          }

          .topic-mentions {
            font-size: 14px;
            color: #666;
          }

          .topic-trend {
            margin-top: 10px;
            font-size: 20px;
          }

          .key-insights {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 30px 0;
          }

          .positive-aspects, .improvement-areas {
            padding: 20px;
            border-radius: 8px;
          }

          .positive-aspects {
            background-color: #e8f5e9;
          }

          .improvement-areas {
            background-color: #ffebee;
          }

          .positive-aspects ul li.positive::before {
            content: "✓ ";
            color: #28A745;
            font-weight: bold;
          }

          .improvement-areas ul li.negative::before {
            content: "⚠ ";
            color: #DC3545;
            font-weight: bold;
          }

          .notable-quotes blockquote {
            padding: 20px;
            margin: 15px 0;
            border-left: 4px solid;
            border-radius: 4px;
            font-style: italic;
          }

          .notable-quotes blockquote.positive {
            background-color: #e8f5e9;
            border-color: #28A745;
          }

          .notable-quotes blockquote.negative {
            background-color: #ffebee;
            border-color: #DC3545;
          }

          .action-list {
            list-style: decimal;
            padding-left: 20px;
          }

          .action-list li {
            padding: 10px;
            margin: 10px 0;
            background-color: #f5f5f5;
            border-radius: 4px;
          }
        </style>
      </section>
    `;

    // Insert sentiment section after reputation section
    const insertPoint = html.indexOf('</body>');
    if (insertPoint !== -1) {
      html = html.slice(0, insertPoint) + sentimentSection + html.slice(insertPoint);
    }

    return html;
  }

  private static getSentimentLabel(category: string): string {
    const labels: Record<string, string> = {
      positive: 'Positivo',
      neutral: 'Neutro',
      negative: 'Negativo',
    };
    return labels[category] || 'N/A';
  }

  private static getTrendIcon(trend: string): string {
    const icons: Record<string, string> = {
      improving: '↗',
      stable: '→',
      declining: '↘',
    };
    return icons[trend] || '→';
  }

  private static getTrendLabel(trend: string): string {
    const labels: Record<string, string> = {
      improving: 'Melhorando',
      stable: 'Estável',
      declining: 'Declinando',
    };
    return labels[trend] || 'Estável';
  }

  private static getSentimentCategory(score: number): string {
    if (score >= 0.3) return 'positive';
    if (score <= -0.3) return 'negative';
    return 'neutral';
  }

  private static translateTopic(topic: string): string {
    const translations: Record<string, string> = {
      'Cleanliness': 'Limpeza',
      'Location': 'Localização',
      'Value': 'Custo-Benefício',
      'Amenities': 'Comodidades',
      'Communication': 'Comunicação',
      'Check-in': 'Check-in',
      'Accuracy': 'Precisão',
    };
    return translations[topic] || topic;
  }
}
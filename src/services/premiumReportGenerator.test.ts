import { describe, it, expect } from 'vitest';
import { PremiumReportGenerator } from './premiumReportGenerator';

describe('PremiumReportGenerator', () => {
  describe('calculateHealthScore', () => {
    it('should calculate health score correctly', () => {
      const result = PremiumReportGenerator.calculateHealthScore(
        4.5, // rating
        100, // reviewCount
        true, // hasPhotos
        true, // hasDescription
        0.8 // priceCompetitiveness
      );

      expect(result.total).toBeGreaterThan(0);
      expect(result.total).toBeLessThanOrEqual(100);
      expect(result.breakdown).toHaveProperty('classificacao');
      expect(result.breakdown).toHaveProperty('presenca_digital');
      expect(result.breakdown).toHaveProperty('performance_financeira');
      expect(result.breakdown).toHaveProperty('infraestrutura');
      expect(result.breakdown).toHaveProperty('experiencia_hospede');
      expect(result.breakdown).toHaveProperty('gestao_reputacao');
    });

    it('should categorize excellent properties correctly', () => {
      const result = PremiumReportGenerator.calculateHealthScore(
        5.0,
        200,
        true,
        true,
        1.0
      );

      expect(result.total).toBeGreaterThanOrEqual(85);
      expect(result.categoria).toBe('excelente');
    });

    it('should categorize good properties correctly', () => {
      const result = PremiumReportGenerator.calculateHealthScore(
        4.0,
        80,
        true,
        true,
        0.8
      );

      expect(result.total).toBeGreaterThanOrEqual(70);
      expect(result.total).toBeLessThan(85);
      expect(result.categoria).toBe('bom');
    });

    it('should categorize medium properties correctly', () => {
      const result = PremiumReportGenerator.calculateHealthScore(
        3.5,
        30,
        true,
        true,
        0.6
      );

      expect(result.total).toBeGreaterThanOrEqual(50);
      expect(result.total).toBeLessThan(70);
      expect(result.categoria).toBe('medio');
    });

    it('should categorize critical properties correctly', () => {
      const result = PremiumReportGenerator.calculateHealthScore(
        2.5,
        5,
        false,
        false,
        0.3
      );

      expect(result.total).toBeLessThan(50);
      expect(result.categoria).toBe('critico');
    });

    it('should weight rating component at 25% of total score', () => {
      const perfectRating = PremiumReportGenerator.calculateHealthScore(
        5.0,
        0,
        false,
        false,
        0
      );
      const noRating = PremiumReportGenerator.calculateHealthScore(
        0,
        0,
        false,
        false,
        0
      );

      expect(perfectRating.breakdown.classificacao).toBe(25);
      expect(noRating.breakdown.classificacao).toBe(0);
    });

    it('should calculate presenca_digital based on photos, description, and reviews', () => {
      const withEverything = PremiumReportGenerator.calculateHealthScore(
        4.0,
        100,
        true,
        true,
        0.5
      );
      const withNothing = PremiumReportGenerator.calculateHealthScore(
        4.0,
        0,
        false,
        false,
        0.5
      );

      expect(withEverything.breakdown.presenca_digital).toBeGreaterThan(
        withNothing.breakdown.presenca_digital
      );
    });

    it('should cap presenca_digital at 20 points', () => {
      const result = PremiumReportGenerator.calculateHealthScore(
        5.0,
        1000,
        true,
        true,
        1.0
      );

      expect(result.breakdown.presenca_digital).toBeLessThanOrEqual(20);
    });

    it('should calculate performance_financeira based on price competitiveness', () => {
      const highCompetitiveness = PremiumReportGenerator.calculateHealthScore(
        4.0,
        50,
        true,
        true,
        1.0
      );
      const lowCompetitiveness = PremiumReportGenerator.calculateHealthScore(
        4.0,
        50,
        true,
        true,
        0.3
      );

      expect(
        highCompetitiveness.breakdown.performance_financeira
      ).toBeGreaterThan(lowCompetitiveness.breakdown.performance_financeira);
    });

    it('should adjust infraestrutura based on rating', () => {
      const highRating = PremiumReportGenerator.calculateHealthScore(
        4.5,
        50,
        true,
        true,
        0.5
      );
      const mediumRating = PremiumReportGenerator.calculateHealthScore(
        3.5,
        50,
        true,
        true,
        0.5
      );
      const lowRating = PremiumReportGenerator.calculateHealthScore(
        2.5,
        50,
        true,
        true,
        0.5
      );

      expect(highRating.breakdown.infraestrutura).toBeGreaterThan(
        mediumRating.breakdown.infraestrutura
      );
      expect(mediumRating.breakdown.infraestrutura).toBeGreaterThan(
        lowRating.breakdown.infraestrutura
      );
    });

    it('should calculate experiencia_hospede based on content quality', () => {
      const withContent = PremiumReportGenerator.calculateHealthScore(
        4.0,
        50,
        true,
        true,
        0.5
      );
      const withoutContent = PremiumReportGenerator.calculateHealthScore(
        4.0,
        50,
        false,
        false,
        0.5
      );

      expect(withContent.breakdown.experiencia_hospede).toBeGreaterThan(
        withoutContent.breakdown.experiencia_hospede
      );
    });

    it('should calculate gestao_reputacao based on review count', () => {
      const manyReviews = PremiumReportGenerator.calculateHealthScore(
        4.0,
        100,
        true,
        true,
        0.5
      );
      const fewReviews = PremiumReportGenerator.calculateHealthScore(
        4.0,
        3,
        true,
        true,
        0.5
      );

      expect(manyReviews.breakdown.gestao_reputacao).toBeGreaterThan(
        fewReviews.breakdown.gestao_reputacao
      );
    });

    it('should sum all breakdown components to total', () => {
      const result = PremiumReportGenerator.calculateHealthScore(
        4.0,
        50,
        true,
        true,
        0.8
      );

      const calculatedTotal = Math.round(
        result.breakdown.classificacao +
          result.breakdown.presenca_digital +
          result.breakdown.performance_financeira +
          result.breakdown.infraestrutura +
          result.breakdown.experiencia_hospede +
          result.breakdown.gestao_reputacao
      );

      expect(result.total).toBe(calculatedTotal);
    });
  });

  describe('generatePremiumHTML', () => {
    const mockAnalysisData = {
      health_score: {
        total: 85,
        breakdown: {
          classificacao: 22,
          presenca_digital: 18,
          performance_financeira: 16,
          infraestrutura: 12,
          experiencia_hospede: 8,
          gestao_reputacao: 9,
        },
        categoria: 'excelente' as const,
      },
      diagnostico_inicial: {
        resumo_executivo: 'Test summary',
        problemas_criticos: ['Problem 1'],
        pontos_fortes: ['Strength 1'],
        receita_anual_estimada: '€50,000',
        taxa_ocupacao_estimada: 75,
        preco_medio_noite: '€150',
        analise_competitiva: {
          posicao_mercado: 'Strong position',
          gap_preco: '10%',
          gap_qualidade: '5%',
        },
      },
      reputacao_reviews: {
        situacao_atual: 'Good',
        comentarios_positivos: ['Great location'],
        comentarios_negativos: ['Slow wifi'],
        estrategia_melhoria: ['Improve wifi'],
        meta_6_meses: {
          classificacao_objetivo: 4.8,
          reviews_objetivo: 200,
        },
      },
      infraestrutura_conforto: {
        intervencoes_prioritarias: [
          {
            problema: 'Old furniture',
            solucao: 'Replace furniture',
            investimento: '€5,000',
            prioridade: 'alta' as const,
            impacto: 'High',
          },
        ],
        cronograma: {
          semana_1_2: ['Task 1'],
          semana_3_4: ['Task 2'],
          mes_2: ['Task 3'],
          mes_3: ['Task 4'],
        },
      },
      estrategia_precos: {
        analise_atual: 'Current analysis',
        precos_dinamicos: {
          alta_epoca: {
            atual: '€200',
            sugerido: '€250',
            justificacao: 'High demand',
          },
          epoca_media: {
            atual: '€150',
            sugerido: '€180',
            justificacao: 'Medium demand',
          },
          baixa_epoca: {
            atual: '€100',
            sugerido: '€120',
            justificacao: 'Low demand',
          },
          fins_semana: {
            atual: '€180',
            sugerido: '€220',
            justificacao: 'Weekend premium',
          },
          dias_semana: {
            atual: '€120',
            sugerido: '€140',
            justificacao: 'Weekday rates',
          },
        },
        estrategias_complementares: ['Strategy 1'],
      },
      presenca_online: {
        auditoria_atual: {
          qualidade_fotos: 8,
          qualidade_descricao: 7,
          plataformas_ativas: ['Booking.com', 'Airbnb'],
        },
        plano_otimizacao: {
          fotografia: ['Better photos'],
          descricao: ['Better description'],
          expansao_canais: ['New channels'],
        },
      },
      experiencia_hospede: {
        welcome_kit: ['Item 1'],
        parcerias_estrategicas: [
          {
            tipo: 'Restaurant',
            beneficio_hospede: 'Discount',
            beneficio_propriedade: 'Commission',
          },
        ],
        automacao_comunicacao: ['Auto message'],
      },
      kpis_acompanhamento: {
        metricas_principais: {
          taxa_ocupacao: { atual: '70%', meta: '85%' },
          adr: { atual: '€150', meta: '€180' },
          revpar: { atual: '€105', meta: '€153' },
          guest_score: { atual: '4.5', meta: '4.8' },
        },
        objetivos_12_meses: {
          classificacao: '4.8/5',
          ocupacao: '85%',
          crescimento_receita: '30%',
          novas_reviews: '150',
        },
      },
      property_data: {
        property_name: 'Test Property',
        location: 'Lisbon',
        property_type: 'Apartment',
        rating: 4.5,
        platform: 'booking',
      },
    };

    it('should generate HTML with property name', () => {
      const html = PremiumReportGenerator.generatePremiumHTML(mockAnalysisData);

      expect(html).toContain('Test Property');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should include health score in HTML', () => {
      const html = PremiumReportGenerator.generatePremiumHTML(mockAnalysisData);

      expect(html).toContain('85');
      expect(html).toContain('score-excelente');
    });

    it('should include CSS styling', () => {
      const html = PremiumReportGenerator.generatePremiumHTML(mockAnalysisData);

      expect(html).toContain('<style>');
      expect(html).toContain('.score-excelente');
      expect(html).toContain('.score-bom');
      expect(html).toContain('.score-medio');
      expect(html).toContain('.score-critico');
    });

    it('should include resumo executivo', () => {
      const html = PremiumReportGenerator.generatePremiumHTML(mockAnalysisData);

      expect(html).toContain('Test summary');
    });

    it('should replace all template variables', () => {
      const html = PremiumReportGenerator.generatePremiumHTML(mockAnalysisData);

      // Should not contain any unreplaced template variables
      expect(html).not.toContain('{{property_name}}');
      expect(html).not.toContain('{{health_score_total}}');
    });

    it('should format current date', () => {
      const html = PremiumReportGenerator.generatePremiumHTML(mockAnalysisData);

      // Should contain a date (check for common date patterns)
      expect(html).toMatch(/\d{4}/); // Year
    });

    it('should handle different health score categories', () => {
      const categories = ['excelente', 'bom', 'medio', 'critico'] as const;

      categories.forEach((categoria) => {
        const data = {
          ...mockAnalysisData,
          health_score: {
            ...mockAnalysisData.health_score,
            categoria,
          },
        };

        const html = PremiumReportGenerator.generatePremiumHTML(data);
        expect(html).toContain(`score-${categoria}`);
      });
    });

    it('should include pricing strategy data', () => {
      const html = PremiumReportGenerator.generatePremiumHTML(mockAnalysisData);

      expect(html).toContain('€250');
      expect(html).toContain('High demand');
      expect(html).toContain('Weekend premium');
    });

    it('should include KPI metrics', () => {
      const html = PremiumReportGenerator.generatePremiumHTML(mockAnalysisData);

      expect(html).toContain('70%');
      expect(html).toContain('85%');
      expect(html).toContain('€150');
      expect(html).toContain('€180');
    });
  });
});

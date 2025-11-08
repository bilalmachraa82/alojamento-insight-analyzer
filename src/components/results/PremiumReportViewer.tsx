/**
 * PremiumReportViewer Component
 *
 * Performance Optimization: Wrapped with React.memo to prevent unnecessary re-renders
 * This component only re-renders when analysisData props change
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

interface PremiumAnalysisData {
  health_score: {
    total: number;
    breakdown: {
      classificacao: number;
      presenca_digital: number;
      performance_financeira: number;
      infraestrutura: number;
      experiencia_hospede: number;
      gestao_reputacao: number;
    };
    categoria: 'excelente' | 'bom' | 'medio' | 'critico';
  };
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
  estrategia_precos: {
    analise_atual: string;
    precos_dinamicos: {
      alta_epoca: { atual: string; sugerido: string; justificacao: string };
      epoca_media: { atual: string; sugerido: string; justificacao: string };
      baixa_epoca: { atual: string; sugerido: string; justificacao: string };
    };
    estrategias_complementares: string[];
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

interface PremiumReportViewerProps {
  analysisData: PremiumAnalysisData;
}

const PremiumReportViewer: React.FC<PremiumReportViewerProps> = ({ analysisData }) => {
  const getHealthScoreColor = (categoria: string) => {
    switch (categoria) {
      case 'excelente': return 'bg-green-500';
      case 'bom': return 'bg-yellow-500';
      case 'medio': return 'bg-orange-500';
      case 'critico': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthScoreText = (categoria: string) => {
    switch (categoria) {
      case 'excelente': return 'Excelente';
      case 'bom': return 'Bom';
      case 'medio': return 'Médio';
      case 'critico': return 'Crítico';
      default: return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Health Score Section */}
      <Card className="border-2 border-gradient-to-r from-brand-pink to-brand-blue">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Health Score Global</CardTitle>
          <div className="flex justify-center items-center gap-4">
            <div className={`w-24 h-24 rounded-full ${getHealthScoreColor(analysisData.health_score.categoria)} flex items-center justify-center text-white text-2xl font-bold`}>
              {analysisData.health_score.total}
            </div>
            <div>
              <Badge variant="outline" className="text-lg p-2">
                {getHealthScoreText(analysisData.health_score.categoria)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Classificação</p>
              <Progress value={(analysisData.health_score.breakdown.classificacao / 25) * 100} className="mb-2" />
              <p className="text-xs text-gray-500">{analysisData.health_score.breakdown.classificacao}/25</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Presença Digital</p>
              <Progress value={(analysisData.health_score.breakdown.presenca_digital / 20) * 100} className="mb-2" />
              <p className="text-xs text-gray-500">{analysisData.health_score.breakdown.presenca_digital}/20</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Performance Financeira</p>
              <Progress value={(analysisData.health_score.breakdown.performance_financeira / 20) * 100} className="mb-2" />
              <p className="text-xs text-gray-500">{analysisData.health_score.breakdown.performance_financeira}/20</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Infraestrutura</p>
              <Progress value={(analysisData.health_score.breakdown.infraestrutura / 15) * 100} className="mb-2" />
              <p className="text-xs text-gray-500">{analysisData.health_score.breakdown.infraestrutura}/15</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Experiência Hóspede</p>
              <Progress value={(analysisData.health_score.breakdown.experiencia_hospede / 10) * 100} className="mb-2" />
              <p className="text-xs text-gray-500">{analysisData.health_score.breakdown.experiencia_hospede}/10</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Gestão Reputação</p>
              <Progress value={(analysisData.health_score.breakdown.gestao_reputacao / 10) * 100} className="mb-2" />
              <p className="text-xs text-gray-500">{analysisData.health_score.breakdown.gestao_reputacao}/10</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed mb-4">{analysisData.diagnostico_inicial.resumo_executivo}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analysisData.diagnostico_inicial.receita_anual_estimada}</div>
              <div className="text-sm text-gray-600">Receita Anual Estimada</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analysisData.diagnostico_inicial.taxa_ocupacao_estimada}%</div>
              <div className="text-sm text-gray-600">Taxa de Ocupação</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{analysisData.diagnostico_inicial.preco_medio_noite}</div>
              <div className="text-sm text-gray-600">Preço Médio/Noite</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths and Critical Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Pontos Fortes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {/* Using composite key with content hash for stable keys */}
              {analysisData.diagnostico_inicial.pontos_fortes.map((ponto, index) => (
                <li key={`ponto-forte-${ponto.slice(0, 30)}-${index}`} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-sm">{ponto}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Problemas Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {/* Using composite key with content hash for stable keys */}
              {analysisData.diagnostico_inicial.problemas_criticos.map((problema, index) => (
                <li key={`problema-critico-${problema.slice(0, 30)}-${index}`} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-sm">{problema}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-gray-700 mb-4">{analysisData.reputacao_reviews.situacao_atual}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-600 mb-2">Comentários Positivos</h4>
              <ul className="space-y-1">
                {/* Using composite key with content snippet for stable keys (top 3 comments) */}
                {analysisData.reputacao_reviews.comentarios_positivos.slice(0, 3).map((comentario, index) => (
                  <li key={`comentario-positivo-${comentario.slice(0, 30)}-${index}`} className="text-sm text-gray-600">• {comentario}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-red-600 mb-2">Pontos de Melhoria</h4>
              <ul className="space-y-1">
                {/* Using composite key with content snippet for stable keys (top 3 comments) */}
                {analysisData.reputacao_reviews.comentarios_negativos.slice(0, 3).map((comentario, index) => (
                  <li key={`comentario-negativo-${comentario.slice(0, 30)}-${index}`} className="text-sm text-gray-600">• {comentario}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-700 mb-2">Meta para 6 Meses</h4>
            <p className="text-sm text-blue-600">
              Atingir classificação de <strong>{analysisData.reputacao_reviews.meta_6_meses.classificacao_objetivo}/5</strong> com 
              pelo menos <strong>{analysisData.reputacao_reviews.meta_6_meses.reviews_objetivo}</strong> avaliações adicionais.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Estratégia de Preços</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">{analysisData.estrategia_precos.analise_atual}</p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">Período</th>
                  <th className="border border-gray-300 p-2 text-left">Atual</th>
                  <th className="border border-gray-300 p-2 text-left">Sugerido</th>
                  <th className="border border-gray-300 p-2 text-left">Justificação</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-medium">Alta Época</td>
                  <td className="border border-gray-300 p-2">{analysisData.estrategia_precos.precos_dinamicos.alta_epoca.atual}</td>
                  <td className="border border-gray-300 p-2 text-green-600 font-medium">{analysisData.estrategia_precos.precos_dinamicos.alta_epoca.sugerido}</td>
                  <td className="border border-gray-300 p-2 text-sm">{analysisData.estrategia_precos.precos_dinamicos.alta_epoca.justificacao}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-medium">Época Média</td>
                  <td className="border border-gray-300 p-2">{analysisData.estrategia_precos.precos_dinamicos.epoca_media.atual}</td>
                  <td className="border border-gray-300 p-2 text-green-600 font-medium">{analysisData.estrategia_precos.precos_dinamicos.epoca_media.sugerido}</td>
                  <td className="border border-gray-300 p-2 text-sm">{analysisData.estrategia_precos.precos_dinamicos.epoca_media.justificacao}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-medium">Baixa Época</td>
                  <td className="border border-gray-300 p-2">{analysisData.estrategia_precos.precos_dinamicos.baixa_epoca.atual}</td>
                  <td className="border border-gray-300 p-2 text-green-600 font-medium">{analysisData.estrategia_precos.precos_dinamicos.baixa_epoca.sugerido}</td>
                  <td className="border border-gray-300 p-2 text-sm">{analysisData.estrategia_precos.precos_dinamicos.baixa_epoca.justificacao}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {analysisData.estrategia_precos.estrategias_complementares.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Estratégias Complementares</h4>
              <ul className="space-y-1">
                {/* Using composite key with content snippet for stable keys */}
                {analysisData.estrategia_precos.estrategias_complementares.map((estrategia, index) => (
                  <li key={`estrategia-complementar-${estrategia.slice(0, 30)}-${index}`} className="text-sm text-gray-600">• {estrategia}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPIs */}
      <Card>
        <CardHeader>
          <CardTitle>KPIs e Metas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-700">{analysisData.kpis_acompanhamento.metricas_principais.taxa_ocupacao.atual}</div>
              <div className="text-xs text-gray-500">Taxa Ocupação Atual</div>
              <div className="text-sm text-green-600 mt-1">Meta: {analysisData.kpis_acompanhamento.metricas_principais.taxa_ocupacao.meta}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-700">{analysisData.kpis_acompanhamento.metricas_principais.adr.atual}</div>
              <div className="text-xs text-gray-500">ADR Atual</div>
              <div className="text-sm text-green-600 mt-1">Meta: {analysisData.kpis_acompanhamento.metricas_principais.adr.meta}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-700">{analysisData.kpis_acompanhamento.metricas_principais.revpar.atual}</div>
              <div className="text-xs text-gray-500">RevPAR Atual</div>
              <div className="text-sm text-green-600 mt-1">Meta: {analysisData.kpis_acompanhamento.metricas_principais.revpar.meta}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-700">{analysisData.kpis_acompanhamento.metricas_principais.guest_score.atual}</div>
              <div className="text-xs text-gray-500">Guest Score Atual</div>
              <div className="text-sm text-green-600 mt-1">Meta: {analysisData.kpis_acompanhamento.metricas_principais.guest_score.meta}</div>
            </div>
          </div>

          <div className="bg-brand-blue/10 p-4 rounded-lg">
            <h4 className="font-semibold text-brand-blue mb-2">Objetivos para 12 Meses</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>• {analysisData.kpis_acompanhamento.objetivos_12_meses.classificacao}</div>
              <div>• {analysisData.kpis_acompanhamento.objetivos_12_meses.ocupacao}</div>
              <div>• {analysisData.kpis_acompanhamento.objetivos_12_meses.crescimento_receita}</div>
              <div>• {analysisData.kpis_acompanhamento.objetivos_12_meses.novas_reviews}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Performance optimization: Memoize component with custom comparison function
// Only re-render if the analysisData object reference changes or key fields are different
export default React.memo(PremiumReportViewer, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render), false if different (re-render)

  // If references are the same, no need to re-render
  if (prevProps.analysisData === nextProps.analysisData) {
    return true;
  }

  // Deep comparison of critical fields that affect rendering
  const prevData = prevProps.analysisData;
  const nextData = nextProps.analysisData;

  // Compare health score (main metric)
  if (prevData.health_score?.total !== nextData.health_score?.total ||
      prevData.health_score?.categoria !== nextData.health_score?.categoria) {
    return false;
  }

  // Compare property identity
  if (prevData.property_data?.property_name !== nextData.property_data?.property_name ||
      prevData.property_data?.rating !== nextData.property_data?.rating) {
    return false;
  }

  // Compare key financial metrics
  if (prevData.diagnostico_inicial?.receita_anual_estimada !== nextData.diagnostico_inicial?.receita_anual_estimada ||
      prevData.diagnostico_inicial?.taxa_ocupacao_estimada !== nextData.diagnostico_inicial?.taxa_ocupacao_estimada) {
    return false;
  }

  // If all critical fields are the same, skip re-render
  return true;
});
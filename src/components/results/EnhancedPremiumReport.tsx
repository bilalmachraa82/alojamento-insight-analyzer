/**
 * Enhanced Premium Report Viewer
 * Integrates real KPI data from analytics system
 */

import React from "react";
import PremiumReportViewer from "./PremiumReportViewer";
import { useKPIsSummary, useLatestBenchmark } from "@/hooks/analytics";
import { Loader2 } from "lucide-react";

interface EnhancedPremiumReportProps {
  propertyId: string;
  analysisData: any; // Original analysis data from diagnostic
}

export const EnhancedPremiumReport: React.FC<EnhancedPremiumReportProps> = ({
  propertyId,
  analysisData,
}) => {
  // Get last 30 days of data
  const dateRange = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  };

  // Fetch real KPI data
  const { data: kpiSummary, isLoading: kpiLoading } = useKPIsSummary({
    propertyId,
    dateRange,
    enabled: !!propertyId,
  });

  const { data: benchmark, isLoading: benchmarkLoading } = useLatestBenchmark(propertyId);

  // Show loading state
  if (kpiLoading || benchmarkLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading analytics data...</span>
      </div>
    );
  }

  // Enhance analysis data with real KPIs
  const enhancedData = {
    ...analysisData,
    kpis_acompanhamento: {
      metricas_principais: {
        taxa_ocupacao: {
          atual: kpiSummary?.avg_occupancy 
            ? `${kpiSummary.avg_occupancy.toFixed(1)}%` 
            : analysisData.kpis_acompanhamento?.metricas_principais?.taxa_ocupacao?.atual || "N/A",
          meta: analysisData.kpis_acompanhamento?.metricas_principais?.taxa_ocupacao?.meta || "85%",
        },
        adr: {
          atual: kpiSummary?.avg_adr 
            ? `€${kpiSummary.avg_adr.toFixed(0)}` 
            : analysisData.kpis_acompanhamento?.metricas_principais?.adr?.atual || "N/A",
          meta: analysisData.kpis_acompanhamento?.metricas_principais?.adr?.meta || "€150",
        },
        revpar: {
          atual: kpiSummary?.avg_revpar 
            ? `€${kpiSummary.avg_revpar.toFixed(0)}` 
            : analysisData.kpis_acompanhamento?.metricas_principais?.revpar?.atual || "N/A",
          meta: analysisData.kpis_acompanhamento?.metricas_principais?.revpar?.meta || "€120",
        },
        guest_score: {
          atual: analysisData.property_data?.rating 
            ? `${analysisData.property_data.rating.toFixed(1)}/5.0` 
            : analysisData.kpis_acompanhamento?.metricas_principais?.guest_score?.atual || "N/A",
          meta: analysisData.kpis_acompanhamento?.metricas_principais?.guest_score?.meta || "4.8/5.0",
        },
      },
      objetivos_12_meses: analysisData.kpis_acompanhamento?.objetivos_12_meses || {
        classificacao: "Atingir 4.8+ estrelas",
        ocupacao: "Aumentar para 85%+",
        crescimento_receita: "Crescimento de 20%",
        novas_reviews: "50+ reviews positivos",
      },
    },
    diagnostico_inicial: {
      ...analysisData.diagnostico_inicial,
      receita_anual_estimada: kpiSummary?.total_revenue 
        ? `€${(kpiSummary.total_revenue * 12).toLocaleString('pt-PT')}` 
        : analysisData.diagnostico_inicial?.receita_anual_estimada || "N/A",
      taxa_ocupacao_estimada: kpiSummary?.avg_occupancy 
        ? Math.round(kpiSummary.avg_occupancy)
        : analysisData.diagnostico_inicial?.taxa_ocupacao_estimada || 0,
      preco_medio_noite: kpiSummary?.avg_adr 
        ? `€${kpiSummary.avg_adr.toFixed(0)}` 
        : analysisData.diagnostico_inicial?.preco_medio_noite || "N/A",
      analise_competitiva: {
        ...analysisData.diagnostico_inicial?.analise_competitiva,
        posicao_mercado: benchmark?.market_position 
          ? getMarketPositionText(benchmark.market_position, benchmark.rgi)
          : analysisData.diagnostico_inicial?.analise_competitiva?.posicao_mercado || "N/A",
      },
    },
  };

  return <PremiumReportViewer analysisData={enhancedData} />;
};

function getMarketPositionText(position: string, rgi: number): string {
  const rgiText = `RGI: ${rgi?.toFixed(0) || 'N/A'}`;
  
  switch (position) {
    case 'leader':
      return `🏆 Líder de Mercado (${rgiText}) - Propriedade está a superar significativamente a concorrência`;
    case 'competitive':
      return `✅ Competitivo (${rgiText}) - Propriedade está ao nível do mercado`;
    case 'lagging':
      return `⚠️ Abaixo do Mercado (${rgiText}) - Propriedade está a ficar atrás da concorrência`;
    case 'distressed':
      return `🔴 Crítico (${rgiText}) - Propriedade está muito abaixo do mercado`;
    default:
      return `Dados de mercado insuficientes (${rgiText})`;
  }
}

export default EnhancedPremiumReport;

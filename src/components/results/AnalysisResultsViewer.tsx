
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnalysisSection from "./AnalysisSection";
import PerformanceMetrics from "./PerformanceMetrics";
import RecommendationsList from "./RecommendationsList";
import PricingStrategy from "./PricingStrategy";
import CompetitorAnalysis from "./CompetitorAnalysis";
import { useAnalysisData } from "@/hooks/useAnalysisData";

interface AnalysisResultsViewerProps {
  analysisData: any;
}

const AnalysisResultsViewer: React.FC<AnalysisResultsViewerProps> = ({ analysisData }) => {
  const { performanceMetrics, recommendations, pricingStrategy, competitorAnalysis } = useAnalysisData(analysisData);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-1 md:grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="pricing">Estratégia de Preços</TabsTrigger>
          <TabsTrigger value="competitors">Análise Competitiva</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-4">
          <div className="space-y-6">
            <AnalysisSection title="Métricas de Desempenho" initiallyExpanded={true}>
              <PerformanceMetrics {...performanceMetrics} />
            </AnalysisSection>
            
            <AnalysisSection title="Recomendações Principais" initiallyExpanded={true}>
              <RecommendationsList recommendations={recommendations} />
            </AnalysisSection>
          </div>
        </TabsContent>
        
        <TabsContent value="recommendations" className="pt-4">
          <RecommendationsList recommendations={recommendations} expanded={true} />
        </TabsContent>
        
        <TabsContent value="pricing" className="pt-4">
          <PricingStrategy {...pricingStrategy} />
        </TabsContent>
        
        <TabsContent value="competitors" className="pt-4">
          <CompetitorAnalysis {...competitorAnalysis} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisResultsViewer;

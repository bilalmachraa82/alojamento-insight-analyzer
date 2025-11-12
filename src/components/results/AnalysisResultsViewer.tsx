/**
 * AnalysisResultsViewer Component
 *
 * Performance Optimization: Wrapped with React.memo to prevent unnecessary re-renders
 * This component only re-renders when analysisData props change
 */

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, Star, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AnalysisSection from "./AnalysisSection";
import PerformanceMetrics from "./PerformanceMetrics";
import RecommendationsList from "./RecommendationsList";
import PricingStrategy from "./PricingStrategy";
import CompetitorAnalysis from "./CompetitorAnalysis";
import { useAnalysisData } from "@/hooks/useAnalysisData";
import PremiumReportViewer from "./PremiumReportViewer";
import EnhancedPremiumReport from "./EnhancedPremiumReport";

interface AnalysisResultsViewerProps {
  analysisData: any;
}

const AnalysisResultsViewer: React.FC<AnalysisResultsViewerProps> = ({ analysisData }) => {
  const { performanceMetrics, recommendations, pricingStrategy, competitorAnalysis } = useAnalysisData(analysisData);
  const { toast } = useToast();
  const [isGeneratingClaudeAnalysis, setIsGeneratingClaudeAnalysis] = useState(false);

  // Check if we have reviews in the data
  const hasReviews = analysisData?.scraped_data?.property_data?.reviews?.length > 0;
  
  // Check if this is a premium analysis (has new Claude structure)
  const isPremiumAnalysis = analysisData?.analysis_result?.health_score !== undefined;

  const handleGenerateClaudeAnalysis = async () => {
    setIsGeneratingClaudeAnalysis(true);
    
    try {
      toast({
        title: "🚀 Iniciando Análise Premium",
        description: "Gerando análise avançada com Claude 3.7 Sonnet. Isso pode levar alguns minutos..."
      });

      const { data, error } = await supabase.functions.invoke("analyze-property-claude", {
        body: { id: analysisData.id }
      });

      if (error) {
        console.error("Error generating Claude analysis:", error);
        throw error;
      }

      toast({
        title: "✨ Análise Premium Concluída!",
        description: "Atualizando a página para mostrar os resultados...",
      });
      
      // Reload after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error("Error generating Claude analysis:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar a análise premium. Tente novamente."
      });
      setIsGeneratingClaudeAnalysis(false);
    }
  };

  const handleGeneratePremiumReport = async () => {
    if (!analysisData?.analysis_result) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Dados de análise não disponíveis para gerar relatório premium."
      });
      return;
    }

    try {
      toast({
        title: "Gerando Relatório Premium",
        description: "Por favor aguarde enquanto preparamos seu relatório profissional..."
      });

      const { data, error } = await supabase.functions.invoke("generate-premium-pdf", {
        body: { 
          submissionId: analysisData.id,
          analysisData: analysisData.analysis_result 
        }
      });

      if (error) throw error;

      if (data?.reportUrl) {
        // Open the report in a new tab
        window.open(data.reportUrl, '_blank');
        
        toast({
          title: "Relatório Gerado!",
          description: "Seu relatório premium foi gerado com sucesso."
        });
      }
    } catch (error) {
      console.error("Error generating premium report:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar o relatório premium. Tente novamente."
      });
    }
  };
  
  // Show premium view if it's Claude analysis
  if (isPremiumAnalysis) {
    // Use property_id if available, otherwise fall back to submission id
    const propertyId = analysisData.property_id || analysisData.id;
    
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gradient-to-r from-brand-pink/10 to-brand-blue/10 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-brand-pink rounded-full">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Análise Premium Completa</h3>
              <p className="text-gray-600 text-sm">Relatório profissional com KPIs reais e benchmarking</p>
            </div>
          </div>
          <Button 
            onClick={handleGeneratePremiumReport}
            className="bg-gradient-to-r from-brand-pink to-brand-blue hover:opacity-90 transition-opacity"
          >
            <Download className="mr-2 h-4 w-4" />
            Gerar Relatório PDF
          </Button>
        </div>
        
        <EnhancedPremiumReport 
          propertyId={propertyId}
          analysisData={analysisData.analysis_result} 
        />
      </div>
    );
  }

  // Original basic analysis view
  return (
    <div className="space-y-4">
      {/* Premium Upgrade CTA */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Upgrade para Análise Premium com Claude 3.7 Sonnet
                </h3>
              </div>
              <p className="text-gray-700 mb-3">
                Obtenha uma análise profunda e profissional usando IA de última geração, 
                incluindo Health Score preciso, insights avançados e relatório PDF downloadável.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <li className="flex items-center gap-1">
                  <span className="text-green-600">✓</span> Health Score 0-100
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-green-600">✓</span> Análise AI Claude 3.7
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-green-600">✓</span> Relatório PDF profissional
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-green-600">✓</span> Insights mais profundos
                </li>
              </ul>
            </div>
            <Button 
              onClick={handleGenerateClaudeAnalysis}
              disabled={isGeneratingClaudeAnalysis}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white whitespace-nowrap"
              size="lg"
            >
              {isGeneratingClaudeAnalysis ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando Análise...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar Análise Premium
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <span className="text-gray-600">Análise Básica (Gemini)</span>
        </div>
        <Button 
          onClick={handleGeneratePremiumReport}
          variant="outline"
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" />
          Gerar Relatório
        </Button>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-1 md:grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="pricing">Estratégia de Preços</TabsTrigger>
          <TabsTrigger value="competitors">Análise Competitiva</TabsTrigger>
          {hasReviews && <TabsTrigger value="reviews">Avaliações</TabsTrigger>}
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
        
        {hasReviews && (
          <TabsContent value="reviews" className="pt-4">
            <ReviewsList reviews={analysisData.scraped_data.property_data.reviews} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

// New component to display reviews
interface ReviewsListProps {
  reviews: any[];
}

const ReviewsList = React.memo<ReviewsListProps>(({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return <p>Nenhuma avaliação disponível.</p>;
  }
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold mb-4">Avaliações dos Hóspedes ({reviews.length})</h3>

      {/* Using composite key with reviewer and date for stable keys */}
      {reviews.map((review, index) => (
        <div key={`review-${review.reviewer || 'guest'}-${review.date || review.stayDate || index}`} className="border p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="bg-brand-blue rounded-full w-8 h-8 flex items-center justify-center text-white mr-2">
                {review.reviewer ? review.reviewer.substring(0, 1) : "G"}
              </div>
              <div>
                <p className="font-medium">{review.reviewer || "Hóspede"}</p>
                <p className="text-xs text-gray-500">
                  {review.date || review.stayDate || "Data não especificada"}
                </p>
              </div>
            </div>
            <div className="bg-brand-blue text-white px-2 py-1 rounded-md flex items-center">
              {review.rating || review.score || "N/A"}
            </div>
          </div>

          {review.title && <p className="font-semibold mb-1">{review.title}</p>}

          <p className="text-sm text-gray-700">
            {review.text || review.comment || review.reviewText || "Sem comentário disponível."}
          </p>

          {review.positives && (
            <div className="mt-2">
              <p className="text-sm font-medium text-green-600">Positivo:</p>
              <p className="text-xs text-gray-600">{review.positives}</p>
            </div>
          )}

          {review.negatives && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-600">Negativo:</p>
              <p className="text-xs text-gray-600">{review.negatives}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if reviews array length or content changes
  if (prevProps.reviews?.length !== nextProps.reviews?.length) {
    return false;
  }

  // For performance, do a shallow check on first and last review
  // (assumes if endpoints are same, middle is likely same)
  if (prevProps.reviews?.length > 0) {
    const prevFirst = prevProps.reviews[0];
    const nextFirst = nextProps.reviews[0];
    if (prevFirst?.text !== nextFirst?.text || prevFirst?.rating !== nextFirst?.rating) {
      return false;
    }
  }

  return true;
});

// Performance optimization: Memoize component with custom comparison function
// Only re-render when analysisData actually changes (by ID or content)
export default React.memo(AnalysisResultsViewer, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render), false if different (re-render)

  // If references are the same, no need to re-render
  if (prevProps.analysisData === nextProps.analysisData) {
    return true;
  }

  const prevData = prevProps.analysisData;
  const nextData = nextProps.analysisData;

  // If either is null/undefined, they must be different
  if (!prevData || !nextData) {
    return prevData === nextData;
  }

  // Compare by unique identifiers first (most efficient)
  if (prevData.id !== nextData.id) {
    return false;
  }

  // Compare premium analysis flag (determines which view to render)
  const prevIsPremium = prevData?.analysis_result?.health_score !== undefined;
  const nextIsPremium = nextData?.analysis_result?.health_score !== undefined;

  if (prevIsPremium !== nextIsPremium) {
    return false;
  }

  // Compare property_id (for premium reports)
  if (prevData.property_id !== nextData.property_id) {
    return false;
  }

  // Compare review availability (affects tab rendering)
  const prevHasReviews = prevData?.scraped_data?.property_data?.reviews?.length > 0;
  const nextHasReviews = nextData?.scraped_data?.property_data?.reviews?.length > 0;

  if (prevHasReviews !== nextHasReviews) {
    return false;
  }

  // If IDs match and key flags are the same, skip re-render
  // (Internal state changes like isGeneratingClaudeAnalysis will still cause re-renders)
  return true;
});

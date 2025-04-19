
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

  // Check if we have reviews in the data
  const hasReviews = analysisData?.scraped_data?.property_data?.reviews?.length > 0;
  
  return (
    <div className="space-y-4">
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

const ReviewsList: React.FC<ReviewsListProps> = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return <p>Nenhuma avaliação disponível.</p>;
  }
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold mb-4">Avaliações dos Hóspedes ({reviews.length})</h3>
      
      {reviews.map((review, index) => (
        <div key={index} className="border p-4 rounded-lg shadow-sm">
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
};

export default AnalysisResultsViewer;

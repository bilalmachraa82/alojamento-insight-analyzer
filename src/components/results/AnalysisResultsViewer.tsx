
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnalysisSection from "./AnalysisSection";
import PerformanceMetrics from "./PerformanceMetrics";
import RecommendationsList from "./RecommendationsList";
import PricingStrategy, { SeasonalPricing } from "./PricingStrategy";
import CompetitorAnalysis from "./CompetitorAnalysis";

interface AnalysisResultsViewerProps {
  analysisData: any;
}

const AnalysisResultsViewer: React.FC<AnalysisResultsViewerProps> = ({ analysisData }) => {
  // Default mock data in case the real data is not available yet
  const mockData = {
    propertyName: "Beach House Retreat",
    performanceMetrics: {
      occupancyRate: 72,
      averageRating: 4.7,
      reviewCount: 85,
      responseRate: 98,
      averageDailyRate: "€125",
      revenueGrowth: "+12%"
    },
    recommendations: [
      {
        category: "Listing Optimization",
        items: [
          "Add more high-quality photos of the kitchen area",
          "Update the property description to highlight the new amenities",
          "Respond to all guest reviews within 24 hours"
        ]
      },
      {
        category: "Pricing Strategy",
        items: [
          "Increase weekend rates by 15-20% during summer months",
          "Offer long-stay discounts for bookings over 7 nights",
          "Create special packages for holiday seasons"
        ]
      },
      {
        category: "Guest Experience",
        items: [
          "Provide a welcome basket with local products",
          "Create a digital guidebook with local attractions",
          "Upgrade bathroom amenities based on guest feedback"
        ]
      }
    ],
    pricingStrategy: {
      basePrice: "€125",
      currentAnalysis: "Your base price is 5% below the market average for similar properties in your area.",
      seasonalPricing: [
        {
          season: "high" as const,
          months: ["June", "July", "August"],
          price: 150,
          strategy: "15-25% above base rate"
        },
        {
          season: "medium" as const,
          months: ["April", "May", "September", "October"],
          price: 120,
          strategy: "5-10% above base rate"
        },
        {
          season: "low" as const,
          months: ["November", "December", "January", "February", "March"],
          price: 100,
          strategy: "10-20% below base rate"
        }
      ],
      specialEvents: {
        "New Year's Eve": "€200",
        "Local Festival (July 15-20)": "€180"
      },
      discountPolicies: {
        "Weekly Stay (7+ nights)": "10% discount",
        "Monthly Stay (28+ nights)": "25% discount",
        "Early Bird (60+ days)": "5% discount"
      },
      weeklyPrice: "€787 (10% discount applied)",
      monthlyPrice: "€2,625 (25% discount applied)",
      minStay: "2 nights (3 nights on weekends, 5 nights in high season)"
    },
    competitorAnalysis: {
      directCompetitors: [
        {
          name: "Sunset Beach Villa",
          price: "€135",
          rating: 4.8,
          strengths: "Pool, Beach Access, Modern Interior",
          weaknesses: "Smaller Space, Limited Parking"
        },
        {
          name: "Ocean View Apartment",
          price: "€115",
          rating: 4.5,
          strengths: "Lower Price, Great Location, Pet-Friendly",
          weaknesses: "Older Building, No Outdoor Space"
        },
        {
          name: "Paradise Retreat",
          price: "€145",
          rating: 4.9,
          strengths: "Luxury Amenities, Large Garden, Privacy",
          weaknesses: "Distance from Beach, Higher Price"
        }
      ],
      marketInsights: [
        "Properties with outdoor spaces command 12% higher prices in your area",
        "Families are the dominant guest type, looking for kid-friendly amenities",
        "Demand for workcation amenities has increased by 23% in the past year",
        "Properties offering experiences/packages see 15% higher occupancy rates"
      ]
    }
  };
  
  // Try to extract real data from the analysis result, fall back to mock data if not available
  const result = analysisData?.analysis_result || {};
  
  // Format and prepare data
  const performanceMetrics = result.performance_metrics || mockData.performanceMetrics;
  const recommendations = result.recommendations || mockData.recommendations;
  
  // Make sure seasonalPricing conforms to the expected format
  let formattedSeasonalPricing: SeasonalPricing[] = [];
  if (result.pricing_strategy?.seasonal_pricing) {
    formattedSeasonalPricing = result.pricing_strategy.seasonal_pricing.map((season: any) => ({
      season: (season.season.toLowerCase() || "medium") as "high" | "medium" | "low",
      months: season.months || [],
      price: season.price || 0,
      strategy: season.strategy || ""
    }));
  } else if (mockData.pricingStrategy.seasonalPricing) {
    formattedSeasonalPricing = mockData.pricingStrategy.seasonalPricing;
  }
  
  const pricingStrategy = {
    basePrice: result.pricing_strategy?.base_price || mockData.pricingStrategy.basePrice,
    currentAnalysis: result.pricing_strategy?.current_analysis || mockData.pricingStrategy.currentAnalysis,
    seasonalPricing: formattedSeasonalPricing,
    specialEvents: result.pricing_strategy?.special_events || mockData.pricingStrategy.specialEvents,
    discountPolicies: result.pricing_strategy?.discount_policies || mockData.pricingStrategy.discountPolicies,
    weeklyPrice: result.pricing_strategy?.weekly_price || mockData.pricingStrategy.weeklyPrice,
    monthlyPrice: result.pricing_strategy?.monthly_price || mockData.pricingStrategy.monthlyPrice,
    minStay: result.pricing_strategy?.min_stay || mockData.pricingStrategy.minStay
  };
  
  const competitorAnalysis = result.competitor_analysis || mockData.competitorAnalysis;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-1 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Strategy</TabsTrigger>
          <TabsTrigger value="competitors">Competitor Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-4">
          <div className="space-y-6">
            <AnalysisSection title="Performance Metrics" initiallyExpanded={true}>
              <PerformanceMetrics 
                occupancyRate={performanceMetrics.occupancyRate} 
                averageRating={performanceMetrics.averageRating}
                reviewCount={performanceMetrics.reviewCount}
                responseRate={performanceMetrics.responseRate}
                averageDailyRate={performanceMetrics.averageDailyRate}
                revenueGrowth={performanceMetrics.revenueGrowth}
              />
            </AnalysisSection>
            
            <AnalysisSection title="Key Recommendations" initiallyExpanded={true}>
              <RecommendationsList recommendations={recommendations} />
            </AnalysisSection>
          </div>
        </TabsContent>
        
        <TabsContent value="recommendations" className="pt-4">
          <RecommendationsList recommendations={recommendations} expanded={true} />
        </TabsContent>
        
        <TabsContent value="pricing" className="pt-4">
          <PricingStrategy 
            basePrice={pricingStrategy.basePrice}
            currentAnalysis={pricingStrategy.currentAnalysis}
            seasonalPricing={pricingStrategy.seasonalPricing}
            specialEvents={pricingStrategy.specialEvents}
            discountPolicies={pricingStrategy.discountPolicies}
            weeklyPrice={pricingStrategy.weeklyPrice}
            monthlyPrice={pricingStrategy.monthlyPrice}
            minStay={pricingStrategy.minStay}
          />
        </TabsContent>
        
        <TabsContent value="competitors" className="pt-4">
          <CompetitorAnalysis 
            directCompetitors={competitorAnalysis.directCompetitors}
            marketInsights={competitorAnalysis.marketInsights}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisResultsViewer;

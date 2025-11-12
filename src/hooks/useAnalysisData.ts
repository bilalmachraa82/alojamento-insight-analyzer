import { useMemo } from "react";
import { SeasonalPricing } from "@/components/results/PricingStrategy";

/**
 * Performance metrics for a property
 */
interface PerformanceMetrics {
  occupancyRate?: number;
  averageRating?: number;
  reviewCount?: number;
  responseRate?: number;
  averageDailyRate?: string | number;
  revenueGrowth?: string;
  [key: string]: unknown;
}

/**
 * Recommendation item with category and list of suggestions
 */
interface RecommendationCategory {
  category: string;
  items: string[];
}

/**
 * Raw seasonal pricing data from API
 */
interface RawSeasonalPricing {
  season?: string;
  months?: string[];
  price?: number;
  strategy?: string;
}

/**
 * Pricing strategy data structure
 */
interface PricingStrategyData {
  base_price?: string;
  current_analysis?: string;
  seasonal_pricing?: RawSeasonalPricing[];
  special_events?: Record<string, string> | null;
  discount_policies?: Record<string, string> | null;
  weekly_price?: string;
  monthly_price?: string;
  min_stay?: string;
}

/**
 * Competitor information
 */
interface Competitor {
  name: string;
  price: string;
  rating: number;
  strengths: string;
  weaknesses: string;
}

/**
 * Competitor analysis data
 */
interface CompetitorAnalysisData {
  directCompetitors?: Competitor[];
  marketInsights?: string[];
  direct_competitors?: Competitor[];
  market_insights?: string[];
}

/**
 * Initial diagnostic data (diagnostico_inicial)
 */
interface DiagnosticoInicial {
  taxa_ocupacao_estimada?: number;
  [key: string]: unknown;
}

/**
 * Complete analysis result structure
 */
interface AnalysisResult {
  property_data?: {
    property_name?: string;
    location?: string;
    property_type?: string;
    rating?: number;
  };
  performance_metrics?: PerformanceMetrics;
  recommendations?: RecommendationCategory[];
  pricing_strategy?: PricingStrategyData;
  competitor_analysis?: CompetitorAnalysisData;
  diagnostico_inicial?: DiagnosticoInicial;
  [key: string]: unknown;
}

/**
 * Main analysis data wrapper
 */
interface AnalysisData {
  analysis_result?: AnalysisResult;
}

export const useAnalysisData = (analysisData: AnalysisData | null) => {
  return useMemo(() => {
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
    
    // Check if diagnostico_inicial exists and contains occupancy rate
    if (result.diagnostico_inicial && typeof result.diagnostico_inicial.taxa_ocupacao_estimada === 'number') {
      if (!performanceMetrics.occupancyRate) {
        performanceMetrics.occupancyRate = result.diagnostico_inicial.taxa_ocupacao_estimada;
      }
    }
    
    // Make sure seasonalPricing conforms to the expected format
    let formattedSeasonalPricing: SeasonalPricing[] = [];
    if (result.pricing_strategy?.seasonal_pricing && Array.isArray(result.pricing_strategy.seasonal_pricing)) {
      formattedSeasonalPricing = result.pricing_strategy.seasonal_pricing.map((season: RawSeasonalPricing) => ({
        season: (season.season?.toLowerCase() || "medium") as "high" | "medium" | "low",
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

    return {
      performanceMetrics,
      recommendations,
      pricingStrategy,
      competitorAnalysis
    };
  }, [analysisData]);
};


import { supabase } from '@/integrations/supabase/client';
import type { Property, CompetitorAnalysis, MarketData } from '@/types/database';

const client: any = supabase;

export interface MarketInsights {
  averageDailyRate: number;
  occupancyRate: number;
  competitorCount: number;
  marketSaturation: 'low' | 'medium' | 'high';
  seasonalTrends: Record<string, number>;
  priceRecommendations: {
    suggested: number;
    range: { min: number; max: number };
    reasoning: string;
  };
}

export class MarketIntelligenceService {
  // Analyze local market for a property
  static async analyzeMarket(property: Property, location: string): Promise<MarketInsights> {
    console.log('[MarketIntelligenceService] Analyzing market for:', property.id, location);
    
    try {
      // Get existing market data for the location
      const { data: existingMarketData } = await client
        .from('market_data')
        .select('*')
        .ilike('location', `%${location}%`)
        .order('data_date', { ascending: false })
        .limit(10);

      // Get competitor properties in the same area
      const { data: competitors } = await client
        .from('properties')
        .select('*')
        .ilike('location', `%${location}%`)
        .eq('is_active', true)
        .neq('id', property.id)
        .limit(20);

      // Calculate market insights
      const insights = this.calculateMarketInsights(
        existingMarketData || [],
        competitors || [],
        property
      );

      // Store market data for future reference
      await this.storeMarketData(property.id, location, insights);

      return insights;
    } catch (error) {
      console.error('Error analyzing market:', error);
      // Return default insights if analysis fails
      return this.getDefaultMarketInsights();
    }
  }

  // Calculate insights from available data
  private static calculateMarketInsights(
    marketData: any[],
    competitors: Property[],
    currentProperty: Property
  ): MarketInsights {
    const competitorCount = competitors.length;
    
    // Calculate average rates from competitors (mock calculation)
    const rates = competitors
      .map(c => this.estimatePropertyRate(c))
      .filter(rate => rate > 0);
    
    const averageRate = rates.length > 0 
      ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length 
      : 100;

    // Estimate occupancy from market data
    const occupancyRates = marketData
      .map(d => d.occupancy_rate)
      .filter(rate => rate && rate > 0);
    
    const averageOccupancy = occupancyRates.length > 0
      ? occupancyRates.reduce((sum, rate) => sum + rate, 0) / occupancyRates.length
      : 70;

    // Determine market saturation
    const saturation = competitorCount > 15 ? 'high' : competitorCount > 8 ? 'medium' : 'low';

    // Generate seasonal trends (simplified)
    const seasonalTrends = {
      'spring': averageRate * 0.9,
      'summer': averageRate * 1.2,
      'fall': averageRate * 0.95,
      'winter': averageRate * 0.85
    };

    // Price recommendations
    const currentEstimate = this.estimatePropertyRate(currentProperty);
    const suggested = Math.round(averageRate * this.getPropertyMultiplier(currentProperty));
    
    return {
      averageDailyRate: Math.round(averageRate),
      occupancyRate: Math.round(averageOccupancy),
      competitorCount,
      marketSaturation: saturation,
      seasonalTrends,
      priceRecommendations: {
        suggested,
        range: {
          min: Math.round(suggested * 0.8),
          max: Math.round(suggested * 1.3)
        },
        reasoning: `Based on ${competitorCount} similar properties in the area, your property could be priced ${suggested > currentEstimate ? 'higher' : 'competitively'}.`
      }
    };
  }

  // Estimate property rate based on amenities and details
  private static estimatePropertyRate(property: Property): number {
    let baseRate = 80; // Base daily rate

    // Adjust based on property type
    const typeMultipliers = {
      'entire_place': 1.2,
      'private_room': 0.7,
      'shared_room': 0.4,
      'house': 1.3,
      'apartment': 1.0,
      'hotel': 0.9
    };

    const propertyType = property.property_type?.toLowerCase() || 'apartment';
    baseRate *= typeMultipliers[propertyType] || 1.0;

    // Adjust based on capacity
    if (property.max_guests) {
      baseRate += (property.max_guests - 2) * 15;
    }

    // Adjust based on bedrooms
    if (property.bedrooms) {
      baseRate += property.bedrooms * 20;
    }

    // Adjust based on amenities
    const amenities = Object.keys(property.amenities || {});
    const premiumAmenities = ['pool', 'wifi', 'kitchen', 'parking', 'air_conditioning'];
    const premiumCount = amenities.filter(a => 
      premiumAmenities.some(pa => a.toLowerCase().includes(pa))
    ).length;
    
    baseRate += premiumCount * 10;

    return Math.round(baseRate);
  }

  // Get property multiplier based on quality indicators
  private static getPropertyMultiplier(property: Property): number {
    let multiplier = 1.0;

    // More photos suggest better presentation
    if (property.photos && property.photos.length > 10) multiplier += 0.1;
    if (property.photos && property.photos.length > 20) multiplier += 0.05;

    // More amenities suggest higher quality
    const amenityCount = Object.keys(property.amenities || {}).length;
    if (amenityCount > 10) multiplier += 0.15;
    if (amenityCount > 20) multiplier += 0.1;

    // Recent activity suggests better management
    if (property.last_analyzed) {
      const daysSinceAnalysis = Math.floor(
        (Date.now() - new Date(property.last_analyzed).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceAnalysis < 30) multiplier += 0.05;
    }

    return Math.min(multiplier, 1.5); // Cap at 50% premium
  }

  // Store calculated market data
  private static async storeMarketData(propertyId: string, location: string, insights: MarketInsights) {
    try {
      await client
        .from('market_data')
        .insert({
          property_id: propertyId,
          location,
          average_daily_rate: insights.averageDailyRate,
          occupancy_rate: insights.occupancyRate,
          competitor_count: insights.competitorCount,
          market_saturation: insights.marketSaturation === 'high' ? 80 : insights.marketSaturation === 'medium' ? 50 : 20,
          seasonal_trends: insights.seasonalTrends,
          data_date: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error storing market data:', error);
    }
  }

  // Default insights for error cases
  private static getDefaultMarketInsights(): MarketInsights {
    return {
      averageDailyRate: 120,
      occupancyRate: 65,
      competitorCount: 5,
      marketSaturation: 'medium',
      seasonalTrends: {
        spring: 110,
        summer: 140,
        fall: 115,
        winter: 100
      },
      priceRecommendations: {
        suggested: 125,
        range: { min: 100, max: 160 },
        reasoning: 'Based on general market trends for similar properties.'
      }
    };
  }

  // Generate competitor analysis
  static async generateCompetitorAnalysis(
    property: Property,
    competitors: Property[]
  ): Promise<CompetitorAnalysis[]> {
    console.log('[MarketIntelligenceService] Generating competitor analysis for:', property.id);
    
    const analyses: CompetitorAnalysis[] = [];
    
    for (const competitor of competitors.slice(0, 5)) { // Analyze top 5 competitors
      const analysis = await this.analyzeCompetitor(property, competitor);
      analyses.push(analysis);
      
      // Store in database
      try {
        await client
          .from('competitor_analysis')
          .insert({
            property_id: property.id,
            competitor_name: competitor.name,
            competitor_url: competitor.property_url,
            price: this.estimatePropertyRate(competitor),
            rating: 4.2, // Mock rating - would come from scraped data
            review_count: 85, // Mock review count
            amenities: competitor.amenities,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            distance_km: 2.5 // Mock distance
          });
      } catch (error) {
        console.error('Error storing competitor analysis:', error);
      }
    }
    
    return analyses;
  }

  // Analyze individual competitor
  private static async analyzeCompetitor(
    property: Property,
    competitor: Property
  ): Promise<CompetitorAnalysis> {
    const myAmenities = Object.keys(property.amenities || {});
    const theirAmenities = Object.keys(competitor.amenities || {});
    
    const myRate = this.estimatePropertyRate(property);
    const theirRate = this.estimatePropertyRate(competitor);
    
    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    if (theirRate < myRate) strengths.push('Lower pricing');
    if (theirAmenities.length > myAmenities.length) strengths.push('More amenities');
    if (competitor.bedrooms && property.bedrooms && competitor.bedrooms > property.bedrooms) {
      strengths.push('More bedrooms');
    }
    
    if (theirRate > myRate) weaknesses.push('Higher pricing');
    if (theirAmenities.length < myAmenities.length) weaknesses.push('Fewer amenities');
    if (!competitor.photos || competitor.photos.length < 5) weaknesses.push('Limited photos');
    
    return {
      id: '', // Will be set by database
      property_id: property.id,
      competitor_name: competitor.name,
      competitor_url: competitor.property_url,
      price: theirRate,
      rating: 4.2, // Mock - would come from real data
      review_count: 85, // Mock
      amenities: competitor.amenities,
      strengths,
      weaknesses,
      distance_km: 2.5, // Mock
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

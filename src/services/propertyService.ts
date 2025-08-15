
import { supabase } from '@/integrations/supabase/client';
import type { Property, MarketData, CompetitorAnalysis, PerformanceMetrics } from '@/types/database';

const client: any = supabase;

export class PropertyService {
  // Create a new property
  static async createProperty(propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>) {
    console.log('[PropertyService] createProperty payload:', propertyData);
    const { data, error } = await client
      .from('properties')
      .insert(propertyData)
      .select('*')
      .single();

    if (error) throw error;
    return data as Property;
  }

  // Get all properties for a user
  static async getUserProperties(userId: string) {
    console.log('[PropertyService] getUserProperties for user:', userId);
    const { data, error } = await client
      .from('properties')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Property[];
  }

  // Get property by ID with related data
  static async getPropertyDetails(propertyId: string) {
    console.log('[PropertyService] getPropertyDetails id:', propertyId);

    const { data: property, error: propertyError } = await client
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError) throw propertyError;

    // Get latest market data
    const { data: marketData } = await client
      .from('market_data')
      .select('*')
      .eq('property_id', propertyId)
      .order('data_date', { ascending: false })
      .limit(1)
      .single();

    // Get competitors
    const { data: competitors } = await client
      .from('competitor_analysis')
      .select('*')
      .eq('property_id', propertyId)
      .order('rating', { ascending: false })
      .limit(10);

    // Get latest performance metrics
    const { data: metrics } = await client
      .from('performance_metrics')
      .select('*')
      .eq('property_id', propertyId)
      .order('metric_date', { ascending: false })
      .limit(30);

    return {
      property: property as Property,
      marketData: marketData as MarketData | undefined,
      competitors: (competitors || []) as CompetitorAnalysis[],
      metrics: (metrics || []) as PerformanceMetrics[]
    };
  }

  // Update property
  static async updateProperty(propertyId: string, updates: Partial<Property>) {
    console.log('[PropertyService] updateProperty id/updates:', propertyId, updates);
    const { data, error } = await client
      .from('properties')
      .update(updates)
      .eq('id', propertyId)
      .select('*')
      .single();

    if (error) throw error;
    return data as Property;
  }

  // Add market data
  static async addMarketData(marketData: Omit<MarketData, 'id' | 'created_at'>) {
    console.log('[PropertyService] addMarketData payload:', marketData);
    const { data, error } = await client
      .from('market_data')
      .insert(marketData)
      .select('*')
      .single();

    if (error) throw error;
    return data as MarketData;
  }

  // Add competitor analysis
  static async addCompetitorAnalysis(competitorData: Omit<CompetitorAnalysis, 'id' | 'created_at' | 'updated_at'>) {
    console.log('[PropertyService] addCompetitorAnalysis payload:', competitorData);
    const { data, error } = await client
      .from('competitor_analysis')
      .insert(competitorData)
      .select('*')
      .single();

    if (error) throw error;
    return data as CompetitorAnalysis;
  }

  // Get pricing history
  static async getPricingHistory(propertyId: string, days: number = 90) {
    console.log('[PropertyService] getPricingHistory for property:', propertyId, 'days:', days);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await client
      .from('pricing_history')
      .select('*')
      .eq('property_id', propertyId)
      .gte('date', since)
      .order('date', { ascending: true });

    if (error) throw error;
    return (data || []) as Array<{
      id: string;
      property_id: string;
      date: string;
      base_price?: number;
      weekend_price?: number;
      holiday_price?: number;
      occupancy_rate?: number;
      revenue?: number;
      bookings_count: number;
      created_at: string;
    }>;
  }

  // Add performance metrics
  static async addPerformanceMetrics(metricsData: Omit<PerformanceMetrics, 'id' | 'created_at'>) {
    console.log('[PropertyService] addPerformanceMetrics payload:', metricsData);
    const { data, error } = await client
      .from('performance_metrics')
      .insert(metricsData)
      .select('*')
      .single();

    if (error) throw error;
    return data as PerformanceMetrics;
  }
}


import { supabase } from '@/integrations/supabase/client';
import type { Property, MarketData, CompetitorAnalysis, PerformanceMetrics } from '@/types/database';

export class PropertyService {
  // Create a new property
  static async createProperty(propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get all properties for a user
  static async getUserProperties(userId: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Get property by ID with related data
  static async getPropertyDetails(propertyId: string) {
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();
    
    if (propertyError) throw propertyError;

    // Get latest market data
    const { data: marketData } = await supabase
      .from('market_data')
      .select('*')
      .eq('property_id', propertyId)
      .order('data_date', { ascending: false })
      .limit(1)
      .single();

    // Get competitors
    const { data: competitors } = await supabase
      .from('competitor_analysis')
      .select('*')
      .eq('property_id', propertyId)
      .order('rating', { ascending: false })
      .limit(10);

    // Get latest performance metrics
    const { data: metrics } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('property_id', propertyId)
      .order('metric_date', { ascending: false })
      .limit(30);

    return {
      property,
      marketData,
      competitors: competitors || [],
      metrics: metrics || []
    };
  }

  // Update property
  static async updateProperty(propertyId: string, updates: Partial<Property>) {
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', propertyId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Add market data
  static async addMarketData(marketData: Omit<MarketData, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('market_data')
      .insert(marketData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Add competitor analysis
  static async addCompetitorAnalysis(competitorData: Omit<CompetitorAnalysis, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('competitor_analysis')
      .insert(competitorData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get pricing history
  static async getPricingHistory(propertyId: string, days: number = 90) {
    const { data, error } = await supabase
      .from('pricing_history')
      .select('*')
      .eq('property_id', propertyId)
      .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  // Add performance metrics
  static async addPerformanceMetrics(metricsData: Omit<PerformanceMetrics, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('performance_metrics')
      .insert(metricsData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

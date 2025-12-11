import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PricingRecommendation {
  id: string;
  property_id: string;
  date: string;
  base_price: number;
  suggested_price: number;
  day_of_week_factor: number;
  seasonality_factor: number;
  event_factor: number;
  competitor_factor: number;
  occupancy_factor: number;
  lead_time_factor: number;
  relevant_events: any[];
  was_applied: boolean | null;
  applied_at: string | null;
  actual_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface CalculatePriceInput {
  property_id: string;
  base_price: number;
  target_date: string;
  market_id?: string;
}

// Fetch pricing recommendations for a property
export function usePricingRecommendations(propertyId: string | null, dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['pricing-recommendations', propertyId, dateRange],
    queryFn: async () => {
      if (!propertyId) return [];

      let query = supabase
        .from('fact_pricing_recommendations')
        .select('*')
        .eq('property_id', propertyId)
        .order('date', { ascending: true });

      if (dateRange) {
        query = query.gte('date', dateRange.start).lte('date', dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PricingRecommendation[];
    },
    enabled: !!propertyId,
  });
}

// Calculate dynamic price for a date
export function useCalculateDynamicPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CalculatePriceInput) => {
      const { data, error } = await supabase.functions.invoke('calculate-dynamic-price', {
        body: input,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-recommendations', variables.property_id] });
    },
  });
}

// Calculate prices for a date range
export function useCalculateDateRangePrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ property_id, base_price, start_date, end_date, market_id }: {
      property_id: string;
      base_price: number;
      start_date: string;
      end_date: string;
      market_id?: string;
    }) => {
      const start = new Date(start_date);
      const end = new Date(end_date);
      const results = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const target_date = d.toISOString().split('T')[0];
        
        const { data, error } = await supabase.functions.invoke('calculate-dynamic-price', {
          body: { property_id, base_price, target_date, market_id },
        });

        if (error) throw error;
        results.push(data);
      }

      return results;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-recommendations', variables.property_id] });
    },
  });
}

// Mark a recommendation as applied
export function useApplyPriceRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, actual_price }: { id: string; actual_price: number }) => {
      const { data, error } = await supabase
        .from('fact_pricing_recommendations')
        .update({
          was_applied: true,
          applied_at: new Date().toISOString(),
          actual_price,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PricingRecommendation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-recommendations', data.property_id] });
    },
  });
}

// Get pricing summary statistics
export function usePricingSummary(propertyId: string | null) {
  return useQuery({
    queryKey: ['pricing-summary', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;

      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('fact_pricing_recommendations')
        .select('*')
        .eq('property_id', propertyId)
        .gte('date', today)
        .lte('date', nextMonth);

      if (error) throw error;

      const recommendations = data as PricingRecommendation[];
      
      if (!recommendations.length) return null;

      const avgSuggestedPrice = recommendations.reduce((sum, r) => sum + r.suggested_price, 0) / recommendations.length;
      const avgBasePrice = recommendations.reduce((sum, r) => sum + r.base_price, 0) / recommendations.length;
      const appliedCount = recommendations.filter(r => r.was_applied).length;

      const highestPrice = Math.max(...recommendations.map(r => r.suggested_price));
      const lowestPrice = Math.min(...recommendations.map(r => r.suggested_price));

      const eventDays = recommendations.filter(r => r.event_factor > 1).length;
      const weekendDays = recommendations.filter(r => r.day_of_week_factor > 1).length;

      return {
        totalRecommendations: recommendations.length,
        avgSuggestedPrice: Math.round(avgSuggestedPrice),
        avgBasePrice: Math.round(avgBasePrice),
        avgPriceChange: ((avgSuggestedPrice - avgBasePrice) / avgBasePrice * 100).toFixed(1),
        appliedCount,
        applicationRate: Math.round((appliedCount / recommendations.length) * 100),
        highestPrice,
        lowestPrice,
        eventDays,
        weekendDays,
      };
    },
    enabled: !!propertyId,
  });
}

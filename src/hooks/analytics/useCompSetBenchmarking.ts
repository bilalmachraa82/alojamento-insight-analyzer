/**
 * Hook: useCompSetBenchmarking
 * Fetches benchmarking indices (ARI, MPI, RGI) vs. competitor set
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DateRange } from './useKPIsDaily';

export interface CompSetBenchmark {
  property_id: string;
  date: string;
  property_name: string;
  location: string;
  
  // Property Metrics
  adr: number;
  occupancy_rate: number;
  revpar: number;
  
  // Market Metrics
  market_adr: number;
  market_occupancy: number;
  market_revpar: number;
  market_rating: number;
  comp_set_size: number;
  
  // Benchmarking Indices (100 = at market level)
  ari: number; // Average Rate Index
  mpi: number; // Market Penetration Index
  rgi: number; // Revenue Generation Index (most important)
  
  // Market Position
  price_position: 'premium' | 'above_market' | 'at_market' | 'economy';
  market_position: 'leader' | 'competitive' | 'lagging' | 'distressed';
  
  // Percentile Rankings
  market_adr_p25: number;
  market_adr_p50: number;
  market_adr_p75: number;
  market_revpar_p25: number;
  market_revpar_p50: number;
  market_revpar_p75: number;
}

export const useCompSetBenchmarking = (
  propertyId: string,
  dateRange: DateRange,
  enabled: boolean = true
) => {
  return useQuery<CompSetBenchmark[], Error>({
    queryKey: ['comp-set-benchmarking', propertyId, dateRange.start, dateRange.end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpi_comp_set_daily')
        .select('*')
        .eq('property_id', propertyId)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: false });

      if (error) {
        console.error('[useCompSetBenchmarking] Error:', error);
        throw error;
      }

      return data as CompSetBenchmark[];
    },
    enabled: enabled && !!propertyId && !!dateRange.start && !!dateRange.end,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Get latest benchmarking data
 */
export const useLatestBenchmark = (propertyId: string) => {
  return useQuery<CompSetBenchmark | null, Error>({
    queryKey: ['comp-set-latest', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpi_comp_set_daily')
        .select('*')
        .eq('property_id', propertyId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[useLatestBenchmark] Error:', error);
        throw error;
      }

      return data as CompSetBenchmark | null;
    },
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 10,
  });
};

/**
 * Calculate performance vs. market
 */
export const useMarketPerformance = (propertyId: string, dateRange: DateRange) => {
  const { data: benchmarks, isLoading, error } = useCompSetBenchmarking(
    propertyId,
    dateRange
  );

  if (!benchmarks || benchmarks.length === 0) {
    return { data: null, isLoading, error };
  }

  // Calculate averages
  const avgRGI = benchmarks.reduce((sum, b) => sum + (b.rgi || 0), 0) / benchmarks.length;
  const avgARI = benchmarks.reduce((sum, b) => sum + (b.ari || 0), 0) / benchmarks.length;
  const avgMPI = benchmarks.reduce((sum, b) => sum + (b.mpi || 0), 0) / benchmarks.length;

  // Determine overall position
  let overallPosition: 'outperforming' | 'at_market' | 'underperforming';
  if (avgRGI >= 110) overallPosition = 'outperforming';
  else if (avgRGI >= 90) overallPosition = 'at_market';
  else overallPosition = 'underperforming';

  return {
    data: {
      rgi: Math.round(avgRGI),
      ari: Math.round(avgARI),
      mpi: Math.round(avgMPI),
      position: overallPosition,
      comp_set_size: benchmarks[0]?.comp_set_size || 0,
      market_position: benchmarks[0]?.market_position,
    },
    isLoading: false,
    error: null,
  };
};

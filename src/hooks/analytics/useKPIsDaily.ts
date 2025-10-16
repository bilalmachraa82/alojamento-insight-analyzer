/**
 * Hook: useKPIsDaily
 * Phase 0: Core KPIs Hook
 * 
 * Fetches daily KPIs from kpi_daily materialized view:
 * - ADR, RevPAR, Occupancy Rate, ALOS, TRevPAR
 * - DRR, LBR, Cancellation Rate
 * - GOPPAR, NOI PAR (if cost data available)
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DateRange {
  start: string; // ISO date string YYYY-MM-DD
  end: string;
}

export interface DailyKPI {
  property_id: string;
  date: string;
  property_name: string;
  location: string;
  property_type: string;
  
  // Core Performance Metrics
  occupancy_rate: number;
  adr: number;
  revpar: number;
  trevpar: number;
  cpor: number;
  alos: number;
  
  // Distribution Metrics
  drr: number;
  lbr: number;
  cancellation_rate: number;
  inquiry_to_booking_rate: number;
  view_to_booking_rate: number;
  
  // Profitability
  goppar: number;
  noi_par: number;
  
  // Raw Metrics
  rooms_available: number;
  rooms_sold: number;
  room_revenue: number;
  total_revenue: number;
  direct_revenue: number;
  room_cost: number;
  operating_expenses: number;
  bookings: number;
  cancellations: number;
  searches: number;
  views: number;
  inquiries: number;
  guest_count: number;
  average_length_of_stay: number;
  
  // Data Quality
  data_quality_score: number;
  data_source: string;
  
  // Context
  day_of_week: number;
  is_weekend: boolean;
  is_holiday: boolean;
  season: string;
  month_name: string;
  
  updated_at: string;
}

export interface KPISummary {
  total_revenue: number;
  total_bookings: number;
  avg_occupancy: number;
  avg_adr: number;
  avg_revpar: number;
  total_rooms_sold: number;
  total_rooms_available: number;
  period_days: number;
}

interface UseKPIsDailyOptions {
  propertyId: string;
  dateRange: DateRange;
  enabled?: boolean;
}

export const useKPIsDaily = (
  { propertyId, dateRange, enabled = true }: UseKPIsDailyOptions,
  queryOptions?: Omit<UseQueryOptions<DailyKPI[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<DailyKPI[], Error>({
    queryKey: ['kpis-daily', propertyId, dateRange.start, dateRange.end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpi_daily')
        .select('*')
        .eq('property_id', propertyId)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: false });

      if (error) {
        console.error('[useKPIsDaily] Error fetching data:', error);
        throw error;
      }

      return data as DailyKPI[];
    },
    enabled: enabled && !!propertyId && !!dateRange.start && !!dateRange.end,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...queryOptions,
  });
};

/**
 * Hook: useKPIsSummary
 * Calculate summary statistics for a date range
 */
export const useKPIsSummary = (
  { propertyId, dateRange, enabled = true }: UseKPIsDailyOptions
): { data: KPISummary | undefined; isLoading: boolean; error: Error | null } => {
  const { data: dailyKPIs, isLoading, error } = useKPIsDaily({ propertyId, dateRange, enabled });

  if (!dailyKPIs || dailyKPIs.length === 0) {
    return { data: undefined, isLoading, error };
  }

  const summary: KPISummary = {
    total_revenue: dailyKPIs.reduce((sum, kpi) => sum + (kpi.total_revenue || 0), 0),
    total_bookings: dailyKPIs.reduce((sum, kpi) => sum + (kpi.bookings || 0), 0),
    total_rooms_sold: dailyKPIs.reduce((sum, kpi) => sum + (kpi.rooms_sold || 0), 0),
    total_rooms_available: dailyKPIs.reduce((sum, kpi) => sum + (kpi.rooms_available || 0), 0),
    avg_occupancy: dailyKPIs.reduce((sum, kpi) => sum + (kpi.occupancy_rate || 0), 0) / dailyKPIs.length,
    avg_adr: dailyKPIs.reduce((sum, kpi) => sum + (kpi.adr || 0), 0) / dailyKPIs.length,
    avg_revpar: dailyKPIs.reduce((sum, kpi) => sum + (kpi.revpar || 0), 0) / dailyKPIs.length,
    period_days: dailyKPIs.length,
  };

  return { data: summary, isLoading, error };
};

/**
 * Hook: useKPIsTrend
 * Get trend direction and percentage change vs. previous period
 */
export const useKPIsTrend = (
  propertyId: string,
  currentPeriod: DateRange,
  previousPeriod: DateRange
) => {
  const current = useKPIsSummary({ propertyId, dateRange: currentPeriod });
  const previous = useKPIsSummary({ propertyId, dateRange: previousPeriod });

  if (!current.data || !previous.data) {
    return {
      data: undefined,
      isLoading: current.isLoading || previous.isLoading,
      error: current.error || previous.error,
    };
  }

  const calculateChange = (currentVal: number, previousVal: number) => {
    if (previousVal === 0) return 0;
    return ((currentVal - previousVal) / previousVal) * 100;
  };

  const trend = {
    revenue_change: calculateChange(current.data.total_revenue, previous.data.total_revenue),
    occupancy_change: calculateChange(current.data.avg_occupancy, previous.data.avg_occupancy),
    adr_change: calculateChange(current.data.avg_adr, previous.data.avg_adr),
    revpar_change: calculateChange(current.data.avg_revpar, previous.data.avg_revpar),
    bookings_change: calculateChange(current.data.total_bookings, previous.data.total_bookings),
  };

  return {
    data: trend,
    isLoading: false,
    error: null,
  };
};

/**
 * Hook: useLatestKPI
 * Get the most recent KPI data point
 */
export const useLatestKPI = (propertyId: string) => {
  return useQuery<DailyKPI | null, Error>({
    queryKey: ['kpis-daily-latest', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpi_daily')
        .select('*')
        .eq('property_id', propertyId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('[useLatestKPI] Error:', error);
        throw error;
      }

      return data as DailyKPI;
    },
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

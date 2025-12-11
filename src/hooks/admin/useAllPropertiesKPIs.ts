import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PropertyKPI {
  property_id: string;
  property_name: string;
  location: string | null;
  property_type: string | null;
  is_system: boolean;
  latest_date: string | null;
  adr: number | null;
  occupancy_rate: number | null;
  revpar: number | null;
  ari: number | null;
  mpi: number | null;
  rgi: number | null;
  market_position: 'leader' | 'competitive' | 'lagging' | 'distressed';
  avg_adr_7d: number | null;
  avg_occupancy_7d: number | null;
  avg_revpar_7d: number | null;
}

export interface KPISummary {
  total_properties: number;
  avg_adr: number;
  avg_occupancy: number;
  avg_revpar: number;
  avg_rgi: number;
  leaders: number;
  competitive: number;
  lagging: number;
  distressed: number;
}

export interface AllPropertiesKPIsResponse {
  success: boolean;
  summary: KPISummary;
  properties: PropertyKPI[];
}

export function useAllPropertiesKPIs() {
  return useQuery({
    queryKey: ["admin-all-properties-kpis"],
    queryFn: async (): Promise<AllPropertiesKPIsResponse> => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("admin-get-all-kpis", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useCompetitorManagement() {
  return useQuery({
    queryKey: ["admin-competitors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dim_competitor")
        .select("*")
        .order("market_id", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useSeasonalityData() {
  return useQuery({
    queryKey: ["seasonality-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dim_seasonality")
        .select("*")
        .order("market_id", { ascending: true })
        .order("month", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useEventsData() {
  return useQuery({
    queryKey: ["events-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dim_event")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}
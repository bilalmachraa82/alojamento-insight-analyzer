import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SmartAlert {
  id: string;
  type: 'rgi_low' | 'event_upcoming' | 'occupancy_low' | 'competitor_change';
  severity: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  property_id?: string;
  property_name?: string;
  event_id?: string;
  event_name?: string;
  value?: number;
  threshold?: number;
  date?: string;
  created_at: string;
}

export interface AlertsSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
}

export interface SmartAlertsResponse {
  success: boolean;
  alerts: SmartAlert[];
  summary: AlertsSummary;
}

export function useSmartAlerts() {
  return useQuery({
    queryKey: ["admin-smart-alerts"],
    queryFn: async (): Promise<SmartAlertsResponse> => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("admin-smart-alerts", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}

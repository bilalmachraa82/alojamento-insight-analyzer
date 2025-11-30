export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          cost_usd: number | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          operation: string
          service_name: string
          submission_id: string | null
          success: boolean
          tokens_used: number | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          operation: string
          service_name: string
          submission_id?: string | null
          success?: boolean
          tokens_used?: number | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          operation?: string
          service_name?: string
          submission_id?: string | null
          success?: boolean
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_submissions: {
        Row: {
          actor_id: string | null
          actor_run_id: string | null
          analysis_result: Json | null
          created_at: string
          email: string
          error_message: string | null
          id: string
          name: string
          platform: string
          premium_report_url: string | null
          property_data: Json | null
          property_id: string | null
          property_url: string
          report_generated_at: string | null
          retry_count: number | null
          status: string
          submission_date: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_run_id?: string | null
          analysis_result?: Json | null
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          name: string
          platform: string
          premium_report_url?: string | null
          property_data?: Json | null
          property_id?: string | null
          property_url: string
          report_generated_at?: string | null
          retry_count?: number | null
          status?: string
          submission_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_run_id?: string | null
          analysis_result?: Json | null
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          name?: string
          platform?: string
          premium_report_url?: string | null
          property_data?: Json | null
          property_id?: string | null
          property_url?: string
          report_generated_at?: string | null
          retry_count?: number | null
          status?: string
          submission_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_submissions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "dim_property"
            referencedColumns: ["id"]
          },
        ]
      }
      dim_channel: {
        Row: {
          channel_code: string
          commission_rate: number
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          channel_code: string
          commission_rate: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          channel_code?: string
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      dim_competitor: {
        Row: {
          created_at: string
          distance_km: number | null
          id: string
          is_active: boolean | null
          last_scraped_at: string | null
          location: string | null
          market_id: string | null
          name: string
          property_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          distance_km?: number | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          location?: string | null
          market_id?: string | null
          name: string
          property_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          distance_km?: number | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          location?: string | null
          market_id?: string | null
          name?: string
          property_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dim_date: {
        Row: {
          date: string
          day_name: string
          day_of_week: number
          is_holiday: boolean | null
          is_weekend: boolean
          month: number
          month_name: string
          quarter: number
          season: string
          week: number
          year: number
        }
        Insert: {
          date: string
          day_name: string
          day_of_week: number
          is_holiday?: boolean | null
          is_weekend: boolean
          month: number
          month_name: string
          quarter: number
          season: string
          week: number
          year: number
        }
        Update: {
          date?: string
          day_name?: string
          day_of_week?: number
          is_holiday?: boolean | null
          is_weekend?: boolean
          month?: number
          month_name?: string
          quarter?: number
          season?: string
          week?: number
          year?: number
        }
        Relationships: []
      }
      dim_event: {
        Row: {
          created_at: string
          end_date: string
          event_type: string
          id: string
          impact_score: number
          location: string | null
          market_id: string | null
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          event_type: string
          id?: string
          impact_score: number
          location?: string | null
          market_id?: string | null
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          event_type?: string
          id?: string
          impact_score?: number
          location?: string | null
          market_id?: string | null
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      dim_property: {
        Row: {
          amenities: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          is_system: boolean | null
          location: string | null
          max_guests: number | null
          name: string
          property_type: string | null
          room_count: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amenities?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          location?: string | null
          max_guests?: number | null
          name: string
          property_type?: string | null
          room_count?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amenities?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          location?: string | null
          max_guests?: number | null
          name?: string
          property_type?: string | null
          room_count?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string
          error_message: string
          error_type: string
          id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          stack_trace: string | null
          submission_id: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error_message: string
          error_type: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          stack_trace?: string | null
          submission_id?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          error_message?: string
          error_type?: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          stack_trace?: string | null
          submission_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_channel_daily: {
        Row: {
          acquisition_cost: number
          bookings: number
          cancellations: number
          channel_id: string
          created_at: string
          date: string
          property_id: string
          room_revenue: number
          updated_at: string
        }
        Insert: {
          acquisition_cost?: number
          bookings?: number
          cancellations?: number
          channel_id: string
          created_at?: string
          date: string
          property_id: string
          room_revenue?: number
          updated_at?: string
        }
        Update: {
          acquisition_cost?: number
          bookings?: number
          cancellations?: number
          channel_id?: string
          created_at?: string
          date?: string
          property_id?: string
          room_revenue?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_channel_daily_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "dim_channel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_channel_daily_date_fkey"
            columns: ["date"]
            isOneToOne: false
            referencedRelation: "dim_date"
            referencedColumns: ["date"]
          },
          {
            foreignKeyName: "fact_channel_daily_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "dim_property"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_competitor_rates: {
        Row: {
          adr_comp: number | null
          competitor_id: string
          created_at: string
          date: string
          occupancy_comp: number | null
          property_id: string
          rating_comp: number | null
          revpar_comp: number | null
          scraped_at: string
          updated_at: string
        }
        Insert: {
          adr_comp?: number | null
          competitor_id: string
          created_at?: string
          date: string
          occupancy_comp?: number | null
          property_id: string
          rating_comp?: number | null
          revpar_comp?: number | null
          scraped_at?: string
          updated_at?: string
        }
        Update: {
          adr_comp?: number | null
          competitor_id?: string
          created_at?: string
          date?: string
          occupancy_comp?: number | null
          property_id?: string
          rating_comp?: number | null
          revpar_comp?: number | null
          scraped_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_competitor_rates_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "dim_competitor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_competitor_rates_date_fkey"
            columns: ["date"]
            isOneToOne: false
            referencedRelation: "dim_date"
            referencedColumns: ["date"]
          },
          {
            foreignKeyName: "fact_competitor_rates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "dim_property"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_daily: {
        Row: {
          bookings: number
          cancellations: number
          created_at: string
          data_quality_score: number | null
          date: string
          direct_revenue: number
          inquiries: number
          property_id: string
          room_cost: number
          room_revenue: number
          rooms_available: number
          rooms_sold: number
          searches: number
          total_revenue: number
          updated_at: string
          views: number
        }
        Insert: {
          bookings?: number
          cancellations?: number
          created_at?: string
          data_quality_score?: number | null
          date: string
          direct_revenue?: number
          inquiries?: number
          property_id: string
          room_cost?: number
          room_revenue?: number
          rooms_available?: number
          rooms_sold?: number
          searches?: number
          total_revenue?: number
          updated_at?: string
          views?: number
        }
        Update: {
          bookings?: number
          cancellations?: number
          created_at?: string
          data_quality_score?: number | null
          date?: string
          direct_revenue?: number
          inquiries?: number
          property_id?: string
          room_cost?: number
          room_revenue?: number
          rooms_available?: number
          rooms_sold?: number
          searches?: number
          total_revenue?: number
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "fact_daily_date_fkey"
            columns: ["date"]
            isOneToOne: false
            referencedRelation: "dim_date"
            referencedColumns: ["date"]
          },
          {
            foreignKeyName: "fact_daily_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "dim_property"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_goals: {
        Row: {
          created_at: string
          created_by: string
          current_value: number | null
          deadline: string
          id: string
          metric_name: string
          property_id: string
          start_date: string
          status: string
          target_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_value?: number | null
          deadline: string
          id?: string
          metric_name: string
          property_id: string
          start_date: string
          status: string
          target_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_value?: number | null
          deadline?: string
          id?: string
          metric_name?: string
          property_id?: string
          start_date?: string
          status?: string
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_goals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "dim_property"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_reviews: {
        Row: {
          created_at: string
          csat_score: number | null
          date: string
          id: string
          is_repeat_guest: boolean | null
          nps_score: number | null
          platform: string
          property_id: string
          rating: number | null
          responded: boolean | null
          response_time_hours: number | null
          review_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          csat_score?: number | null
          date: string
          id?: string
          is_repeat_guest?: boolean | null
          nps_score?: number | null
          platform: string
          property_id: string
          rating?: number | null
          responded?: boolean | null
          response_time_hours?: number | null
          review_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          csat_score?: number | null
          date?: string
          id?: string
          is_repeat_guest?: boolean | null
          nps_score?: number | null
          platform?: string
          property_id?: string
          rating?: number | null
          responded?: boolean | null
          response_time_hours?: number | null
          review_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_reviews_date_fkey"
            columns: ["date"]
            isOneToOne: false
            referencedRelation: "dim_date"
            referencedColumns: ["date"]
          },
          {
            foreignKeyName: "fact_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "dim_property"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_sentiment_topics: {
        Row: {
          created_at: string
          date: string
          mention_count: number
          platform: string
          property_id: string
          sentiment_score: number
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          mention_count?: number
          platform: string
          property_id: string
          sentiment_score: number
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          mention_count?: number
          platform?: string
          property_id?: string
          sentiment_score?: number
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_sentiment_topics_date_fkey"
            columns: ["date"]
            isOneToOne: false
            referencedRelation: "dim_date"
            referencedColumns: ["date"]
          },
          {
            foreignKeyName: "fact_sentiment_topics_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "dim_property"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_checks: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          response_time_ms: number | null
          service_name: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          service_name: string
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_api_usage_summary: {
        Row: {
          avg_cost_per_call: number | null
          service_name: string | null
          successful_calls: number | null
          total_calls: number | null
          total_cost_usd: number | null
          total_tokens: number | null
        }
        Relationships: []
      }
      admin_error_summary: {
        Row: {
          critical_count: number | null
          error_count: number | null
          unique_error_types: number | null
          unresolved_count: number | null
          warning_count: number | null
        }
        Relationships: []
      }
      admin_submissions_summary: {
        Row: {
          avg_processing_time_minutes: number | null
          failed_30d: number | null
          pending_count: number | null
          successful_30d: number | null
          total_submissions_30d: number | null
        }
        Relationships: []
      }
      kpi_channel_daily: {
        Row: {
          acquisition_cost: number | null
          bookings: number | null
          cancellations: number | null
          channel_id: string | null
          channel_name: string | null
          channel_type: string | null
          date: string | null
          nrevpar: number | null
          property_id: string | null
          room_revenue: number | null
        }
        Relationships: []
      }
      kpi_comp_set_daily: {
        Row: {
          ari: number | null
          date: string | null
          mpi: number | null
          property_id: string | null
          rgi: number | null
        }
        Relationships: []
      }
      kpi_daily: {
        Row: {
          adr: number | null
          alos: number | null
          bookings: number | null
          cancellation_rate: number | null
          cancellations: number | null
          date: string | null
          drr: number | null
          lbr: number | null
          occupancy_rate: number | null
          property_id: string | null
          revpar: number | null
          rooms_available: number | null
          rooms_sold: number | null
          trevpar: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      promote_to_admin: { Args: { _user_id: string }; Returns: undefined }
      refresh_all_kpi_views: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "user" | "admin" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin", "super_admin"],
    },
  },
} as const

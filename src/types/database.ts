
export interface User {
  id: string;
  email: string;
  name: string;
  subscription_tier: 'free' | 'professional' | 'premium' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'past_due';
  subscription_end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  user_id: string;
  name: string;
  platform: 'booking' | 'airbnb' | 'vrbo';
  property_url: string;
  property_type?: string;
  location?: string;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  amenities: Record<string, any>;
  photos: string[];
  is_active: boolean;
  last_analyzed?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketData {
  id: string;
  property_id: string;
  location: string;
  average_daily_rate?: number;
  occupancy_rate?: number;
  revenue_per_night?: number;
  competitor_count?: number;
  market_saturation?: number;
  seasonal_trends: Record<string, any>;
  data_date: string;
  created_at: string;
}

export interface CompetitorAnalysis {
  id: string;
  property_id: string;
  competitor_name: string;
  competitor_url?: string;
  price?: number;
  rating?: number;
  review_count?: number;
  amenities: Record<string, any>;
  strengths: string[];
  weaknesses: string[];
  distance_km?: number;
  created_at: string;
  updated_at: string;
}

export interface PricingHistory {
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
}

export interface PerformanceMetrics {
  id: string;
  property_id: string;
  metric_date: string;
  occupancy_rate?: number;
  average_daily_rate?: number;
  revenue_per_available_night?: number;
  guest_satisfaction_score?: number;
  response_rate?: number;
  booking_lead_time?: number;
  cancellation_rate?: number;
  repeat_guest_rate?: number;
  created_at: string;
}

export interface AnalysisReport {
  id: string;
  property_id: string;
  report_type: 'basic' | 'premium' | 'enterprise';
  analysis_data: Record<string, any>;
  recommendations: Array<Record<string, any>>;
  score?: number;
  generated_at: string;
  expires_at?: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  property_id?: string;
  report_id?: string;
  bookmark_type: 'property' | 'report' | 'competitor';
  notes?: string;
  created_at: string;
}

// Enhanced diagnostic submission type
export interface DiagnosticSubmission {
  id: string;
  nome: string;
  email: string;
  link: string;
  plataforma: string;
  rgpd: boolean;
  status: string;
  scraped_data?: Record<string, any>;
  analysis_result?: Record<string, any>;
  data_submissao: string;
  user_id?: string;
  property_id?: string;
}

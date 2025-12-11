import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  property_id: string;
  date: string;
  platform: string;
  rating: number | null;
  review_text: string | null;
  responded: boolean | null;
  response_time_hours: number | null;
  nps_score: number | null;
  csat_score: number | null;
  is_repeat_guest: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewInput {
  property_id: string;
  date: string;
  platform: string;
  rating: number;
  review_text?: string;
  responded?: boolean;
  response_time_hours?: number;
  nps_score?: number;
  csat_score?: number;
  is_repeat_guest?: boolean;
}

// Fetch reviews for a property
export function usePropertyReviews(propertyId: string | null, limit = 50) {
  return useQuery({
    queryKey: ['reviews', propertyId, limit],
    queryFn: async () => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('fact_reviews')
        .select('*')
        .eq('property_id', propertyId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!propertyId,
  });
}

// Fetch all reviews with property info
export function useAllReviews(limit = 100) {
  return useQuery({
    queryKey: ['all-reviews', limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: properties } = await supabase
        .from('dim_property')
        .select('id, name')
        .eq('user_id', user.id);

      if (!properties || properties.length === 0) return [];

      const { data, error } = await supabase
        .from('fact_reviews')
        .select('*')
        .in('property_id', properties.map(p => p.id))
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data as Review[]).map(review => ({
        ...review,
        property_name: properties.find(p => p.id === review.property_id)?.name || 'Unknown'
      }));
    },
  });
}

// Create a new review
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      const { data, error } = await supabase
        .from('fact_reviews')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as Review;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', data.property_id] });
      queryClient.invalidateQueries({ queryKey: ['all-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews-summary'] });
    },
  });
}

// Update a review (e.g., mark as responded)
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Review> & { id: string }) => {
      const { data, error } = await supabase
        .from('fact_reviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Review;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', data.property_id] });
      queryClient.invalidateQueries({ queryKey: ['all-reviews'] });
    },
  });
}

// Delete a review
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('fact_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews-summary'] });
    },
  });
}

// Get reviews summary statistics
export function useReviewsSummary(propertyId?: string) {
  return useQuery({
    queryKey: ['reviews-summary', propertyId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      let query = supabase.from('fact_reviews').select('*');

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      } else {
        const { data: properties } = await supabase
          .from('dim_property')
          .select('id')
          .eq('user_id', user.id);

        if (!properties || properties.length === 0) return null;
        query = query.in('property_id', properties.map(p => p.id));
      }

      const { data: reviews, error } = await query;
      if (error) throw error;

      const ratingsWithValues = reviews?.filter(r => r.rating !== null) || [];
      const respondedReviews = reviews?.filter(r => r.responded) || [];
      const avgResponseTime = respondedReviews.filter(r => r.response_time_hours)
        .reduce((sum, r) => sum + (r.response_time_hours || 0), 0) / (respondedReviews.length || 1);

      const platformCounts = reviews?.reduce((acc, r) => {
        acc[r.platform] = (acc[r.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const ratingDistribution = ratingsWithValues.reduce((acc, r) => {
        const rating = Math.round(r.rating || 0);
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      return {
        totalReviews: reviews?.length || 0,
        averageRating: ratingsWithValues.length 
          ? Number((ratingsWithValues.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingsWithValues.length).toFixed(1))
          : null,
        responseRate: reviews?.length 
          ? Math.round((respondedReviews.length / reviews.length) * 100)
          : 0,
        avgResponseTimeHours: Math.round(avgResponseTime),
        platformCounts,
        ratingDistribution,
        repeatGuestCount: reviews?.filter(r => r.is_repeat_guest).length || 0,
      };
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Goal {
  id: string;
  property_id: string;
  metric_name: string;
  target_value: number;
  current_value: number | null;
  start_date: string;
  deadline: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  property_id: string;
  metric_name: string;
  target_value: number;
  start_date: string;
  deadline: string;
}

export interface UpdateGoalInput {
  id: string;
  current_value?: number;
  status?: string;
  target_value?: number;
  deadline?: string;
}

// Fetch goals for a property
export function usePropertyGoals(propertyId: string | null) {
  return useQuery({
    queryKey: ['goals', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      
      const { data, error } = await supabase
        .from('fact_goals')
        .select('*')
        .eq('property_id', propertyId)
        .order('deadline', { ascending: true });

      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!propertyId,
  });
}

// Fetch all goals for a user's properties
export function useAllGoals() {
  return useQuery({
    queryKey: ['all-goals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // First get user's properties
      const { data: properties, error: propError } = await supabase
        .from('dim_property')
        .select('id, name')
        .eq('user_id', user.id);

      if (propError) throw propError;
      if (!properties || properties.length === 0) return [];

      const propertyIds = properties.map(p => p.id);

      const { data, error } = await supabase
        .from('fact_goals')
        .select('*')
        .in('property_id', propertyIds)
        .order('deadline', { ascending: true });

      if (error) throw error;
      
      // Attach property name to each goal
      return (data as Goal[]).map(goal => ({
        ...goal,
        property_name: properties.find(p => p.id === goal.property_id)?.name || 'Unknown'
      }));
    },
  });
}

// Create a new goal
export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('fact_goals')
        .insert({
          ...input,
          status: 'active',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Goal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals', data.property_id] });
      queryClient.invalidateQueries({ queryKey: ['all-goals'] });
    },
  });
}

// Update a goal
export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateGoalInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('fact_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Goal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals', data.property_id] });
      queryClient.invalidateQueries({ queryKey: ['all-goals'] });
    },
  });
}

// Delete a goal
export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('fact_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-goals'] });
    },
  });
}

// Get goal progress summary
export function useGoalsSummary() {
  return useQuery({
    queryKey: ['goals-summary'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: properties } = await supabase
        .from('dim_property')
        .select('id')
        .eq('user_id', user.id);

      if (!properties || properties.length === 0) return null;

      const { data: goals, error } = await supabase
        .from('fact_goals')
        .select('*')
        .in('property_id', properties.map(p => p.id));

      if (error) throw error;

      const activeGoals = goals?.filter(g => g.status === 'active') || [];
      const completedGoals = goals?.filter(g => g.status === 'completed') || [];
      const overdueGoals = activeGoals.filter(g => new Date(g.deadline) < new Date());

      return {
        total: goals?.length || 0,
        active: activeGoals.length,
        completed: completedGoals.length,
        overdue: overdueGoals.length,
        completionRate: goals?.length ? Math.round((completedGoals.length / goals.length) * 100) : 0,
      };
    },
  });
}

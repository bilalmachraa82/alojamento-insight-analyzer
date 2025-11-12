import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserActivity {
  date: string;
  new_signups: number;
  active_users_7d: number;
  active_users_30d: number;
  churned_users: number;
}

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  churnRate: number;
  adminCount: number;
}

export const useUserActivity = (days: number = 90) => {
  return useQuery<UserActivity[]>({
    queryKey: ['admin', 'user-activity', days],
    queryFn: async () => {
      // Return empty array since admin_user_activity table doesn't exist
      return [];
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

export const useUserMetrics = () => {
  return useQuery<UserMetrics>({
    queryKey: ['admin', 'user-metrics'],
    queryFn: async () => {
      // Return mock data since user_profiles table doesn't exist
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        churnRate: 0,
        adminCount: 0,
      };
    },
    refetchInterval: 60000,
  });
};

export const useRecentUsers = (limit: number = 10) => {
  return useQuery({
    queryKey: ['admin', 'recent-users', limit],
    queryFn: async () => {
      // Return empty array since user_profiles table doesn't exist
      return [];
    },
    refetchInterval: 60000,
  });
};

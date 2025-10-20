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
      const { data, error } = await supabase
        .from('admin_user_activity')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

export const useUserMetrics = () => {
  return useQuery<UserMetrics>({
    queryKey: ['admin', 'user-metrics'],
    queryFn: async () => {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users (logged in within last 30 days)
      const { count: activeUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .eq('is_active', true);

      // Get new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: newUsersToday } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get churned users
      const { count: churnedUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      // Get admin count
      const { count: adminCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['admin', 'super_admin']);

      const churnRate = totalUsers ? ((churnedUsers || 0) / totalUsers * 100) : 0;

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        newUsersToday: newUsersToday || 0,
        churnRate: Math.round(churnRate * 100) / 100,
        adminCount: adminCount || 0,
      };
    },
    refetchInterval: 60000,
  });
};

export const useRecentUsers = (limit: number = 10) => {
  return useQuery({
    queryKey: ['admin', 'recent-users', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserMetrics, useUserActivity } from '@/hooks/admin';
import { Users, UserPlus, Activity, UserX, Shield, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const UserMetrics = () => {
  const { data: metrics, isLoading: metricsLoading } = useUserMetrics();
  const { data: activity, isLoading: activityLoading } = useUserActivity(30);

  if (metricsLoading || activityLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Metrics
          </CardTitle>
          <CardDescription>User engagement and activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data (last 30 days)
  const chartData = (activity as any[])?.slice(0, 30).map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    newSignups: day.new_signups,
    activeUsers: day.active_users_7d,
  })).reverse() || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Metrics
        </CardTitle>
        <CardDescription>User engagement and activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">{metrics?.totalUsers || 0}</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Active Users</p>
              <Activity className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{metrics?.activeUsers || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">New Today</p>
              <UserPlus className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{metrics?.newUsersToday || 0}</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Churn Rate</p>
              <UserX className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{metrics?.churnRate || 0}%</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Admins</p>
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{metrics?.adminCount || 0}</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium mb-4">User Activity (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="newSignups" fill="#3b82f6" name="New Signups" />
              <Bar dataKey="activeUsers" fill="#22c55e" name="Active Users (7d)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

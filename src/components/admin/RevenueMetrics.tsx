import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, CreditCard, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const RevenueMetrics = () => {
  // This is a placeholder component for revenue metrics
  // In a real implementation, you would fetch this data from Stripe or your payment provider

  const mockRevenueData = [
    { month: 'Jan', revenue: 4500, subscriptions: 45 },
    { month: 'Feb', revenue: 5200, subscriptions: 52 },
    { month: 'Mar', revenue: 6100, subscriptions: 61 },
    { month: 'Apr', revenue: 5800, subscriptions: 58 },
    { month: 'May', revenue: 7200, subscriptions: 72 },
    { month: 'Jun', revenue: 8100, subscriptions: 81 },
  ];

  const totalRevenue = mockRevenueData.reduce((sum, d) => sum + d.revenue, 0);
  const avgRevenue = totalRevenue / mockRevenueData.length;
  const totalSubscriptions = mockRevenueData[mockRevenueData.length - 1].subscriptions;
  const revenueGrowth = ((mockRevenueData[mockRevenueData.length - 1].revenue - mockRevenueData[0].revenue) / mockRevenueData[0].revenue * 100).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Revenue Metrics
        </CardTitle>
        <CardDescription>Financial overview and subscription data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Revenue (6m)</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">${totalRevenue.toLocaleString()}</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Avg Monthly Revenue</p>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold mt-2">${avgRevenue.toFixed(0)}</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{totalSubscriptions}</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Growth Rate</p>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{revenueGrowth}%</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
              <Bar yAxisId="right" dataKey="subscriptions" fill="#22c55e" name="Subscriptions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Note: This is placeholder data. Connect to Stripe or your payment provider to display real revenue metrics.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

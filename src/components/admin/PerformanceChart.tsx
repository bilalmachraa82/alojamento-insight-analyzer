import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePerformanceMetrics } from '@/hooks/admin';
import { Activity, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const PerformanceChart = () => {
  const { data: metrics, isLoading } = usePerformanceMetrics(7);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>System performance over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
        <CardDescription>System performance over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="response-time" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="response-time">Response Time</TabsTrigger>
            <TabsTrigger value="error-rate">Error Rate</TabsTrigger>
            <TabsTrigger value="throughput">Throughput</TabsTrigger>
          </TabsList>

          <TabsContent value="response-time" className="mt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Average Response Time</p>
                  <p className="text-2xl font-bold mt-2">
                    {metrics && metrics.length > 0
                      ? Math.round(
                          metrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / metrics.length
                        )
                      : 0}s
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">P95 Response Time</p>
                  <p className="text-2xl font-bold mt-2">
                    {metrics && metrics.length > 0
                      ? Math.round(
                          metrics.reduce((sum, m) => sum + m.p95ResponseTime, 0) / metrics.length
                        )
                      : 0}s
                  </p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgResponseTime"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Avg Response Time"
                  />
                  <Line
                    type="monotone"
                    dataKey="p95ResponseTime"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="P95 Response Time"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="error-rate" className="mt-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Average Error Rate</p>
                <p className="text-2xl font-bold mt-2">
                  {metrics && metrics.length > 0
                    ? Math.round(
                        (metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length) * 10
                      ) / 10
                    : 0}%
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Error Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="errorRate"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Error Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="throughput" className="mt-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Average Daily Requests</p>
                <p className="text-2xl font-bold mt-2">
                  {metrics && metrics.length > 0
                    ? Math.round(
                        metrics.reduce((sum, m) => sum + m.requestCount, 0) / metrics.length
                      )
                    : 0}
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Requests', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="requestCount"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Request Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubmissionMetrics, useSubmissionStats } from '@/hooks/admin';
import { FileText, TrendingUp, TrendingDown, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SubmissionMetrics = () => {
  const { data: metrics, isLoading: metricsLoading } = useSubmissionMetrics();
  const { data: stats, isLoading: statsLoading } = useSubmissionStats(30);

  if (metricsLoading || statsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submission Metrics
          </CardTitle>
          <CardDescription>Last 30 days submission analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = (stats as any[])?.reduce((acc: any[], stat) => {
    const existingDate = acc.find(item => item.date === stat.date);
    if (existingDate) {
      if (stat.status === 'completed') existingDate.completed = stat.count;
      if (stat.status === 'failed') existingDate.failed = stat.count;
      if (stat.status === 'pending') existingDate.pending = stat.count;
    } else {
      acc.push({
        date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: stat.status === 'completed' ? stat.count : 0,
        failed: stat.status === 'failed' ? stat.count : 0,
        pending: stat.status === 'pending' ? stat.count : 0,
      });
    }
    return acc;
  }, []).reverse() || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Submission Metrics
        </CardTitle>
        <CardDescription>Last 30 days submission analytics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Submissions</p>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">{metrics?.totalSubmissions || 0}</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              {(metrics?.successRate || 0) >= 90 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-2xl font-bold mt-2">{metrics?.successRate || 0}%</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Avg Processing Time</p>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">{metrics?.avgProcessingTime || 0}s</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Failed Submissions</p>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{metrics?.failedSubmissions || 0}</p>
          </div>
        </div>

        {metrics?.pendingSubmissions && metrics.pendingSubmissions > 0 && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {metrics.pendingSubmissions} submissions are currently pending or processing
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6">
          <h3 className="text-sm font-medium mb-4">Submission Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} name="Completed" />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name="Failed" />
              <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pending" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useApiQuotaMetrics } from '@/hooks/admin';
import { DollarSign, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const ApiQuotaCard = () => {
  const { data: metrics, isLoading } = useApiQuotaMetrics(30);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            API Usage & Quota
          </CardTitle>
          <CardDescription>Last 30 days API consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCost = metrics?.reduce((sum, m) => sum + m.totalCost, 0) || 0;
  const totalCalls = metrics?.reduce((sum, m) => sum + m.totalCalls, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          API Usage & Quota
        </CardTitle>
        <CardDescription>Last 30 days API consumption</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total API Cost</p>
              <p className="text-2xl font-bold mt-2">${totalCost.toFixed(2)}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total API Calls</p>
              <p className="text-2xl font-bold mt-2">{totalCalls.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            {metrics?.map((metric) => {
              const isNearLimit = (metric.quotaUsedPercentage || 0) >= 80;
              const isOverLimit = (metric.quotaUsedPercentage || 0) >= 100;

              return (
                <div key={metric.serviceName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium capitalize">{metric.serviceName}</p>
                      <Badge variant={metric.successRate >= 95 ? 'default' : 'destructive'}>
                        {metric.successRate.toFixed(1)}% success
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        ${metric.totalCost.toFixed(2)}
                      </span>
                      {isNearLimit && (
                        <AlertTriangle className={`h-4 w-4 ${isOverLimit ? 'text-red-500' : 'text-yellow-500'}`} />
                      )}
                    </div>
                  </div>

                  {metric.quotaUsedPercentage !== undefined && metric.quotaLimit && (
                    <>
                      <Progress
                        value={Math.min(metric.quotaUsedPercentage, 100)}
                        className={`h-2 ${isOverLimit ? '[&>div]:bg-red-500' : isNearLimit ? '[&>div]:bg-yellow-500' : ''}`}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {metric.serviceName === 'claude' && metric.totalTokens
                            ? `${metric.totalTokens.toLocaleString()} tokens used`
                            : `${metric.totalCalls} calls`}
                        </span>
                        <span>
                          {metric.quotaUsedPercentage.toFixed(1)}% of {metric.quotaLimit.toLocaleString()}{' '}
                          {metric.serviceName === 'claude' ? 'tokens' : 'calls'}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Avg cost per call: ${metric.avgCostPerCall.toFixed(3)}</div>
                    <div>Total calls: {metric.totalCalls.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {metrics?.some((m) => (m.quotaUsedPercentage || 0) >= 80) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                One or more API services are approaching or exceeding their quota limits. Consider upgrading your plan or optimizing usage.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

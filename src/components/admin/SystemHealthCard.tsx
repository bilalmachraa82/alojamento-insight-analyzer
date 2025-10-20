import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSystemHealth } from '@/hooks/admin';
import { Activity, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SystemHealthCard = () => {
  const { data: health, isLoading, error } = useSystemHealth();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'down':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Real-time system status monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Real-time system status monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load system health: {error.message}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>Real-time system status monitoring</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${getStatusColor(health?.overall || 'unknown')} animate-pulse`} />
            <Badge variant={getStatusVariant(health?.overall || 'unknown')}>
              {health?.overall?.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {health?.services.map((service) => (
            <div key={service.service} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(service.status)}
                <div>
                  <p className="font-medium capitalize">{service.service.replace('_', ' ')}</p>
                  {service.error && (
                    <p className="text-xs text-muted-foreground text-red-500">{service.error}</p>
                  )}
                  {service.details && (
                    <p className="text-xs text-muted-foreground">
                      {Object.entries(service.details).map(([key, value]) => `${key}: ${value}`).join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge variant={getStatusVariant(service.status)}>
                  {service.status}
                </Badge>
                {service.responseTime && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {service.responseTime}ms
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        {health?.timestamp && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Last checked: {new Date(health.timestamp).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

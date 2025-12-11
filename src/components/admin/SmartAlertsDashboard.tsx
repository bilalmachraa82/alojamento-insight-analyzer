import { useSmartAlerts, SmartAlert } from "@/hooks/admin/useSmartAlerts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Bell, Calendar, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const getSeverityColor = (severity: SmartAlert['severity']) => {
  switch (severity) {
    case 'critical':
      return 'bg-destructive text-destructive-foreground';
    case 'warning':
      return 'bg-yellow-500 text-white';
    case 'info':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getTypeIcon = (type: SmartAlert['type']) => {
  switch (type) {
    case 'rgi_low':
      return <TrendingDown className="h-4 w-4" />;
    case 'event_upcoming':
      return <Calendar className="h-4 w-4" />;
    case 'occupancy_low':
      return <Activity className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: SmartAlert['type']) => {
  switch (type) {
    case 'rgi_low':
      return 'RGI';
    case 'event_upcoming':
      return 'Evento';
    case 'occupancy_low':
      return 'Ocupação';
    case 'competitor_change':
      return 'Competidor';
    default:
      return type;
  }
};

function AlertCard({ alert }: { alert: SmartAlert }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
        {getTypeIcon(alert.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm truncate">{alert.title}</h4>
          <Badge variant="outline" className="text-xs shrink-0">
            {getTypeLabel(alert.type)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{alert.message}</p>
        {alert.date && (
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(alert.date).toLocaleDateString('pt-PT')}
          </p>
        )}
      </div>
    </div>
  );
}

export function SmartAlertsDashboard() {
  const { data, isLoading, error, refetch, isFetching } = useSmartAlerts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar alertas: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { alerts, summary } = data || { alerts: [], summary: { total: 0, critical: 0, warning: 0, info: 0 } };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Alertas</CardDescription>
            <CardTitle className="text-3xl">{summary.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              Críticos
            </CardDescription>
            <CardTitle className="text-3xl text-destructive">{summary.critical}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-yellow-500/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              Avisos
            </CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{summary.warning}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-500/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Informativos
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">{summary.info}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Smart Alerts
            </CardTitle>
            <CardDescription>
              Alertas automáticos baseados em RGI, eventos e ocupação
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum alerta ativo</p>
              <p className="text-sm">Todas as métricas estão dentro dos parâmetros normais</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

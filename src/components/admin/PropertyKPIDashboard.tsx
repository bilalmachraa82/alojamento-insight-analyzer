import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Building, DollarSign, Users, BarChart3 } from "lucide-react";
import { useAllPropertiesKPIs, PropertyKPI } from "@/hooks/admin/useAllPropertiesKPIs";

const formatCurrency = (value: number | null) => {
  if (value === null) return "—";
  return `€${value.toFixed(0)}`;
};

const formatPercent = (value: number | null) => {
  if (value === null) return "—";
  return `${(value * 100).toFixed(1)}%`;
};

const formatIndex = (value: number | null) => {
  if (value === null) return "—";
  return value.toFixed(2);
};

const getMarketPositionBadge = (position: PropertyKPI['market_position']) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    leader: { variant: "default", label: "Líder" },
    competitive: { variant: "secondary", label: "Competitivo" },
    lagging: { variant: "outline", label: "Atrasado" },
    distressed: { variant: "destructive", label: "Em Risco" },
  };
  const config = variants[position] || variants.competitive;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getRGITrend = (rgi: number | null) => {
  if (rgi === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (rgi >= 1.05) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (rgi <= 0.95) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

export function PropertyKPIDashboard() {
  const { data, isLoading, error } = useAllPropertiesKPIs();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar KPIs: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const summary = data?.summary;
  const properties = data?.properties?.filter(p => !p.is_system) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Propriedades</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_properties || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.leaders || 0} líderes • {summary?.competitive || 0} competitivos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ADR Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.avg_adr || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Média de todas as propriedades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ocupação Média</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(summary?.avg_occupancy || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Taxa média de ocupação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">RGI Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatIndex(summary?.avg_rgi || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {(summary?.avg_rgi || 1) >= 1 ? "Acima do mercado" : "Abaixo do mercado"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Market Position Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Posição de Mercado</CardTitle>
          <CardDescription>Análise do desempenho das propriedades vs. concorrência</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 bg-green-500/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{summary?.leaders || 0}</div>
              <div className="text-sm text-muted-foreground">Líderes (RGI ≥ 1.15)</div>
            </div>
            <div className="flex-1 bg-blue-500/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{summary?.competitive || 0}</div>
              <div className="text-sm text-muted-foreground">Competitivos (RGI 0.95-1.15)</div>
            </div>
            <div className="flex-1 bg-yellow-500/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{summary?.lagging || 0}</div>
              <div className="text-sm text-muted-foreground">Atrasados (RGI 0.75-0.95)</div>
            </div>
            <div className="flex-1 bg-red-500/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{summary?.distressed || 0}</div>
              <div className="text-sm text-muted-foreground">Em Risco (RGI &lt; 0.75)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>KPIs por Propriedade</CardTitle>
          <CardDescription>Métricas detalhadas de performance e benchmarking</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Propriedade</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead className="text-right">ADR</TableHead>
                <TableHead className="text-right">Ocupação</TableHead>
                <TableHead className="text-right">RevPAR</TableHead>
                <TableHead className="text-right">ARI</TableHead>
                <TableHead className="text-right">MPI</TableHead>
                <TableHead className="text-right">RGI</TableHead>
                <TableHead>Posição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Nenhuma propriedade encontrada
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((property) => (
                  <TableRow key={property.property_id}>
                    <TableCell className="font-medium">{property.property_name}</TableCell>
                    <TableCell>{property.location || "—"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(property.adr)}</TableCell>
                    <TableCell className="text-right">{formatPercent(property.occupancy_rate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(property.revpar)}</TableCell>
                    <TableCell className="text-right">{formatIndex(property.ari)}</TableCell>
                    <TableCell className="text-right">{formatIndex(property.mpi)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getRGITrend(property.rgi)}
                        {formatIndex(property.rgi)}
                      </div>
                    </TableCell>
                    <TableCell>{getMarketPositionBadge(property.market_position)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
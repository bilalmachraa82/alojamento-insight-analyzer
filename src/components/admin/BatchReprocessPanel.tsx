import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle, Play } from "lucide-react";
import { useBatchReprocess } from "@/hooks/admin/useBatchReprocess";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export function BatchReprocessPanel() {
  const { 
    isLoading, 
    stuckSubmissions, 
    reprocessResults,
    fetchStuckSubmissions, 
    reprocessAll,
    reprocessSingle 
  } = useBatchReprocess();

  useEffect(() => {
    fetchStuckSubmissions();
  }, []);

  const getErrorType = (errorMessage: string | null) => {
    if (!errorMessage) return "unknown";
    if (errorMessage.includes("actor-is-not-rented") || errorMessage.includes("actor")) return "apify";
    if (errorMessage.includes("firecrawl") || errorMessage.includes("Firecrawl")) return "firecrawl";
    if (errorMessage.includes("Share-") || errorMessage.includes("share URL")) return "invalid_url";
    return "other";
  };

  const getErrorBadge = (errorType: string) => {
    switch (errorType) {
      case "apify":
        return <Badge variant="destructive">Apify (Legacy)</Badge>;
      case "firecrawl":
        return <Badge variant="secondary">Firecrawl</Badge>;
      case "invalid_url":
        return <Badge variant="outline">URL Inválido</Badge>;
      default:
        return <Badge variant="secondary">Outro</Badge>;
    }
  };

  const apifyFailures = stuckSubmissions.filter(s => getErrorType(s.error_message) === "apify");
  const otherFailures = stuckSubmissions.filter(s => getErrorType(s.error_message) !== "apify");

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Total Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stuckSubmissions.length}</div>
            <p className="text-xs text-muted-foreground">
              Submissões em pending_manual_review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Falhas Apify (Legacy)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apifyFailures.length}</div>
            <p className="text-xs text-muted-foreground">
              Podem ser reprocessadas com Firecrawl
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Outras Falhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{otherFailures.length}</div>
            <p className="text-xs text-muted-foreground">
              Requerem análise manual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reprocessamento em Lote</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchStuckSubmissions()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button 
                size="sm"
                onClick={() => reprocessAll(10)}
                disabled={isLoading || apifyFailures.length === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                Reprocessar {Math.min(10, apifyFailures.length)} Apify
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Reprocessar submissões que falharam com Apify usando o novo pipeline Firecrawl
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reprocessResults.length > 0 && (
            <div className="mb-4 p-4 rounded-lg bg-muted">
              <h4 className="font-medium mb-2">Resultado do Último Reprocessamento:</h4>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">
                  ✓ {reprocessResults.filter(r => r.success).length} sucesso
                </span>
                <span className="text-red-600">
                  ✗ {reprocessResults.filter(r => !r.success).length} erros
                </span>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Tipo Erro</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stuckSubmissions.slice(0, 20).map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="text-xs">
                    {format(new Date(submission.created_at), "dd/MM/yy HH:mm", { locale: pt })}
                  </TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate">
                    {submission.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {submission.platform}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getErrorBadge(getErrorType(submission.error_message))}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => reprocessSingle(submission.id)}
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reprocessar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {stuckSubmissions.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>Nenhuma submissão pendente de revisão manual!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

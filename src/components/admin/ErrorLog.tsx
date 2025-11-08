import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useErrorLogs, useResolveError } from '@/hooks/admin';
import { AlertTriangle, CheckCircle, XCircle, Info, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';

export const ErrorLog = () => {
  const [severity, setSeverity] = useState<string>('');
  const [resolved, setResolved] = useState<string>('false');
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const { data: errorData, isLoading } = useErrorLogs(100, severity, resolved === 'true');
  const resolveError = useResolveError();
  const { toast } = useToast();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityVariant = (severity: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'default';
    }
  };

  const handleResolveError = async (errorId: string, userId: string) => {
    try {
      await resolveError.mutateAsync({ errorId, userId });
      toast({
        title: 'Success',
        description: 'Error has been marked as resolved',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resolve error',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Logs
          </CardTitle>
          <CardDescription>Recent system errors and warnings</CardDescription>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error Logs
            </CardTitle>
            <CardDescription>Recent system errors and warnings</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resolved} onValueChange={setResolved}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Unresolved</SelectItem>
                <SelectItem value="true">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {errorData?.summary && errorData.summary.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Error Summary (Last 7 Days)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Using composite key with error type and severity for stable keys */}
              {errorData.summary.slice(0, 6).map((summary, idx) => (
                <div key={`error-summary-${summary.error_type}-${summary.severity}-${idx}`} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={getSeverityVariant(summary.severity)}>
                      {summary.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {summary.unresolved_count} unresolved
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{summary.error_type}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.total_count} occurrences, {summary.affected_users} users affected
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium mb-3">Recent Errors ({errorData?.total || 0})</h3>
          {(!errorData?.errors || errorData.errors.length === 0) ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>No errors found with the current filters</AlertDescription>
            </Alert>
          ) : (
            errorData.errors.map((error) => (
              <Collapsible
                key={error.id}
                open={expandedError === error.id}
                onOpenChange={() => setExpandedError(expandedError === error.id ? null : error.id)}
              >
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(error.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{error.error_type}</p>
                          <Badge variant={getSeverityVariant(error.severity)}>
                            {error.severity}
                          </Badge>
                          {error.resolved && (
                            <Badge variant="outline">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {error.error_message}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{new Date(error.created_at).toLocaleString()}</span>
                          {error.user && <span>User: {error.user.email}</span>}
                          {error.submission && <span>Submission: {error.submission.property_url}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!error.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveError(error.id, error.user_id || '')}
                          disabled={resolveError.isPending}
                        >
                          {resolveError.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </>
                          )}
                        </Button>
                      )}
                      <CollapsibleTrigger asChild>
                        <Button size="sm" variant="ghost">
                          {expandedError === error.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  <CollapsibleContent className="mt-4">
                    {error.stack_trace && (
                      <div className="mb-3">
                        <p className="text-xs font-medium mb-1">Stack Trace:</p>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                          {error.stack_trace}
                        </pre>
                      </div>
                    )}
                    {error.context && Object.keys(error.context).length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1">Context:</p>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                          {JSON.stringify(error.context, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

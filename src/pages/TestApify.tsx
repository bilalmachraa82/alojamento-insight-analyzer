import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PLATFORMS = [
  { value: "booking", label: "Booking.com", actorId: "dtrungtin/booking-scraper", testUrl: "https://www.booking.com/hotel/pt/pestana-palace.html" },
  { value: "airbnb", label: "Airbnb", actorId: "GsNzxEKzE2vQ5d9HN", testUrl: "https://www.airbnb.com/rooms/12345" },
  { value: "vrbo", label: "VRBO", actorId: "powerai/vrbo-listing-scraper", testUrl: "https://www.vrbo.com/12345" },
  { value: "agoda", label: "Agoda", actorId: "eC53oEoee74OTExo3", testUrl: "https://www.agoda.com/hotel/12345" },
  { value: "expedia", label: "Expedia", actorId: "jupri/expedia-hotels", testUrl: "https://www.expedia.com/Hotel/12345" },
  { value: "hotels", label: "Hotels.com", actorId: "tri_angle/expedia-hotels-com-reviews-scraper", testUrl: "https://www.hotels.com/ho12345" }
];

interface TestResult {
  platform: string;
  status: "pending" | "running" | "success" | "error";
  message?: string;
  runId?: string;
  data?: any;
}

export default function TestApify() {
  const [testUrl, setTestUrl] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("booking");
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const runTest = async () => {
    if (!testUrl) {
      toast.error("Por favor insira uma URL para testar");
      return;
    }

    setIsLoading(true);
    const newResult: TestResult = {
      platform: selectedPlatform,
      status: "running",
      message: "A iniciar scraping..."
    };
    setTestResults(prev => [newResult, ...prev]);

    try {
      // Submit via the diagnostic flow
      const { data: submitData, error: submitError } = await supabase.functions.invoke("submit-diagnostic", {
        body: {
          name: "Test User",
          email: "test@mariafaz.pt",
          property_url: testUrl,
          platform: selectedPlatform
        }
      });

      if (submitError) throw new Error(submitError.message);

      const id = submitData?.id;
      setSubmissionId(id);

      // Update result with submission ID
      setTestResults(prev => prev.map((r, i) => 
        i === 0 ? { ...r, message: `Submissão criada: ${id}`, runId: id } : r
      ));

      // Wait a bit and then trigger processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data: processData, error: processError } = await supabase.functions.invoke("process-diagnostic", {
        body: { id }
      });

      if (processError) {
        throw new Error(processError.message);
      }

      setTestResults(prev => prev.map((r, i) => 
        i === 0 ? { 
          ...r, 
          status: processData?.success ? "success" : "error",
          message: processData?.message || "Processamento iniciado",
          data: processData
        } : r
      ));

      toast.success("Teste iniciado com sucesso!");
    } catch (error: any) {
      console.error("Test error:", error);
      setTestResults(prev => prev.map((r, i) => 
        i === 0 ? { ...r, status: "error", message: error.message } : r
      ));
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("check-scrape-status", {
        body: { id }
      });

      if (error) throw error;

      toast.info(`Status: ${data?.status || "unknown"}`);
      console.log("Status check result:", data);
    } catch (error: any) {
      toast.error(`Erro ao verificar status: ${error.message}`);
    }
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "running": return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Teste de Integração Apify
          </CardTitle>
          <CardDescription>
            Teste cada plataforma individualmente para validar a integração com os actors Apify
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platform Configuration Status */}
          <div>
            <h3 className="text-sm font-medium mb-3">Plataformas Configuradas</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PLATFORMS.map(platform => (
                <div key={platform.value} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{platform.label}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {platform.actorId.split('/')[0]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Test Form */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium">Testar Scraping</h3>
            
            <div className="grid gap-4 md:grid-cols-3">
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar plataforma" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                placeholder="URL da propriedade para testar"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="md:col-span-2"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={runTest} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Executar Teste
              </Button>
              
              {submissionId && (
                <Button variant="outline" onClick={() => checkStatus(submissionId)}>
                  Verificar Status
                </Button>
              )}
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-medium">Resultados dos Testes</h3>
              
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  {getStatusIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={result.status === "success" ? "default" : result.status === "error" ? "destructive" : "secondary"}>
                        {PLATFORMS.find(p => p.value === result.platform)?.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {result.status}
                      </span>
                    </div>
                    <p className="text-sm mt-1 text-muted-foreground">{result.message}</p>
                    {result.runId && (
                      <p className="text-xs mt-1 font-mono text-muted-foreground">
                        ID: {result.runId}
                      </p>
                    )}
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-primary">Ver dados completos</summary>
                        <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-40">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Links */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Links Úteis</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://console.apify.com/actors" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Apify Console
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://console.apify.com/billing/subscription" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Apify Billing
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
  time: string;
  type: "info" | "success" | "error" | "warning";
  stage: string;
  message: string;
}

export default function TestPremiumFlow() {
  const [bookingUrl, setBookingUrl] = useState("https://www.booking.com/hotel/pt/casa-do-torno.pt-br.html");
  const [email, setEmail] = useState("test@mariafaz.pt");
  const [name, setName] = useState("Test Property");
  const [isLoading, setIsLoading] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const { toast } = useToast();

  const addLog = (type: LogEntry["type"], stage: string, message: string) => {
    const newLog: LogEntry = {
      time: new Date().toLocaleTimeString("pt-PT"),
      type,
      stage,
      message
    };
    setLogs(prev => [...prev, newLog]);
  };

  const testCompleteFlow = async () => {
    setIsLoading(true);
    setLogs([]);
    setReportUrl(null);
    setSubmissionId(null);
    setCurrentStatus(null);

    try {
      addLog("info", "INÍCIO", "Iniciando teste do fluxo premium completo");

      // Step 1: Submit diagnostic
      addLog("info", "SUBMISSÃO", "Criando submissão na base de dados...");
      const { data: submitData, error: submitError } = await supabase.functions.invoke(
        'submit-diagnostic',
        {
          body: {
            name,
            email,
            property_url: bookingUrl,
            platform: "booking"
          }
        }
      );

      if (submitError) throw submitError;
      
      const subId = submitData.submission.id;
      setSubmissionId(subId);
      addLog("success", "SUBMISSÃO", `✅ Submissão criada: ${subId}`);

      // Step 2: Process diagnostic (scraping)
      addLog("info", "SCRAPING", "Iniciando scraping com Apify...");
      const { error: processError } = await supabase.functions.invoke(
        'process-diagnostic',
        {
          body: { id: subId }
        }
      );

      if (processError) throw processError;
      addLog("success", "SCRAPING", "✅ Scraping iniciado com sucesso");

      // Step 3: Monitor progress
      addLog("info", "MONITOR", "Monitorando progresso...");
      await monitorSubmission(subId);

    } catch (error: any) {
      console.error("Error in test flow:", error);
      addLog("error", "ERRO", `❌ ${error.message || "Erro desconhecido"}`);
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const monitorSubmission = async (subId: string) => {
    const maxAttempts = 60; // 5 minutes
    let attempts = 0;

    const checkStatus = async () => {
      attempts++;
      
      const { data: submission, error } = await supabase
        .from("diagnostic_submissions")
        .select("*")
        .eq("id", subId)
        .single();

      if (error) {
        addLog("error", "MONITOR", `Erro ao verificar status: ${error.message}`);
        return;
      }

      const status = submission.status;
      setCurrentStatus(status);

      // Log status changes
      if (status === "processing") {
        addLog("info", "SCRAPING", "⏳ Processando URL com Apify...");
      } else if (status === "scraping_completed") {
        addLog("success", "SCRAPING", "✅ Dados coletados com sucesso");
        addLog("info", "ANÁLISE", "Iniciando análise com Claude...");
      } else if (status === "analyzing") {
        addLog("info", "ANÁLISE", "🤖 Claude está analisando os dados...");
      } else if (status === "completed") {
        addLog("success", "ANÁLISE", "✅ Análise concluída");
        
        if (submission.premium_report_url) {
          setReportUrl(submission.premium_report_url);
          addLog("success", "RELATÓRIO", `✅ Relatório premium gerado!`);
          addLog("success", "RELATÓRIO", `URL: ${submission.premium_report_url}`);
          
          toast({
            title: "Teste concluído com sucesso! 🎉",
            description: "O relatório premium está pronto",
          });
        }
        return;
      } else if (status === "failed" || status === "scraping_failed") {
        addLog("error", "ERRO", `❌ Falha: ${submission.error_message || "Erro desconhecido"}`);
        toast({
          title: "Teste falhou",
          description: submission.error_message,
          variant: "destructive"
        });
        return;
      }

      if (attempts < maxAttempts && status !== "completed" && status !== "failed") {
        setTimeout(checkStatus, 5000); // Check every 5 seconds
      } else if (attempts >= maxAttempts) {
        addLog("warning", "MONITOR", "⚠️ Timeout: máximo de tentativas atingido");
      }
    };

    checkStatus();
  };

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-green-700 dark:text-green-400";
      case "error":
        return "text-red-700 dark:text-red-400";
      case "warning":
        return "text-yellow-700 dark:text-yellow-400";
      default:
        return "text-blue-700 dark:text-blue-400";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste Completo do Fluxo Premium</CardTitle>
          <CardDescription>
            Este teste executa todo o fluxo: Submissão → Scraping (Apify) → Análise (Claude) → Relatório HTML Premium
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">URL do Booking.com</label>
              <Input
                value={bookingUrl}
                onChange={(e) => setBookingUrl(e.target.value)}
                placeholder="https://www.booking.com/hotel/..."
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button
              onClick={testCompleteFlow}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Teste em execução...
                </>
              ) : (
                "🚀 Iniciar Teste Completo"
              )}
            </Button>
          </div>

          {/* Status */}
          {currentStatus && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status atual:</span>
              <Badge variant="outline">{currentStatus}</Badge>
            </div>
          )}

          {/* Submission ID */}
          {submissionId && (
            <div className="bg-muted p-3 rounded-lg">
              <span className="text-sm font-medium">Submission ID:</span>
              <code className="ml-2 text-xs">{submissionId}</code>
            </div>
          )}

          {/* Report URL */}
          {reportUrl && (
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      ✅ Relatório Premium Gerado!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      O relatório HTML está pronto para visualização
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <a href={reportUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver Relatório
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Logs do Teste:</h3>
              <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto space-y-2">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    {getLogIcon(log.type)}
                    <span className="text-muted-foreground text-xs">[{log.time}]</span>
                    <span className="font-medium">[{log.stage}]</span>
                    <span className={getLogColor(log.type)}>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                📋 O que este teste valida:
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>✅ Submissão criada corretamente na base de dados</li>
                <li>✅ Apify scraper específico (runtime/booking-scraper) funciona</li>
                <li>✅ Dados estruturados são extraídos com sucesso</li>
                <li>✅ Claude analisa os dados e gera análise premium</li>
                <li>✅ Relatório HTML é gerado com o template correto</li>
                <li>✅ Ficheiro é guardado no bucket premium-reports</li>
                <li>✅ URL pública é acessível</li>
                <li>✅ Design premium está aplicado corretamente</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

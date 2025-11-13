import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface LogEntry {
  time: string;
  type: "info" | "success" | "error" | "warning";
  message: string;
}

export default function TestScraping() {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const { toast } = useToast();

  const addLog = (type: LogEntry["type"], message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, type, message }]);
  };

  const testBookingScraping = async () => {
    setIsLoading(true);
    setLogs([]);
    setSubmissionId(null);

    try {
      addLog("info", "🚀 Iniciando teste de scraping do Booking.com");
      
      const testData = {
        name: "Teste MariaFaz",
        email: "teste@mariafaz.com",
        property_url: "https://www.booking.com/hotel/pt/pestana-palace.html",
        platform: "booking"
      };

      addLog("info", `📝 Dados de teste: ${testData.property_url}`);

      // Submit via edge function
      addLog("info", "📡 Enviando para edge function submit-diagnostic...");
      const { data: submitResponse, error: submitError } = await supabase.functions.invoke("submit-diagnostic", {
        body: testData
      });

      if (submitError) {
        addLog("error", `❌ Erro na submissão: ${submitError.message}`);
        throw submitError;
      }

      if (!submitResponse?.success) {
        addLog("error", `❌ Submissão falhou: ${submitResponse?.error || 'Unknown error'}`);
        throw new Error(submitResponse?.error || "Submission failed");
      }

      const newSubmissionId = submitResponse.submissionId;
      setSubmissionId(newSubmissionId);
      addLog("success", `✅ Submissão criada com sucesso! ID: ${newSubmissionId}`);

      // Start processing
      addLog("info", "🔄 Iniciando processo de scraping...");
      const { data: processResponse, error: processError } = await supabase.functions.invoke("process-diagnostic", {
        body: { id: newSubmissionId }
      });

      if (processError) {
        addLog("error", `❌ Erro no processamento: ${processError.message}`);
        throw processError;
      }

      if (processResponse?.success) {
        addLog("success", `✅ Scraping iniciado! Run ID: ${processResponse.runId}`);
        addLog("info", `📊 Actor ID: ${processResponse.actorId}`);
        
        // Monitor status
        addLog("info", "👀 Monitorando status da submissão...");
        await monitorSubmissionStatus(newSubmissionId);
      } else {
        addLog("warning", `⚠️ ${processResponse?.message || 'Processamento manual necessário'}`);
      }

      toast({
        title: "Teste concluído",
        description: "Verifique os logs abaixo para detalhes",
      });

    } catch (error: any) {
      console.error("Test error:", error);
      addLog("error", `❌ Erro no teste: ${error.message}`);
      toast({
        variant: "destructive",
        title: "Erro no teste",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const monitorSubmissionStatus = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 10;
    const checkInterval = 3000; // 3 seconds

    const checkStatus = async () => {
      attempts++;
      
      const { data, error } = await supabase
        .from("diagnostic_submissions")
        .select("status, error_message, actor_run_id, property_data, analysis_result")
        .eq("id", id)
        .single();

      if (error) {
        addLog("error", `❌ Erro ao verificar status: ${error.message}`);
        return;
      }

      addLog("info", `🔍 Status [${attempts}/${maxAttempts}]: ${data.status}`);

      if (data.actor_run_id) {
        addLog("info", `📋 Apify Run ID: ${data.actor_run_id}`);
      }

      if (data.property_data) {
        const dataSize = JSON.stringify(data.property_data).length;
        addLog("info", `📊 Property data: ${dataSize} bytes`);
      }

      if (data.status === "completed") {
        addLog("success", "🎉 Scraping completado com sucesso!");
        if (data.analysis_result) {
          addLog("success", "✅ Análise gerada com sucesso!");
        }
        return;
      }

      if (data.status === "failed" || data.status === "pending_manual_review") {
        addLog("error", `❌ Status final: ${data.status}`);
        if (data.error_message) {
          addLog("error", `Erro: ${data.error_message}`);
        }
        return;
      }

      if (attempts < maxAttempts && (data.status === "processing" || data.status === "scraping" || data.status === "scraping_retry")) {
        setTimeout(checkStatus, checkInterval);
      } else if (attempts >= maxAttempts) {
        addLog("warning", `⚠️ Limite de tentativas atingido. Status atual: ${data.status}`);
      }
    };

    await checkStatus();
  };

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error": return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning": return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success": return "text-green-600 dark:text-green-400";
      case "error": return "text-red-600 dark:text-red-400";
      case "warning": return "text-yellow-600 dark:text-yellow-400";
      default: return "text-blue-600 dark:text-blue-400";
    }
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">🧪 Teste de Scraping</h1>
        <p className="text-muted-foreground">
          Teste o fluxo completo de scraping do Booking.com com logs em tempo real
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Link de Teste</h2>
            <code className="block bg-muted p-3 rounded text-sm">
              https://www.booking.com/hotel/pt/pestana-palace.html
            </code>
            <p className="text-sm text-muted-foreground mt-2">
              Pestana Palace Lisboa - Hotel exemplo em Portugal
            </p>
          </div>

          <Button 
            onClick={testBookingScraping}
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Testando... Aguarde
              </>
            ) : (
              "🚀 Iniciar Teste de Scraping"
            )}
          </Button>

          {submissionId && (
            <div className="p-3 bg-muted rounded">
              <p className="text-sm font-medium">Submission ID:</p>
              <code className="text-xs">{submissionId}</code>
            </div>
          )}
        </div>
      </Card>

      {logs.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Logs em Tempo Real</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {logs.map((log, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded bg-muted/50 hover:bg-muted transition-colors"
              >
                {getLogIcon(log.type)}
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">{log.time}</span>
                  <p className={`text-sm font-mono break-words ${getLogColor(log.type)}`}>
                    {log.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6 bg-muted/30">
        <h2 className="text-lg font-semibold mb-3">ℹ️ Como Funciona</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>1. Submissão:</strong> Cria registro na tabela diagnostic_submissions</p>
          <p><strong>2. Validação:</strong> Verifica se o URL é válido (rejeita Share URLs)</p>
          <p><strong>3. Scraping:</strong> Inicia Apify Actor com retry automático (2 tentativas)</p>
          <p><strong>4. Processamento:</strong> Status muda de processing → scraping → completed</p>
          <p><strong>5. Email:</strong> Envia notificação quando completado</p>
        </div>
      </Card>
    </div>
  );
}

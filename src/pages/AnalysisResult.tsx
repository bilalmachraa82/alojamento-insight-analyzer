
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import AnalysisResultsViewer from "@/components/results/AnalysisResultsViewer";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";
import ProcessingStatus from "@/components/diagnostic/ProcessingStatus";

interface AnalysisData {
  id: string;
  name: string;
  email: string;
  property_url: string;
  platform: string;
  status: string;
  analysis_result: {
    property_data?: {
      property_name?: string;
      location?: string;
      property_type?: string;
      rating?: number;
    };
    [key: string]: any;
  } | null;
  submission_date: string;
  property_data: any | null;
  error_message: string | null;
}


const AnalysisResult = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const { toast } = useToast();

  const fetchAnalysisData = async () => {
    try {
      if (!id) {
        setError("Nenhum ID de análise fornecido");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("diagnostic_submissions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (!data) {
        setError("Análise não encontrada");
        setLoading(false);
        return;
      }

      const processedData: AnalysisData = {
        id: data.id,
        name: data.name,
        email: data.email,
        property_url: data.property_url,
        platform: data.platform,
        status: data.status,
        analysis_result: data.analysis_result as AnalysisData['analysis_result'],
        submission_date: data.submission_date,
        property_data: data.property_data,
        error_message: data.error_message
      };
      
      setAnalysisData(processedData);

      if (data.status !== "completed" && data.status !== "failed") {
        setAnalyzing(true);
        switch (data.status) {
          case "pending_manual_review":
            setProgressValue(30);
            break;
          case "pending":
            setProgressValue(20);
            break;
          case "processing":
            setProgressValue(30);
            break;
          case "scraping":
            setProgressValue(50);
            break;
          case "scraping_completed":
            setProgressValue(60);
            break;
          case "analyzing":
            setProgressValue(80);
            break;
          default:
            setProgressValue(20);
        }
        
        checkAnalysisStatus(data.id);
      } else {
        setAnalyzing(false);
        setProgressValue(100);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching analysis data:", err);
      setError(err.message || "Ocorreu um erro ao buscar os dados da análise");
      setLoading(false);
      
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar os dados da análise. Por favor, tente novamente mais tarde."
      });
    }
  };

  const checkAnalysisStatus = async (submissionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("check-status", {
        body: { id: submissionId }
      });

      if (error) throw error;

      if (data) {
        console.log("Status check response:", data);
        
        if (data.status === "scraping") {
          setProgressValue(50);
        } else if (data.status === "scraping_completed") {
          setProgressValue(60);
        } else if (data.status === "analyzing") {
          setProgressValue(80);
        } else if (data.status === "pending_manual_review") {
          setProgressValue(30);
        } else if (data.status === "completed") {
          setProgressValue(100);
          setAnalyzing(false);
          
          fetchAnalysisData();
          return;
        }

        if (data.status !== "completed" && data.status !== "failed") {
          setTimeout(() => checkAnalysisStatus(submissionId), 5000);
        } else {
          setAnalyzing(false);
        }
      }
    } catch (err) {
      console.error("Error checking analysis status:", err);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [id]);

  const handleRefresh = () => {
    setLoading(true);
    fetchAnalysisData();
  };

  const requestManualAnalysis = async () => {
    try {
      if (!analysisData) return;
      
      toast({
        title: "Solicitação enviada",
        description: "Seu pedido para análise manual foi registrado. Nossa equipe entrará em contato em breve.",
      });
      
      await supabase
        .from("diagnostic_submissions")
        .update({ 
          status: "manual_review_requested",
          error_message: "Manual review requested by user at " + new Date().toISOString()
        })
        .eq("id", analysisData.id);
        
      // Recarregar os dados para atualizar a UI
      setTimeout(() => fetchAnalysisData(), 1000);
    } catch (error) {
      console.error("Error requesting manual analysis:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível solicitar análise manual. Tente novamente.",
      });
    }
  };
  
  const getPropertyName = () => {
    if (!analysisData) return "Propriedade";
    
    return analysisData.analysis_result?.property_data?.property_name || 
           analysisData.property_data?.property_name ||
           analysisData.property_url?.split('/').pop() || 
           "Sua Propriedade";
  };
  
  const getPropertyLocation = () => {
    if (!analysisData) return "Localização Indisponível";
    return analysisData.analysis_result?.property_data?.location || 
           analysisData.property_data?.location ||
           "Localização Indisponível";
  };
  
  const getPropertyType = () => {
    if (!analysisData) return "Alojamento";
    return analysisData.analysis_result?.property_data?.property_type || 
           analysisData.property_data?.property_type ||
           "Alojamento";
  };
  
  const getPropertyRating = () => {
    if (!analysisData) return null;
    return analysisData.analysis_result?.property_data?.rating || 
           analysisData.property_data?.rating ||
           null;
  };

  const getErrorMessage = () => {
    if (!analysisData?.error_message) return null;
    return analysisData.error_message;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-12 w-12 animate-spin text-brand-pink mb-4" />
        <p className="text-lg text-center">Carregando resultados da análise...</p>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
        <p className="text-lg text-center mb-6">{error || "Falha ao carregar dados da análise"}</p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Início
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <header className="w-full py-4 px-6 md:px-8 bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Início
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Análise da Propriedade</h1>
          <Button variant="ghost" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="bg-white shadow rounded-xl p-6 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{getPropertyName()}</h1>
          <div className="flex flex-col md:flex-row md:items-center text-gray-600 mb-6 gap-2 md:gap-6">
            <div className="flex items-center">
              <span className="mr-1">📍</span> 
              <span>{getPropertyLocation()}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">🏠</span> 
              <span>{getPropertyType()}</span>
            </div>
            {getPropertyRating() && (
              <div className="flex items-center">
                <span className="mr-1">⭐</span> 
                <span>{getPropertyRating()} / 5</span>
              </div>
            )}
            
            {analysisData.status === "pending_manual_review" && (
              <div className="flex items-center text-amber-600 font-medium">
                <span className="mr-1">⚠️</span> 
                <span>Revisão manual necessária</span>
              </div>
            )}
          </div>
          
          {analyzing ? (
            <div className="p-6 border rounded-lg bg-gray-50">
              {analysisData.status === "pending_manual_review" || analysisData.status === "manual_review_requested" ? (
                <>
                  <div className="flex items-center gap-2 mb-4 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">Precisamos da sua ajuda</h2>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-700 mb-4">
                      Não conseguimos coletar automaticamente todos os dados da sua propriedade. 
                      Isso pode acontecer por diversos motivos:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600 mb-4">
                      <li>O link fornecido não está acessível</li>
                      <li>A página da propriedade tem uma estrutura diferente do esperado</li>
                      <li>A plataforma bloqueou nossa tentativa de coleta de dados</li>
                    </ul>
                    
                    {getErrorMessage() && (
                      <div className="bg-gray-100 p-3 rounded-md text-sm mb-4 overflow-auto">
                        <p className="font-medium text-gray-700">Detalhes técnicos:</p>
                        <p className="text-gray-600 font-mono">{getErrorMessage()}</p>
                      </div>
                    )}
                    
                    <p className="text-gray-700">
                      {analysisData.status === "manual_review_requested" ? 
                        "Seu pedido de análise manual foi registrado. Nossa equipe entrará em contato em breve." :
                        "Você pode solicitar uma análise manual pela nossa equipe ou tentar novamente com um link diferente."}
                    </p>
                  </div>
                  
                  {analysisData.status !== "manual_review_requested" && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={requestManualAnalysis}
                        className="bg-brand-blue hover:bg-blue-700"
                      >
                        Solicitar análise manual
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/">
                          Tentar com outro link
                        </Link>
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-4 text-center">Análise em Andamento</h2>
                  <ProcessingStatus 
                    status={analysisData.status} 
                    progressValue={progressValue} 
                    language="pt"
                  />
                  <div className="flex justify-center mt-4">
                    <Button onClick={handleRefresh} className="bg-brand-blue">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Verificar Status
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <AnalysisResultsViewer analysisData={analysisData} />
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalysisResult;

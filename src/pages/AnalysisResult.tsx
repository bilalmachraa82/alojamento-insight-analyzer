
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
  nome: string;
  email: string;
  link: string;
  plataforma: string;
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
  data_submissao: string;
  rgpd: boolean;
  scraped_data: ScrapedData | null;
}

// Define the structure of the scraped_data field
interface ScrapedData {
  property_data?: {
    name?: string;
    location?: string;
    type?: string;
    rating?: number;
  };
  error?: string;
  reason?: string;
  message?: string;
  url?: string;
  manual_review_requested_at?: string;
  [key: string]: any;
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

      // Type casting the scraped_data as our defined ScrapedData interface
      const scrapedData = data.scraped_data as ScrapedData | null;
      
      const processedData: AnalysisData = {
        id: data.id,
        nome: data.nome,
        email: data.email,
        link: data.link,
        plataforma: data.plataforma,
        status: data.status,
        analysis_result: data.analysis_result as AnalysisData['analysis_result'],
        data_submissao: data.data_submissao,
        rgpd: data.rgpd,
        scraped_data: scrapedData
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
      
      // Fix for the spread operator issue - properly handle scraped_data
      let updatedScrapedData: ScrapedData = {};
      
      // If scraped_data exists and is an object, copy its properties
      if (analysisData.scraped_data && typeof analysisData.scraped_data === 'object') {
        updatedScrapedData = { ...analysisData.scraped_data };
      }
      
      // Add the timestamp
      updatedScrapedData.manual_review_requested_at = new Date().toISOString();
      
      // Update the database with proper object handling
      await supabase
        .from("diagnostic_submissions")
        .update({ 
          status: "manual_review_requested",
          scraped_data: updatedScrapedData
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
           (analysisData.scraped_data?.property_data?.name) ||
           analysisData.link?.split('/').pop() || 
           "Sua Propriedade";
  };
  
  const getPropertyLocation = () => {
    if (!analysisData || (!analysisData.analysis_result?.property_data && !analysisData.scraped_data?.property_data)) {
      return "Localização Indisponível";
    }
    return analysisData.analysis_result?.property_data?.location || 
           (analysisData.scraped_data?.property_data?.location) ||
           "Localização Indisponível";
  };
  
  const getPropertyType = () => {
    if (!analysisData || (!analysisData.analysis_result?.property_data && !analysisData.scraped_data?.property_data)) {
      return "Alojamento";
    }
    return analysisData.analysis_result?.property_data?.property_type || 
           (analysisData.scraped_data?.property_data?.type) ||
           "Alojamento";
  };
  
  const getPropertyRating = () => {
    if (!analysisData || (!analysisData.analysis_result?.property_data && !analysisData.scraped_data?.property_data)) {
      return null;
    }
    return analysisData.analysis_result?.property_data?.rating || 
           (analysisData.scraped_data?.property_data?.rating) ||
           null;
  };

  // Função para mostrar detalhes do erro de coleta de dados
  const getScrapingErrorDetails = () => {
    if (!analysisData || !analysisData.scraped_data) return null;
    
    const scraped_data = analysisData.scraped_data;
    
    if (scraped_data.error) {
      try {
        // Tentar extrair uma mensagem de erro mais legível
        const errorJson = typeof scraped_data.error === 'string' 
          ? JSON.parse(scraped_data.error)
          : scraped_data.error;
          
        return errorJson.error?.message || scraped_data.error.toString() || "Erro ao coletar dados da propriedade";
      } catch (e) {
        return typeof scraped_data.error === 'string' ? scraped_data.error : "Erro ao processar os dados da propriedade";
      }
    }
    
    if (scraped_data.reason) {
      return `Motivo: ${scraped_data.reason}${scraped_data.message ? ` - ${scraped_data.message}` : ''}`;
    }
    
    return null;
  };

  const getScrapingErrorReason = () => {
    if (!analysisData || !analysisData.scraped_data) return null;
    
    const scraped_data = analysisData.scraped_data;
    
    if (scraped_data.reason === "incompatible_url") {
      return "URL incompatível";
    } else if (scraped_data.reason === "api_error") {
      return "Erro na API";
    } else if (scraped_data.error) {
      return "Erro técnico";
    }
    
    return "Erro desconhecido";
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
                    
                    {getScrapingErrorDetails() && (
                      <div className="bg-gray-100 p-3 rounded-md text-sm mb-4 overflow-auto">
                        <p className="font-medium text-gray-700">Detalhes técnicos: {getScrapingErrorReason()}</p>
                        <p className="text-gray-600 font-mono">{getScrapingErrorDetails()}</p>
                        {analysisData.scraped_data?.url && (
                          <p className="text-gray-600 mt-2">URL processada: <span className="font-mono">{analysisData.scraped_data.url}</span></p>
                        )}
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

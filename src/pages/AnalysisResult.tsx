
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import AnalysisResultsViewer from "@/components/results/AnalysisResultsViewer";
import { toast } from "@/components/ui/toast";
import { Json } from "@/integrations/supabase/types";
import { Progress } from "@/components/ui/progress";

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
  scraped_data: Json | null;
}

const AnalysisResult = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);

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

      // Convert data to the expected AnalysisData type
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
        scraped_data: data.scraped_data
      };
      
      setAnalysisData(processedData);

      // Check if we need to poll for status updates
      if (data.status !== "completed" && data.status !== "failed") {
        setAnalyzing(true);
        // Calculate progress value based on status
        switch (data.status) {
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
        
        // Start polling for status updates
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
      // Call the check-status edge function
      const { data, error } = await supabase.functions.invoke("check-status", {
        body: { id: submissionId }
      });

      if (error) throw error;

      if (data) {
        console.log("Status check response:", data);
        
        // Update progress based on status
        if (data.status === "scraping") {
          setProgressValue(50);
        } else if (data.status === "scraping_completed") {
          setProgressValue(60);
        } else if (data.status === "analyzing") {
          setProgressValue(80);
        } else if (data.status === "completed") {
          setProgressValue(100);
          setAnalyzing(false);
          
          // Refresh the data to get the completed analysis
          fetchAnalysisData();
          return; // Stop polling once completed
        }

        // Continue polling if not completed
        if (data.status !== "completed" && data.status !== "failed") {
          setTimeout(() => checkAnalysisStatus(submissionId), 5000);
        } else {
          setAnalyzing(false);
        }
      }
    } catch (err) {
      console.error("Error checking analysis status:", err);
      // We'll continue showing the current state without stopping the UI
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [id]);

  const handleRefresh = () => {
    setLoading(true);
    fetchAnalysisData();
  };
  
  // Get property name from analysis data, with fallback to URL
  const getPropertyName = () => {
    if (!analysisData) return "Propriedade";
    
    return analysisData.analysis_result?.property_data?.property_name || 
           analysisData.link?.split('/').pop() || 
           "Sua Propriedade";
  };
  
  // Get property location with fallback
  const getPropertyLocation = () => {
    if (!analysisData || !analysisData.analysis_result?.property_data) return "Localização Indisponível";
    return analysisData.analysis_result.property_data.location || "Localização Indisponível";
  };
  
  // Get property type with fallback
  const getPropertyType = () => {
    if (!analysisData || !analysisData.analysis_result?.property_data) return "Alojamento";
    return analysisData.analysis_result.property_data.property_type || "Alojamento";
  };
  
  // Get property rating with fallback
  const getPropertyRating = () => {
    if (!analysisData || !analysisData.analysis_result?.property_data) return null;
    return analysisData.analysis_result.property_data.rating || null;
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
      {/* Header */}
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

      {/* Content */}
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
          </div>
          
          {analyzing ? (
            <div className="p-6 border rounded-lg bg-gray-50">
              <h2 className="text-xl font-semibold mb-4 text-center">Análise em Andamento</h2>
              <Progress value={progressValue} className="h-2 mb-2" />
              <p className="text-center text-gray-600 mb-4">
                {progressValue < 50 && "Preparando para análise..."}
                {progressValue >= 50 && progressValue < 60 && "Coletando dados da propriedade..."}
                {progressValue >= 60 && progressValue < 80 && "Processando informações coletadas..."}
                {progressValue >= 80 && progressValue < 100 && "Gerando análise inteligente..."}
              </p>
              <div className="flex justify-center">
                <Button onClick={handleRefresh} className="bg-brand-blue">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verificar Status
                </Button>
              </div>
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

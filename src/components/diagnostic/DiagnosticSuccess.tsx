
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import SuccessMessage from "./SuccessMessage";
import { Language } from "./translations";

interface DiagnosticSuccessProps {
  submissionId: string;
  userName: string;
  language: Language;
  onReset: () => void;
}

interface ScrapingDetails {
  platform?: string;
  actor_id?: string;
  task_id?: string;
  run_id?: string;
  started_at?: string;
  status?: string;
}

const DiagnosticSuccess = ({ submissionId, userName, language, onReset }: DiagnosticSuccessProps) => {
  const navigate = useNavigate();
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [scrapingDetails, setScrapingDetails] = useState<ScrapingDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const checkProcessingStatus = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("diagnostic_submissions")
        .select("status, analysis_result, plataforma, scraped_data")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setProcessingStatus(data.status);
        
        // Extract scraping details from the data
        if (data.scraped_data && typeof data.scraped_data === 'object') {
          const scrapedData = data.scraped_data as Record<string, any>;
          
          setScrapingDetails({
            platform: data.plataforma,
            actor_id: getActorId(data.plataforma),
            task_id: scrapedData.apify_task_id,
            run_id: scrapedData.apify_run_id,
            started_at: scrapedData.started_at,
            status: data.status
          });
        }
        
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
          case "completed":
            setProgressValue(100);
            
            if (data.analysis_result && !window.localStorage.getItem(`shown-completion-${id}`)) {
              window.localStorage.setItem(`shown-completion-${id}`, 'true');
              toast({
                title: language === "en" ? "Analysis Complete!" : "Análise Concluída!",
                description: language === "en" 
                  ? "Your property diagnostic has been completed. You can now view the detailed results." 
                  : "O diagnóstico da sua propriedade foi concluído. Pode agora ver os resultados detalhados.",
                variant: "default",
              });
            }
            break;
          default:
            setProgressValue(20);
        }

        if (data.status !== "completed") {
          setTimeout(() => checkProcessingStatus(id), 5000);
        }
      }
    } catch (error) {
      console.error("Error checking status:", error);
    }
  };

  // Helper function to get the actor ID based on platform
  const getActorId = (platform: string): string => {
    switch (platform.toLowerCase()) {
      case "airbnb":
        return "apify/airbnb-scraper";
      case "booking":
        return "apify/booking-hotels-scraper";
      case "vrbo":
        return "apify/vrbo-scraper";
      default:
        return "apify/web-scraper";
    }
  };

  useEffect(() => {
    if (submissionId) {
      checkProcessingStatus(submissionId);
    }
  }, [submissionId]);

  const handleViewResults = () => {
    navigate(`/results/${submissionId}`);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <SuccessMessage
        userName={userName}
        language={language}
        progressValue={progressValue}
        processingStatus={processingStatus}
        onReset={onReset}
        onViewResults={handleViewResults}
      />
      
      {scrapingDetails && (
        <div className="mt-4">
          <button 
            onClick={toggleDetails} 
            className="text-sm text-brand-blue hover:underline flex items-center"
          >
            {showDetails ? (
              <span>{language === "en" ? "Hide Technical Details" : "Ocultar Detalhes Técnicos"}</span>
            ) : (
              <span>{language === "en" ? "Show Technical Details" : "Mostrar Detalhes Técnicos"}</span>
            )}
          </button>
          
          {showDetails && (
            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md text-xs font-mono">
              <h4 className="font-semibold mb-2">{language === "en" ? "Scraping Details" : "Detalhes de Scraping"}</h4>
              <ul className="space-y-1">
                <li><span className="text-gray-500">Platform:</span> {scrapingDetails.platform}</li>
                <li><span className="text-gray-500">Apify Actor:</span> {scrapingDetails.actor_id}</li>
                <li><span className="text-gray-500">Task ID:</span> {scrapingDetails.task_id || "Not started"}</li>
                <li><span className="text-gray-500">Run ID:</span> {scrapingDetails.run_id || "Not started"}</li>
                <li><span className="text-gray-500">Started at:</span> {formatDate(scrapingDetails.started_at)}</li>
                <li><span className="text-gray-500">Status:</span> {scrapingDetails.status}</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosticSuccess;


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
  const [checkingStatus, setCheckingStatus] = useState(false);
  // Use this flag to track if we've shown the completion toast
  const [completionToastShown, setCompletionToastShown] = useState(false);

  const checkProcessingStatus = async (id: string) => {
    if (checkingStatus) return; // Prevent multiple simultaneous checks
    
    try {
      setCheckingStatus(true);
      
      console.log("Checking status for submission:", id);
      
      // First, check from database directly (faster response)
      const { data: dbData, error: dbError } = await supabase
        .from("diagnostic_submissions")
        .select("status, analysis_result, plataforma, scraped_data")
        .eq("id", id)
        .single();

      if (dbError) throw dbError;

      if (dbData) {
        setProcessingStatus(dbData.status);
        
        // Extract scraping details from the data
        if (dbData.scraped_data && typeof dbData.scraped_data === 'object') {
          const scrapedData = dbData.scraped_data as Record<string, any>;
          
          setScrapingDetails({
            platform: dbData.plataforma,
            actor_id: getActorId(dbData.plataforma),
            task_id: scrapedData.apify_task_id,
            run_id: scrapedData.apify_run_id,
            started_at: scrapedData.started_at,
            status: dbData.status
          });
        }

        // Handle immediate completed state from database
        if (dbData.status === "completed" && !completionToastShown) {
          setProgressValue(100);
          setCompletionToastShown(true);
          
          toast({
            title: language === "en" ? "Analysis Complete!" : "Análise Concluída!",
            description: language === "en" 
              ? "Your property diagnostic has been completed. Redirecting to results..."
              : "O diagnóstico da sua propriedade foi concluído. A redirecionar para os resultados...",
            variant: "default",
          });
          
          // Short delay before navigation to let the toast be visible
          setTimeout(() => navigate(`/results/${id}`), 2000);
          return;
        }
      }

      // If not completed, also check with the status function for more detailed status information
      const { data: statusData, error: statusError } = await supabase.functions.invoke("check-status", {
        body: { id }
      });

      if (statusError) throw statusError;

      if (statusData) {
        console.log("Status check response:", statusData);
        setProcessingStatus(statusData.status);
        
        switch (statusData.status) {
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
            
            // Automatically navigate to results page when analysis is complete
            if (!completionToastShown) {
              setCompletionToastShown(true);
              
              toast({
                title: language === "en" ? "Analysis Complete!" : "Análise Concluída!",
                description: language === "en" 
                  ? "Your property diagnostic has been completed. Redirecting to results..."
                  : "O diagnóstico da sua propriedade foi concluído. A redirecionar para os resultados...",
                variant: "default",
              });
              
              // Longer delay for edge function completion
              setTimeout(() => navigate(`/results/${id}`), 2000);
              return;
            }
            break;
          default:
            setProgressValue(20);
        }

        // Continue checking status at regular intervals if not completed
        if (statusData.status !== "completed" && statusData.status !== "failed") {
          setTimeout(() => {
            setCheckingStatus(false);
            checkProcessingStatus(id);
          }, 5000);
        } else {
          setCheckingStatus(false);
        }
      }
    } catch (error) {
      console.error("Error checking status:", error);
      setCheckingStatus(false);
      // Still continue checking on error, but with a longer delay
      setTimeout(() => checkProcessingStatus(id), 10000);
    }
  };

  // Helper function to get the actor ID based on platform
  const getActorId = (platform: string): string => {
    switch (platform?.toLowerCase()) {
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
    
    // Clean up function to prevent memory leaks
    return () => {
      // No need to clear any timeout as they're function-scoped in checkProcessingStatus
    };
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
        submissionId={submissionId}
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

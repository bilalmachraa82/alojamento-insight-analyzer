
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

const DiagnosticSuccess = ({ submissionId, userName, language, onReset }: DiagnosticSuccessProps) => {
  const navigate = useNavigate();
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);

  const checkProcessingStatus = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("diagnostic_submissions")
        .select("status, analysis_result")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setProcessingStatus(data.status);
        
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

  useEffect(() => {
    if (submissionId) {
      checkProcessingStatus(submissionId);
    }
  }, [submissionId]);

  const handleViewResults = () => {
    navigate(`/results/${submissionId}`);
  };

  return (
    <SuccessMessage
      userName={userName}
      language={language}
      progressValue={progressValue}
      processingStatus={processingStatus}
      onReset={onReset}
      onViewResults={handleViewResults}
    />
  );
};

export default DiagnosticSuccess;

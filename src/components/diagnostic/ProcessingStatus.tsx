
import { Progress } from "@/components/ui/progress";
import { translations, Language } from "./translations";
import { Loader2, AlertTriangle } from "lucide-react";

interface ProcessingStatusProps {
  status: string | null;
  progressValue: number;
  language: Language;
}

const ProcessingStatus = ({ status, progressValue, language }: ProcessingStatusProps) => {
  const t = translations[language];

  const getStatusText = () => {
    if (!status) return "";
    
    switch (status) {
      case "pending":
        return t.statusPending;
      case "processing":
        return t.statusProcessing;
      case "scraping":
        return t.statusScraping;
      case "scraping_completed":
        return t.statusScraping;
      case "analyzing":
        return t.statusAnalyzing;
      case "pending_manual_review":
        return language === "pt" 
          ? "É necessária revisão manual da sua propriedade" 
          : "Manual review of your property is needed";
      case "manual_review_requested":
        return language === "pt" 
          ? "Análise manual solicitada" 
          : "Manual review requested";
      case "completed":
        return t.statusCompleted;
      default:
        return t.statusPending;
    }
  };

  const isManualReview = status === "pending_manual_review" || status === "manual_review_requested";

  return (
    <div className="mt-4 mb-4">
      <Progress value={progressValue} className="h-2" />
      <div className="flex items-center gap-2 mt-2">
        {isManualReview ? (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        ) : progressValue < 100 ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
        <p className={`text-sm ${isManualReview ? "text-amber-600" : "text-muted-foreground"}`}>
          {getStatusText()}
        </p>
      </div>
    </div>
  );
};

export default ProcessingStatus;

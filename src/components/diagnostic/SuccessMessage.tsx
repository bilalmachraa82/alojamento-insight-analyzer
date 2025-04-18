
import { Check, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translations, Language } from "./translations";
import ProcessingStatus from "./ProcessingStatus";

interface SuccessMessageProps {
  userName: string;
  language: Language;
  progressValue: number;
  processingStatus: string | null;
  onReset: () => void;
  onViewResults: () => void;
  submissionId: string;
}

const SuccessMessage = ({ 
  userName, 
  language, 
  progressValue, 
  processingStatus,
  onReset,
  onViewResults,
  submissionId
}: SuccessMessageProps) => {
  const t = translations[language];

  return (
    <div className="bg-green-50 p-6 rounded-lg border border-green-100 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
        {progressValue < 100 ? (
          <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
        ) : (
          <Check className="h-6 w-6 text-green-600" />
        )}
      </div>
      
      <h3 className="text-lg font-medium text-green-800">{t.success}</h3>
      
      <ProcessingStatus 
        status={processingStatus}
        progressValue={progressValue}
        language={language}
      />
      
      <p className="mt-2 text-sm text-green-600">
        {t.thankYou.replace("{name}", userName)}
      </p>
      
      <div className="mt-4 flex flex-col gap-3 justify-center">
        <Button 
          onClick={onViewResults} 
          className="w-full bg-brand-blue hover:bg-opacity-90 text-white"
        >
          {t.viewResults}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        
        <Button 
          onClick={onReset}
          variant="outline"
        >
          {t.sendAnother}
        </Button>
        
        {submissionId && (
          <p className="text-xs text-gray-500 mt-2">
            ID: {submissionId}
          </p>
        )}
      </div>
    </div>
  );
};

export default SuccessMessage;

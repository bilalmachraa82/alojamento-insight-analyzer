import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StuckSubmission {
  id: string;
  email: string;
  property_url: string;
  platform: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface ReprocessResult {
  id: string;
  success: boolean;
  error?: string;
}

export function useBatchReprocess() {
  const [isLoading, setIsLoading] = useState(false);
  const [stuckSubmissions, setStuckSubmissions] = useState<StuckSubmission[]>([]);
  const [reprocessResults, setReprocessResults] = useState<ReprocessResult[]>([]);
  const { toast } = useToast();

  const fetchStuckSubmissions = async (limit = 50) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-batch-reprocess", {
        body: { action: "get_stuck", limit }
      });

      if (error) throw error;

      setStuckSubmissions(data.submissions || []);
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao buscar submissões",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reprocessAll = async (limit = 10) => {
    setIsLoading(true);
    setReprocessResults([]);
    
    try {
      const { data, error } = await supabase.functions.invoke("admin-batch-reprocess", {
        body: { action: "reprocess_all", limit }
      });

      if (error) throw error;

      setReprocessResults(data.results || []);
      
      toast({
        title: "Reprocessamento concluído",
        description: `${data.successCount} sucesso, ${data.errorCount} erros de ${data.total} total`,
        variant: data.errorCount > 0 ? "destructive" : "default"
      });

      // Refresh stuck submissions list
      await fetchStuckSubmissions();
      
      return data;
    } catch (error: any) {
      toast({
        title: "Erro no reprocessamento",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reprocessSingle = async (submissionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-batch-reprocess", {
        body: { action: "reprocess_single", submissionId }
      });

      if (error) throw error;

      toast({
        title: "Reprocessamento iniciado",
        description: `Submissão ${submissionId.slice(0, 8)}... sendo reprocessada`
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao reprocessar",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    isLoading,
    stuckSubmissions,
    reprocessResults,
    fetchStuckSubmissions,
    reprocessAll,
    reprocessSingle
  };
}


import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FormValues, supportedPlatforms } from "./schema";
import { useToast } from "@/components/ui/use-toast";
import { Language } from "./translations";

export const useFormSubmission = (language: Language) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const { toast } = useToast();

  const sendConfirmationEmail = async (email: string, name: string, submissionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-diagnostic-email", {
        body: {
          email,
          name,
          submissionId,
          language
        }
      });

      if (error) {
        console.error("Error sending confirmation email:", error);
        toast({
          variant: "destructive",
          title: language === "en" ? "Email notification failed" : "Falha na notificação por e-mail",
          description: language === "en" 
            ? "We couldn't send you a confirmation email, but your submission was processed successfully." 
            : "Não conseguimos enviar-lhe um e-mail de confirmação, mas a sua submissão foi processada com sucesso.",
        });
        return false;
      }

      return true;
    } catch (err) {
      console.error("Exception sending confirmation email:", err);
      return false;
    }
  };

  const validateUrl = (url: string, platform: string): boolean => {
    // Booking.com specific validation
    if (platform.toLowerCase() === "booking") {
      if (url.includes("booking.com/share-") || url.includes("booking.com/Share-")) {
        toast({
          title: language === "en" ? "⚠️ Shortened Link Not Allowed" : "⚠️ Link Encurtado Não Permitido",
          description: language === "en" 
            ? "Please use the complete URL from the property page, not a shortened link." 
            : "Por favor, use o URL completo da página da propriedade, não um link encurtado.",
          variant: "destructive",
          duration: 8000,
        });
        return false;
      }
      
      // Check if it's a standard Booking.com property URL
      if (!url.includes("booking.com/hotel/")) {
        toast({
          title: language === "en" ? "⚠️ Invalid Booking.com URL" : "⚠️ URL do Booking.com Inválido",
          description: language === "en" 
            ? "The URL should be from a property page (usually contains '/hotel/' in the path)" 
            : "O URL deve ser de uma página de propriedade (geralmente contém '/hotel/' no caminho)",
          variant: "destructive",
          duration: 8000,
        });
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (data: FormValues) => {
    // Trim the URL to remove any leading/trailing whitespace
    const trimmedUrl = data.link.trim();
    
    // Enhanced URL validation
    if (!validateUrl(trimmedUrl, data.plataforma)) {
      return; 
    }
    
    setIsLoading(true);
    try {
      const normalizedPlatform = data.plataforma.toLowerCase();
      const platformInfo = supportedPlatforms.find(p => p.value === normalizedPlatform);
      
      if (!platformInfo) {
        throw new Error(language === "en" ? "Unsupported platform" : "Plataforma não suportada");
      }
      
      // Submit via secure edge function
      const { data: submissionResponse, error: submissionError } = await supabase.functions.invoke("submit-diagnostic", {
        body: {
          name: data.nome,
          email: data.email,
          property_url: trimmedUrl,
          platform: platformInfo.value
        }
      });

      if (submissionError) {
        console.error("Submission error:", submissionError);
        throw submissionError;
      }

      if (!submissionResponse?.success) {
        throw new Error(submissionResponse?.error || "Submission failed");
      }

      const newSubmissionId = submissionResponse.submissionId;
      setSubmissionId(newSubmissionId);
      
      // Send confirmation email (non-blocking)
      sendConfirmationEmail(data.email, data.nome, newSubmissionId)
        .catch(e => {
          console.error("Email sending error caught:", e);
        });
      
      // Show success message
      setIsSuccess(true);
      toast({
        title: language === "en" ? "Diagnostic submitted successfully!" : "Diagnóstico enviado com sucesso!",
        description: language === "en" 
          ? `Thank you! We're processing your smart diagnostic. You'll receive your personalized plan by email soon.`
          : `Obrigado! Estamos a processar o seu diagnóstico inteligente. Em breve receberá o seu plano personalizado por email.`,
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        variant: "destructive",
        title: language === "en" ? "Error" : "Erro",
        description: language === "en" 
          ? "An error occurred while submitting the form. Please try again." 
          : "Ocorreu um erro ao enviar o formulário. Por favor, tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isSuccess,
    submissionId,
    handleSubmit,
  };
};

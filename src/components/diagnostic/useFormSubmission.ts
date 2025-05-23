
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
      console.log("Sending confirmation email to:", email);
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

      console.log("Confirmation email sent:", data);
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
    console.log("Form data being submitted:", data);
    
    // Trim the URL to remove any leading/trailing whitespace
    const trimmedUrl = data.link.trim();
    
    // Enhanced URL validation
    if (!validateUrl(trimmedUrl, data.plataforma)) {
      return; 
    }
    
    setIsLoading(true);
    try {
      const currentDate = new Date().toISOString();
      const normalizedPlatform = data.plataforma.toLowerCase();
      const platformInfo = supportedPlatforms.find(p => p.value === normalizedPlatform);
      
      if (!platformInfo) {
        throw new Error(language === "en" ? "Unsupported platform" : "Plataforma não suportada");
      }
      
      const { data: submissionData, error } = await supabase
        .from("diagnostic_submissions")
        .insert({
          nome: data.nome,
          email: data.email,
          link: trimmedUrl, // Use the trimmed URL
          plataforma: platformInfo.value,
          rgpd: data.rgpd,
          data_submissao: currentDate,
          status: "pending"
        })
        .select();

      if (error) throw error;

      const newSubmissionId = submissionData[0].id;
      setSubmissionId(newSubmissionId);
      
      sendConfirmationEmail(data.email, data.nome, newSubmissionId)
        .then(emailSuccess => {
          if (emailSuccess) {
            console.log("Email sent successfully");
          }
        })
        .catch(e => {
          console.error("Email sending error caught:", e);
        });
      
      try {
        const { data: functionData, error: functionError } = await supabase.functions.invoke("process-diagnostic", {
          body: { id: newSubmissionId }
        });
  
        if (functionError) {
          console.error("Function error:", functionError);
          setIsSuccess(true);
          toast({
            title: language === "en" ? "Diagnostic submitted!" : "Diagnóstico enviado!",
            description: language === "en" 
              ? "Your submission was received, but there was a processing delay. Our team will review it shortly."
              : "A sua submissão foi recebida, mas houve um atraso no processamento. A nossa equipa irá analisá-la em breve.",
            variant: "default",
          });
          return;
        }
        
        if (!functionData?.success) {
          console.error("Function response error:", functionData);
          setIsSuccess(true);
          toast({
            title: language === "en" ? "Diagnostic submitted!" : "Diagnóstico enviado!",
            description: language === "en" 
              ? "Your submission was received and will be processed manually by our team."
              : "A sua submissão foi recebida e será processada manualmente pela nossa equipa.",
            variant: "default",
          });
          return;
        }
        
        setIsSuccess(true);
        
        toast({
          title: language === "en" ? "Diagnostic submitted successfully!" : "Diagnóstico enviado com sucesso!",
          description: language === "en" 
            ? `Thank you! We're processing your smart diagnostic. You'll receive your personalized plan by email soon.`
            : `Obrigado! Estamos a processar o seu diagnóstico inteligente. Em breve receberá o seu plano personalizado por email.`,
          variant: "default",
        });
      } catch (functionError) {
        console.error("Error calling function:", functionError);
        setIsSuccess(true);
        toast({
          title: language === "en" ? "Diagnostic submitted!" : "Diagnóstico enviado!",
          description: language === "en" 
            ? "Your submission was received successfully. You can check the status later."
            : "A sua submissão foi recebida com sucesso. Pode verificar o estado mais tarde.",
          variant: "default",
        });
      }
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

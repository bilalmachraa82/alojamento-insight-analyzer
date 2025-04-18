
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { translations, Language } from "./diagnostic/translations";
import DiagnosticSuccess from "./diagnostic/DiagnosticSuccess";
import DiagnosticFormFields from "./diagnostic/DiagnosticFormFields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { createFormSchema, FormValues, supportedPlatforms } from "./diagnostic/schema";

interface DiagnosticFormProps {
  language: Language;
}

const DiagnosticForm: React.FC<DiagnosticFormProps> = ({ language }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  
  const t = translations[language];
  const formSchema = createFormSchema(language);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      link: "",
      plataforma: "",
      rgpd: false,
    },
  });

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
        // We'll continue with the form submission even if email fails
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
      // We'll continue with the form submission even if email fails
      return false;
    }
  };

  async function onSubmit(data: FormValues) {
    console.log("Form data being submitted:", data);
    setIsLoading(true);
    try {
      const currentDate = new Date().toISOString();
      
      // Normalize platform to lowercase to prevent case issues
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
          link: data.link,
          plataforma: platformInfo.value, // Use the standardized platform value
          rgpd: data.rgpd,
          data_submissao: currentDate,
          status: "pending"
        })
        .select();

      if (error) throw error;

      const newSubmissionId = submissionData[0].id;
      setSubmissionId(newSubmissionId);
      
      // Send confirmation email (but don't wait for it to complete the main flow)
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
          // Even if processing fails, show success for the form submission
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
          // Show success but with a notification that processing will be manual
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
          description: t.thankYou.replace("{name}", data.nome),
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
  }

  if (isSuccess && submissionId) {
    return (
      <DiagnosticSuccess
        submissionId={submissionId}
        userName={form.getValues("nome")}
        language={language}
        onReset={() => {
          setIsSuccess(false);
          setSubmissionId(null);
          form.reset();
        }}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DiagnosticFormFields form={form} language={language} />
        
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full bg-brand-pink hover:bg-opacity-90 text-brand-black font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.processing}
            </>
          ) : (
            t.submit
          )}
        </Button>
      </form>
    </Form>
  );
}

export default DiagnosticForm;

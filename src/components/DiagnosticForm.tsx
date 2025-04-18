
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
import { createFormSchema, FormValues } from "./diagnostic/schema";

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

  async function onSubmit(data: FormValues) {
    console.log("Form data being submitted:", data);
    setIsLoading(true);
    try {
      const currentDate = new Date().toISOString();
      
      const { data: submissionData, error } = await supabase
        .from("diagnostic_submissions")
        .insert({
          nome: data.nome,
          email: data.email,
          link: data.link,
          plataforma: data.plataforma,
          rgpd: data.rgpd,
          data_submissao: currentDate,
          status: "pending"
        })
        .select();

      if (error) throw error;

      const newSubmissionId = submissionData[0].id;
      setSubmissionId(newSubmissionId);
      
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
          console.error("Function response error:", functionError);
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
};

export default DiagnosticForm;

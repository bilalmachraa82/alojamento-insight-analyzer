
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { translations, Language } from "./diagnostic/translations";
import SuccessMessage from "./diagnostic/SuccessMessage";
import DiagnosticFormField from "./diagnostic/FormField";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Form, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage, 
  FormField 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DiagnosticFormProps {
  language: Language;
}

const DiagnosticForm: React.FC<DiagnosticFormProps> = ({ language }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  
  const t = translations[language];
  
  const formSchema = z.object({
    nome: z.string().min(2, {
      message: t.nameError,
    }),
    email: z.string().email({
      message: t.emailError,
    }),
    link: z.string().url({
      message: t.urlError,
    }),
    plataforma: z.string({
      required_error: t.platformError,
    }),
    rgpd: z.boolean().refine((val) => val === true, {
      message: t.gdprError,
    }),
  });

  type FormValues = z.infer<typeof formSchema>;

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
      
      const response = await supabase.functions.invoke("process-diagnostic", {
        body: { id: newSubmissionId }
      });

      if (!response.data?.success) {
        throw new Error(response.error?.message || "Failed to start processing");
      }

      setIsSuccess(true);
      setProcessingStatus("pending");
      setProgressValue(25);
      checkProcessingStatus(newSubmissionId);

      toast({
        title: language === "en" ? "Diagnostic submitted successfully!" : "Diagnóstico enviado com sucesso!",
        description: t.thankYou.replace("{name}", data.nome),
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
  }

  const handleViewResults = () => {
    if (submissionId) {
      navigate(`/results/${submissionId}`);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto" id="diagnosticoForm">
      {!isSuccess ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DiagnosticFormField
              form={form}
              name="nome"
              label={t.name}
            >
              <Input placeholder={t.namePlaceholder} />
            </DiagnosticFormField>

            <DiagnosticFormField
              form={form}
              name="email"
              label={t.email}
            >
              <Input placeholder={t.emailPlaceholder} type="email" />
            </DiagnosticFormField>

            <DiagnosticFormField
              form={form}
              name="link"
              label={t.link}
            >
              <Input placeholder={t.linkPlaceholder} type="url" />
            </DiagnosticFormField>

            <FormField
              control={form.control}
              name="plataforma"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.platform}</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "en" ? "Select a platform" : "Selecione uma plataforma"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Booking">Booking</SelectItem>
                      <SelectItem value="Airbnb">Airbnb</SelectItem>
                      <SelectItem value="Vrbo">Vrbo</SelectItem>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Outro">{language === "en" ? "Other" : "Outro"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rgpd"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t.gdpr}
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

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
      ) : (
        <SuccessMessage
          userName={form.getValues("nome")}
          language={language}
          progressValue={progressValue}
          processingStatus={processingStatus}
          onReset={() => {
            setIsSuccess(false);
            setProcessingStatus(null);
            setProgressValue(0);
            form.reset();
          }}
          onViewResults={handleViewResults}
        />
      )}
    </div>
  );
};

export default DiagnosticForm;

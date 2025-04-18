
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Check, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface DiagnosticFormProps {
  language: "en" | "pt";
}

const DiagnosticForm: React.FC<DiagnosticFormProps> = ({ language }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  
  const translations = {
    en: {
      name: "Name",
      namePlaceholder: "Ex: John Smith",
      email: "Email",
      emailPlaceholder: "Ex: john@email.com",
      link: "Property link",
      linkPlaceholder: "https://www.booking.com/...",
      platform: "Main platform",
      gdpr: "I agree that my data can be used for contact and diagnostic purposes",
      submit: "Generate Analysis",
      processing: "Processing...",
      success: "Diagnostic Sent!",
      thankYou: "Thank you, {name}. We are processing your smart diagnostic. Soon, you will receive your personalized plan in your email.",
      sendAnother: "Send another diagnostic",
      emailError: "Please enter a valid email.",
      nameError: "Name must be at least 2 characters.",
      urlError: "Please enter a valid URL.",
      platformError: "Please select a platform.",
      gdprError: "You must accept the GDPR policy to continue.",
      statusPending: "Preparing your diagnostic...",
      statusProcessing: "Analyzing your property...",
      statusScraping: "Gathering property data...",
      statusAnalyzing: "Creating your personalized plan...",
      statusCompleted: "Analysis complete! Check your email soon."
    },
    pt: {
      name: "Nome",
      namePlaceholder: "Ex: Ana Costa",
      email: "Email",
      emailPlaceholder: "Ex: ana@email.com",
      link: "Link da propriedade",
      linkPlaceholder: "https://www.booking.com/...",
      platform: "Plataforma principal",
      gdpr: "Aceito que os meus dados sejam usados para contacto e envio do diagnóstico",
      submit: "Gerar Análise",
      processing: "A processar...",
      success: "Diagnóstico Enviado!",
      thankYou: "Obrigado, {name}. Estamos a processar o teu diagnóstico inteligente. Em breve, receberás o plano personalizado no teu email.",
      sendAnother: "Enviar outro diagnóstico",
      emailError: "Por favor insira um email válido.",
      nameError: "O nome deve ter pelo menos 2 caracteres.",
      urlError: "Por favor insira um URL válido.",
      platformError: "Por favor selecione uma plataforma.",
      gdprError: "Deve aceitar a política de RGPD para continuar.",
      statusPending: "A preparar o seu diagnóstico...",
      statusProcessing: "A analisar a sua propriedade...",
      statusScraping: "A recolher dados da propriedade...",
      statusAnalyzing: "A criar o seu plano personalizado...",
      statusCompleted: "Análise completa! Verifique o seu email em breve."
    }
  };
  
  const t = language === "en" ? translations.en : translations.pt;
  
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
      rgpd: false,
    },
  });

  // Function to update processing status
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
        
        // Update progress based on status
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
            
            // If analysis is complete, show success toast with link to results
            if (data.analysis_result && !window.localStorage.getItem(`shown-completion-${id}`)) {
              window.localStorage.setItem(`shown-completion-${id}`, 'true');
              toast({
                title: language === "en" ? "Analysis Complete!" : "Análise Concluída!",
                description: language === "en" 
                  ? "Your property diagnostic has been completed. We've sent the results to your email." 
                  : "O diagnóstico da sua propriedade foi concluído. Enviámos os resultados para o seu email.",
                variant: "success",
              });
            }
            break;
          default:
            setProgressValue(20);
        }

        // If not completed, check again in 5 seconds
        if (data.status !== "completed") {
          setTimeout(() => checkProcessingStatus(id), 5000);
        }
      }
    } catch (error) {
      console.error("Error checking status:", error);
    }
  };

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      // Current date in ISO format
      const currentDate = new Date().toISOString();
      
      // Insert data into Supabase
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

      // Get the submission ID
      const newSubmissionId = submissionData[0].id;
      setSubmissionId(newSubmissionId);
      
      // Trigger the processing function
      const response = await supabase.functions.invoke("process-diagnostic", {
        body: { id: newSubmissionId }
      });

      if (!response.data?.success) {
        throw new Error(response.error?.message || "Failed to start processing");
      }

      // Show success message and start checking status
      setIsSuccess(true);
      setProcessingStatus("pending");
      setProgressValue(25);
      checkProcessingStatus(newSubmissionId);

      toast({
        title: language === "en" ? "Diagnostic submitted successfully!" : "Diagnóstico enviado com sucesso!",
        description: t.thankYou.replace("{name}", data.nome),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: language === "en" ? "Error" : "Erro",
        description: language === "en" 
          ? "An error occurred while submitting the form. Please try again." 
          : "Ocorreu um erro ao enviar o formulário. Por favor, tente novamente.",
      });
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Helper function to get status text based on current status
  const getStatusText = () => {
    if (!processingStatus) return "";
    
    switch (processingStatus) {
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
      case "completed":
        return t.statusCompleted;
      default:
        return t.statusPending;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto" id="diagnosticoForm">
      {!isSuccess ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.name}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.namePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.email}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.emailPlaceholder} {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.link}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.linkPlaceholder} {...field} type="url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plataforma"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.platform}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        <div className="bg-green-50 p-6 rounded-lg border border-green-100 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
            {progressValue < 100 ? (
              <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
            ) : (
              <Check className="h-6 w-6 text-green-600" />
            )}
          </div>
          <h3 className="text-lg font-medium text-green-800">{t.success}</h3>
          
          <div className="mt-4 mb-4">
            <Progress value={progressValue} className="h-2" />
            <p className="mt-2 text-sm text-green-600">
              {getStatusText()}
            </p>
          </div>
          
          <p className="mt-2 text-sm text-green-600">
            {t.thankYou.replace("{name}", form.getValues("nome"))}
          </p>
          <Button 
            onClick={() => {
              setIsSuccess(false);
              setProcessingStatus(null);
              setProgressValue(0);
              form.reset();
            }} 
            variant="outline"
            className="mt-4"
          >
            {t.sendAnother}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DiagnosticForm;

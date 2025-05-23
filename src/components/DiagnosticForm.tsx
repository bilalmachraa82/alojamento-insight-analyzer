
import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { translations, Language } from "./diagnostic/translations";
import DiagnosticSuccess from "./diagnostic/DiagnosticSuccess";
import DiagnosticFormFields from "./diagnostic/DiagnosticFormFields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { createFormSchema, FormValues } from "./diagnostic/schema";
import { BookingWarning } from "./diagnostic/BookingWarning";
import { useFormSubmission } from "./diagnostic/useFormSubmission";
import { useToast } from "@/components/ui/use-toast";

interface DiagnosticFormProps {
  language: Language;
}

const DiagnosticForm: React.FC<DiagnosticFormProps> = ({ language }) => {
  const [showBookingWarning, setShowBookingWarning] = useState(false);
  const { isLoading, isSuccess, submissionId, handleSubmit } = useFormSubmission(language);
  const { toast } = useToast();
  
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

  // Watch for platform changes to show warnings
  const selectedPlatform = form.watch("plataforma");
  const propertyLink = form.watch("link");
  
  useEffect(() => {
    if (selectedPlatform?.toLowerCase() === "booking") {
      setShowBookingWarning(true);
    } else {
      setShowBookingWarning(false);
    }
  }, [selectedPlatform]);
  
  useEffect(() => {
    // Check for Booking.com share links or other problematic URL patterns
    if (propertyLink) {
      // Trim the URL to check it without whitespace
      const trimmedLink = propertyLink.trim();
      
      if (trimmedLink.includes("booking.com/share-") || trimmedLink.includes("booking.com/Share-")) {
        toast({
          title: language === "en" ? "⚠️ Shortened Link Detected" : "⚠️ Link Encurtado Detectado",
          description: language === "en" 
            ? "Please use the complete URL from the property page, not a shortened link. Shortened links may cause errors." 
            : "Por favor, use o URL completo da página da propriedade, não um link encurtado. Links encurtados podem causar erros.",
          variant: "destructive", // Changed from "warning" to "destructive"
          duration: 10000,
        });
      }
      
      // Additional check for invalid URL formats that might not be caught by the schema
      if (selectedPlatform?.toLowerCase() === "booking" && 
          !trimmedLink.includes("booking.com/hotel/") && 
          trimmedLink.startsWith("http")) {
        toast({
          title: language === "en" ? "⚠️ Invalid Booking URL Format" : "⚠️ Formato de URL do Booking Inválido",
          description: language === "en" 
            ? "The URL should be from a property page (usually contains '/hotel/' in the path)" 
            : "O URL deve ser de uma página de propriedade (geralmente contém '/hotel/' no caminho)",
          variant: "destructive", // Changed from "warning" to "destructive"
          duration: 10000,
        });
      }
    }
  }, [propertyLink, selectedPlatform, language, toast]);

  if (isSuccess && submissionId) {
    return (
      <DiagnosticSuccess
        submissionId={submissionId}
        userName={form.getValues("nome")}
        language={language}
        onReset={() => {
          form.reset();
        }}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <BookingWarning 
          show={showBookingWarning} 
          language={language}
        />
        
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


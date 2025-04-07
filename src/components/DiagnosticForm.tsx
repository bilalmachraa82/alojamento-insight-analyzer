
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Check, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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

const formSchema = z.object({
  nome: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor insira um email válido.",
  }),
  link: z.string().url({
    message: "Por favor insira um URL válido.",
  }),
  plataforma: z.string({
    required_error: "Por favor selecione uma plataforma.",
  }),
  rgpd: z.boolean().refine((val) => val === true, {
    message: "Deve aceitar a política de RGPD para continuar.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function DiagnosticForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      link: "",
      rgpd: false,
    },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      // Current date in ISO format
      const currentDate = new Date().toISOString();
      
      // Prepare the payload as specified in the requirements
      const payload = {
        nome: data.nome,
        email: data.email,
        link: data.link,
        plataforma: data.plataforma,
        rgpd: data.rgpd,
        data_submissao: currentDate,
      };

      // Send the data to the webhook
      const response = await fetch(
        "https://teu-n8n-instance.com/webhook/diagnostico-al",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao enviar o formulário.");
      }

      setIsSuccess(true);
      toast({
        title: "Diagnóstico enviado com sucesso!",
        description: `Obrigado, ${data.nome}. Estamos a processar o teu diagnóstico inteligente. Em breve, receberás o plano personalizado no teu email.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao enviar o formulário. Por favor, tente novamente.",
      });
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {!isSuccess ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ana Costa" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: ana@email.com" {...field} type="email" />
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
                  <FormLabel>Link da propriedade</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.booking.com/..." {...field} type="url" />
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
                  <FormLabel>Plataforma principal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma plataforma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Booking">Booking</SelectItem>
                      <SelectItem value="Airbnb">Airbnb</SelectItem>
                      <SelectItem value="Vrbo">Vrbo</SelectItem>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
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
                      Aceito que os meus dados sejam usados para contacto e envio do diagnóstico
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
                  A processar...
                </>
              ) : (
                "Gerar Análise"
              )}
            </Button>
          </form>
        </Form>
      ) : (
        <div className="bg-green-50 p-6 rounded-lg border border-green-100 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-green-800">Diagnóstico Enviado!</h3>
          <p className="mt-2 text-sm text-green-600">
            Obrigado, {form.getValues("nome")}. Estamos a processar o teu diagnóstico inteligente. 
            Em breve, receberás o plano personalizado no teu email.
          </p>
          <Button 
            onClick={() => {
              setIsSuccess(false);
              form.reset();
            }} 
            variant="outline"
            className="mt-4"
          >
            Enviar outro diagnóstico
          </Button>
        </div>
      )}
    </div>
  );
}

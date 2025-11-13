
import { UseFormReturn } from "react-hook-form";
import { Language, translations } from "./translations";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormValues, supportedPlatforms } from "./schema";
import { User, Mail, Link2, Building2, Shield } from "lucide-react";

interface DiagnosticFormFieldsProps {
  form: UseFormReturn<FormValues>;
  language: Language;
}

const DiagnosticFormFields = ({ form, language }: DiagnosticFormFieldsProps) => {
  const t = translations[language];

  return (
    <div className="space-y-8">
      {/* Name Field */}
      <FormField
        control={form.control}
        name="nome"
        render={({ field }) => (
          <FormItem className="group">
            <FormLabel className="text-base font-semibold flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <User className="h-4 w-4 text-primary" />
              </div>
              {t.nameLabel}
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input 
                  {...field}
                  placeholder={t.namePlaceholder}
                  className="pl-4 h-12 text-base bg-background border-2 border-border hover:border-primary/50 focus:border-primary transition-all duration-200 rounded-xl shadow-sm"
                />
              </div>
            </FormControl>
            <FormMessage className="text-sm" />
          </FormItem>
        )}
      />

      {/* Email Field */}
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem className="group">
            <FormLabel className="text-base font-semibold flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              {t.emailLabel}
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input 
                  {...field}
                  type="email"
                  placeholder={t.emailPlaceholder}
                  className="pl-4 h-12 text-base bg-background border-2 border-border hover:border-primary/50 focus:border-primary transition-all duration-200 rounded-xl shadow-sm"
                />
              </div>
            </FormControl>
            <FormMessage className="text-sm" />
          </FormItem>
        )}
      />

      {/* Platform Selection */}
      <FormField
        control={form.control}
        name="plataforma"
        render={({ field }) => (
          <FormItem className="group">
            <FormLabel className="text-base font-semibold flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                <Building2 className="h-4 w-4 text-secondary-foreground" />
              </div>
              {t.platformLabel}
            </FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger className="h-12 text-base bg-background border-2 border-border hover:border-primary/50 focus:border-primary transition-all duration-200 rounded-xl shadow-sm">
                  <SelectValue placeholder={language === "en" ? "Select your platform" : "Selecione sua plataforma"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="rounded-xl">
                {supportedPlatforms.map((platform) => (
                  <SelectItem 
                    key={platform.value} 
                    value={platform.value}
                    className="rounded-lg cursor-pointer"
                  >
                    {platform.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription className="text-sm text-muted-foreground">
              {language === "en" ? "Choose where your property is listed" : "Escolha onde sua propriedade está listada"}
            </FormDescription>
            <FormMessage className="text-sm" />
          </FormItem>
        )}
      />

      {/* URL Field */}
      <FormField
        control={form.control}
        name="link"
        render={({ field }) => (
          <FormItem className="group">
            <FormLabel className="text-base font-semibold flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                <Link2 className="h-4 w-4 text-secondary-foreground" />
              </div>
              {t.linkLabel}
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input 
                  {...field}
                  type="url"
                  placeholder={t.linkPlaceholder}
                  className="pl-4 h-12 text-base bg-background border-2 border-border hover:border-primary/50 focus:border-primary transition-all duration-200 rounded-xl shadow-sm font-mono text-sm"
                />
              </div>
            </FormControl>
            <FormDescription className="text-sm text-muted-foreground">
              {language === "en" ? "Paste the complete URL from your property listing" : "Cole o URL completo da listagem da sua propriedade"}
            </FormDescription>
            <FormMessage className="text-sm" />
          </FormItem>
        )}
      />

      {/* GDPR Consent */}
      <FormField
        control={form.control}
        name="rgpd"
        render={({ field }) => (
          <FormItem className="group">
            <div className="flex items-start space-x-4 p-6 rounded-xl bg-muted/50 border-2 border-border hover:border-primary/30 transition-all duration-200">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-1 h-5 w-5 border-2"
                />
              </FormControl>
              <div className="space-y-2 flex-1">
                <FormLabel className="text-base font-medium flex items-center gap-2 cursor-pointer text-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  {t.rgpdLabel}
                </FormLabel>
                <FormDescription className="text-sm text-muted-foreground leading-relaxed">
                  {language === "en" 
                    ? "We respect your privacy and will only use your data to provide the analysis service. Your information is secure and will not be shared with third parties." 
                    : "Respeitamos sua privacidade e usaremos seus dados apenas para fornecer o serviço de análise. Suas informações estão seguras e não serão compartilhadas com terceiros."}
                </FormDescription>
                <FormMessage className="text-sm" />
              </div>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};

export default DiagnosticFormFields;

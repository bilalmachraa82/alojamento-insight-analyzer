
import { UseFormReturn } from "react-hook-form";
import { Language, translations } from "./translations";
import DiagnosticFormField from "./FormField";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormValues, supportedPlatforms } from "./schema";

interface DiagnosticFormFieldsProps {
  form: UseFormReturn<FormValues>;
  language: Language;
}

const DiagnosticFormFields = ({ form, language }: DiagnosticFormFieldsProps) => {
  const t = translations[language];

  return (
    <>
      <DiagnosticFormField
        form={form}
        name="nome"
        label={t.nameLabel}
      >
        <Input placeholder={t.namePlaceholder} />
      </DiagnosticFormField>

      <DiagnosticFormField
        form={form}
        name="email"
        label={t.emailLabel}
      >
        <Input placeholder={t.emailPlaceholder} type="email" />
      </DiagnosticFormField>

      <DiagnosticFormField
        form={form}
        name="link"
        label={t.linkLabel}
      >
        <Input placeholder={t.linkPlaceholder} type="url" />
      </DiagnosticFormField>

      <FormField
        control={form.control}
        name="plataforma"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.platformLabel}</FormLabel>
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
                {supportedPlatforms.map((platform) => (
                  <SelectItem key={platform.value} value={platform.value}>
                    {platform.label}
                  </SelectItem>
                ))}
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="outro">{language === "en" ? "Other" : "Outro"}</SelectItem>
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
                {t.rgpdLabel}
              </FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </>
  );
};

export default DiagnosticFormFields;

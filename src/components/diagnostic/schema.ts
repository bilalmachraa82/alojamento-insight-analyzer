
import * as z from "zod";
import { translations, Language } from "./translations";

export const createFormSchema = (language: Language) => {
  const t = translations[language];
  
  return z.object({
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
};

export type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

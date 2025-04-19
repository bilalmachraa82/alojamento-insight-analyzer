
import * as z from "zod";
import { translations, Language } from "./translations";

export const createFormSchema = (language: Language) => {
  const t = translations[language];
  
  return z.object({
    nome: z.string().min(2, {
      message: t.nameRequired,
    }),
    email: z.string().email({
      message: t.emailInvalid,
    }),
    link: z.string().url({
      message: t.linkInvalid,
    }),
    plataforma: z.string({
      required_error: t.platformRequired,
    })
    .refine(val => supportedPlatforms.map(p => p.value).includes(val.toLowerCase()), {
      message: t.platformRequired || "Please select a supported platform",
    }),
    rgpd: z.boolean().refine((val) => val === true, {
      message: t.rgpdRequired,
    }),
  });
};

export type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

// Supported platforms that connect to Apify actors
export const supportedPlatforms = [
  { value: "booking", label: "Booking", actorId: "voyager/booking-reviews-scraper" },
  { value: "airbnb", label: "Airbnb", actorId: "apify/airbnb-scraper" },
  { value: "vrbo", label: "VRBO", actorId: "apify/vrbo-scraper" }
];

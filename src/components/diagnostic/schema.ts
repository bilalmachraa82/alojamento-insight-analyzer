
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
    })
    .refine(val => ["airbnb", "booking", "vrbo", "other"].includes(val.toLowerCase()), {
      message: t.platformError || "Please select a supported platform",
    }),
    rgpd: z.boolean().refine((val) => val === true, {
      message: t.gdprError,
    }),
  });
};

export type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

// Supported platforms that connect to Apify actors
export const supportedPlatforms = [
  { value: "airbnb", label: "Airbnb", actorId: "apify/airbnb-scraper" },
  { value: "booking", label: "Booking.com", actorId: "apify/booking-scraper" },
  { value: "vrbo", label: "VRBO", actorId: "apify/vrbo-scraper" },
  { value: "other", label: "Other", actorId: "apify/web-scraper" }
];

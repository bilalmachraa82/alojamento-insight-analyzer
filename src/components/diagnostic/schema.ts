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

// Supported platforms that connect to Apify actors - 6 platforms
export const supportedPlatforms = [
  { value: "booking", label: "Booking.com", actorId: "dtrungtin/booking-scraper" },
  { value: "airbnb", label: "Airbnb", actorId: "GsNzxEKzE2vQ5d9HN" },
  { value: "vrbo", label: "VRBO", actorId: "powerai/vrbo-listing-scraper" },
  { value: "agoda", label: "Agoda", actorId: "eC53oEoee74OTExo3" },
  { value: "expedia", label: "Expedia", actorId: "jupri/expedia-hotels" },
  { value: "hotels", label: "Hotels.com", actorId: "tri_angle/expedia-hotels-com-reviews-scraper" }
];

// Helper to get actor ID by platform
export const getActorIdByPlatform = (platform: string): string | undefined => {
  const platformInfo = supportedPlatforms.find(p => p.value === platform.toLowerCase());
  return platformInfo?.actorId;
};

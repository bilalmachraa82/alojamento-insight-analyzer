
import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Language } from "./translations";

interface BookingWarningProps {
  language: Language;
  show: boolean;
}

export const BookingWarning: React.FC<BookingWarningProps> = ({ language, show }) => {
  if (!show) return null;

  return (
    <Alert variant="destructive" className="bg-amber-50 text-amber-800 border-amber-200">
      <AlertTitle>
        {language === "en" ? "Important: Use Complete Booking.com URL" : "Importante: Use o URL Completo do Booking.com"}
      </AlertTitle>
      <AlertDescription>
        {language === "en" 
          ? "Please use the full URL from your browser address bar (starting with https://www.booking.com/hotel/). Shortened links (booking.com/Share-XXXX) will not work correctly."
          : "Por favor, use o URL completo da barra de endereço do navegador (começando com https://www.booking.com/hotel/). Links encurtados (booking.com/Share-XXXX) não funcionarão corretamente."}
      </AlertDescription>
    </Alert>
  );
};

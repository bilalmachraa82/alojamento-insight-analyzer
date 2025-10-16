import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap"
});

const montserrat = Montserrat({ 
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap"
});

export const metadata: Metadata = {
  title: "A Maria Faz Analytics - Relatórios de Consultoria para Alojamento Local",
  description: "Plataforma SaaS especializada em análise de performance para propriedades de alojamento local. Relatórios profissionais com Health Score e recomendações personalizadas.",
  keywords: "alojamento local, airbnb, booking, analytics, consultoria, relatórios, portugal",
  authors: [{ name: "A Maria Faz" }],
  openGraph: {
    title: "A Maria Faz Analytics - Especialistas em Alojamento Local",
    description: "Descobre o potencial da tua propriedade com os nossos relatórios de consultoria especializados.",
    locale: "pt_PT",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className={`${playfair.variable} ${montserrat.variable}`}>
      <body className="font-montserrat antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import MariaFazLogo from "@/components/MariaFazLogo";
import LanguageToggle from "@/components/LanguageToggle";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import PricingTable from "@/components/PricingTable";
import DiagnosticForm from "@/components/DiagnosticForm";
import { Separator } from "@/components/ui/separator";
import MetaTags from "@/components/SEO/MetaTags";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
  serviceSchema,
  premiumProductSchema
} from "@/components/SEO/structuredData";

const Index: React.FC = () => {
  const [language, setLanguage] = useState<"en" | "pt">("pt");

  const scrollToForm = () => {
    const form = document.getElementById("diagnosticoForm");
    form?.scrollIntoView({ behavior: "smooth" });
  };

  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://alojamento-insight-analyzer.mariafaz.com';

  return (
    <>
      <MetaTags
        title={language === "en"
          ? "Alojamento Insight Analyzer - AI-Powered Short-Term Rental Analysis | Maria Faz"
          : "Análise de Alojamento Local - Diagnóstico Inteligente com IA | Maria Faz"
        }
        description={language === "en"
          ? "Optimize your short-term rental property with AI-powered insights. Get comprehensive market analysis, pricing recommendations, and competitive intelligence for your Airbnb or Booking.com listing in Portugal."
          : "Otimize o seu alojamento local com análise inteligente por IA. Obtenha diagnóstico completo de mercado, recomendações de preços e análise competitiva para o seu Airbnb ou Booking.com em Portugal."
        }
        keywords="alojamento local, short-term rental, airbnb portugal, booking.com, análise de mercado, otimização de preços, gestão de propriedades, turismo portugal, rental analytics, property optimization, AI analysis"
        canonicalUrl={siteUrl}
        ogImage={`${siteUrl}/og-image.jpg`}
        ogUrl={siteUrl}
        structuredData={[
          organizationSchema,
          websiteSchema,
          softwareApplicationSchema,
          serviceSchema,
          premiumProductSchema
        ]}
      />
      <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-white to-gray-50">
      {/* Header */}
      <header className="w-full py-4 px-6 md:px-8 flex justify-between items-center shadow-sm bg-white sticky top-0 z-10">
        <MariaFazLogo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageToggle language={language} setLanguage={setLanguage} />
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Hero Section */}
        <HeroSection language={language} scrollToForm={scrollToForm} />
        
        <Separator className="my-12" />
        
        {/* How It Works */}
        <HowItWorks language={language} />
        
        <Separator className="my-12" />
        
        {/* Pricing Table */}
        <PricingTable language={language} scrollToForm={scrollToForm} />
        
        <Separator className="my-12" />
        
        {/* Diagnostic Form */}
        <div id="diagnosticoForm" className="bg-white shadow-sm rounded-xl p-8 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-brand-black font-montserrat">
            {language === "en" ? "Smart Diagnostic" : "Diagnóstico Inteligente"}
          </h2>
          <p className="text-lg text-center mb-8 text-gray-600 font-inter">
            {language === "en" ? "Short-Term Rental" : "Alojamento Local"}
          </p>
          
          <DiagnosticForm language={language} />
        </div>
      </main>
      
      <footer className="w-full py-6 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Maria Faz. {language === "en" ? "All rights reserved." : "Todos os direitos reservados."}</p>
        </div>
      </footer>
    </div>
    </>
  );
};

export default Index;

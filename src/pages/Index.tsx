
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

const Index: React.FC = () => {
  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        // Just test the connection without trying to access a specific table
        const { data, error } = await supabase.from('_unused_').select('*').limit(0).maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          // If there's an error that's not just "relation does not exist"
          toast({
            variant: "destructive",
            title: "Supabase Connection Test Failed",
            description: error.message
          });
        } else {
          toast({
            title: "Supabase Connected ✓",
            description: "Successfully connected to Supabase"
          });
        }
      } catch (err) {
        toast({
          variant: "destructive", 
          title: "Supabase Connection Error",
          description: String(err)
        });
      }
    };

    testSupabaseConnection();
  }, []);

  const [language, setLanguage] = useState<"en" | "pt">("en");

  const scrollToForm = () => {
    const form = document.getElementById("diagnosticoForm");
    form?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-white to-gray-50">
      {/* Header */}
      <header className="w-full py-4 px-6 md:px-8 flex justify-between items-center shadow-sm bg-white sticky top-0 z-10">
        <MariaFazLogo />
        <LanguageToggle language={language} setLanguage={setLanguage} />
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
        <div className="bg-white shadow-sm rounded-xl p-8 mb-8">
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
  );
};

export default Index;

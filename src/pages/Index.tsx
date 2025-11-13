import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import MariaFazLogo from "@/components/MariaFazLogo";
import LanguageToggle from "@/components/LanguageToggle";
import HeroSection2 from "@/components/HeroSection2";
import HowItWorks2 from "@/components/HowItWorks2";
import FeaturesBanner from "@/components/FeaturesBanner";
import SocialProof from "@/components/SocialProof";
import PricingTable2 from "@/components/PricingTable2";
import CTASection from "@/components/CTASection";
import FAQ from "@/components/FAQ";
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
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    } else {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    }
  };

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
      <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="w-full py-4 px-6 md:px-8 flex justify-between items-center shadow-sm bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100">
        <MariaFazLogo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageToggle language={language} setLanguage={setLanguage} />
          {session ? (
            <>
              <Link to="/my-submissions">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <span className="hidden sm:inline">
                    {language === "en" ? "My Submissions" : "Minhas Submissões"}
                  </span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {language === "en" ? "Sign Out" : "Sair"}
                </span>
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {language === "en" ? "Sign In" : "Entrar"}
                </span>
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="w-full">
        {/* Hero Section */}
        <HeroSection2 language={language} scrollToForm={scrollToForm} />
        
        {/* Features Banner */}
        <FeaturesBanner language={language} />
        
        {/* How It Works */}
        <HowItWorks2 language={language} />
        
        {/* Social Proof */}
        <SocialProof language={language} />
        
        {/* Pricing Table */}
        <PricingTable2 language={language} scrollToForm={scrollToForm} />
        
        {/* CTA Section */}
        <CTASection language={language} scrollToForm={scrollToForm} />
        
        {/* FAQ Section */}
        <FAQ language={language} />
        
        {/* Diagnostic Form */}
        <section id="diagnosticoForm" className="py-20 bg-gradient-to-br from-brand-cream/30 via-white to-brand-beige/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="text-center mb-12 space-y-4">
                <div className="inline-flex items-center gap-2 bg-brand-pink/10 text-brand-pink px-4 py-2 rounded-full text-sm font-medium">
                  {language === "en" ? "Get Started" : "Comece Agora"}
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-brand-black font-playfair">
                  {language === "en" ? "Smart Property Diagnostic" : "Diagnóstico Inteligente"}
                </h2>
                <p className="text-lg text-gray-600 font-inter">
                  {language === "en" ? "Enter your property details and get instant AI-powered insights" : "Insira os detalhes da sua propriedade e obtenha insights instantâneos com IA"}
                </p>
              </div>
              
              {/* Form Card */}
              <div className="bg-white shadow-2xl rounded-3xl p-8 md:p-12 border-2 border-gray-100">
                <DiagnosticForm language={language} />
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="w-full py-12 px-4 bg-gradient-to-br from-brand-black to-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div className="space-y-4">
              <div className="font-playfair text-2xl font-bold">
                <span className="text-brand-pink">A Maria</span>
                <span className="text-brand-blue">Faz</span>
              </div>
              <p className="text-gray-400 text-sm font-inter">
                {language === "en" 
                  ? "AI-powered insights for short-term rental success"
                  : "Insights com IA para o sucesso do seu alojamento local"
                }
              </p>
            </div>
            
            {/* Quick Links */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white mb-4">{language === "en" ? "Quick Links" : "Links Rápidos"}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#diagnosticoForm" className="text-gray-400 hover:text-brand-pink transition-colors">{language === "en" ? "Get Analysis" : "Obter Análise"}</a></li>
                <li><Link to="/my-submissions" className="text-gray-400 hover:text-brand-pink transition-colors">{language === "en" ? "My Submissions" : "Minhas Submissões"}</Link></li>
                <li><Link to="/auth" className="text-gray-400 hover:text-brand-pink transition-colors">{language === "en" ? "Sign In" : "Entrar"}</Link></li>
              </ul>
            </div>
            
            {/* Resources */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white mb-4">{language === "en" ? "Resources" : "Recursos"}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-brand-pink transition-colors">{language === "en" ? "How it Works" : "Como Funciona"}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-brand-pink transition-colors">{language === "en" ? "Pricing" : "Preços"}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-brand-pink transition-colors">{language === "en" ? "FAQ" : "Perguntas Frequentes"}</a></li>
              </ul>
            </div>
            
            {/* Contact */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white mb-4">{language === "en" ? "Contact" : "Contacto"}</h3>
              <ul className="space-y-2 text-sm">
                <li className="text-gray-400">info@mariafaz.com</li>
                <li className="text-gray-400">+351 XXX XXX XXX</li>
                <li className="text-gray-400">Lisboa, Portugal</li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} Maria Faz. {language === "en" ? "All rights reserved." : "Todos os direitos reservados."}</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default Index;

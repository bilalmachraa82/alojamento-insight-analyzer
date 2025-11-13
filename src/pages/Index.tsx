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
      <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full py-4 px-6 md:px-8 flex justify-between items-center shadow-sm bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border">
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
        <section id="diagnosticoForm" className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              {/* Header */}
              <div className="text-center mb-16 space-y-6 animate-fade-in">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm border border-primary/20 px-6 py-3 rounded-full text-sm font-semibold shadow-lg">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  {language === "en" ? "Get Started Now" : "Comece Agora"}
                </div>
                <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent font-playfair leading-tight">
                  {language === "en" ? "AI-Powered Property Analysis" : "Análise Inteligente com IA"}
                </h2>
                <p className="text-xl text-muted-foreground font-inter max-w-2xl mx-auto">
                  {language === "en" 
                    ? "Enter your property details and receive a comprehensive AI-powered market analysis in minutes" 
                    : "Insira os detalhes da sua propriedade e receba uma análise de mercado completa com IA em minutos"}
                </p>
              </div>
              
              {/* Form Card */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-card shadow-2xl rounded-3xl p-8 md:p-12 border border-border backdrop-blur-xl">
                  <DiagnosticForm language={language} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="w-full py-12 px-4 bg-gradient-to-br from-gray-900 to-gray-950 dark:from-gray-950 dark:to-black text-white">
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

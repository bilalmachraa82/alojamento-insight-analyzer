import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import bedroomImage from '@/assets/luxury-bedroom.jpg';

interface CTASectionProps {
  language: "en" | "pt";
  scrollToForm: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ language, scrollToForm }) => {
  const content = {
    en: {
      title: "Ready to Maximize Your Rental Income?",
      subtitle: "Join hundreds of successful property owners who transformed their business with our AI-powered insights",
      cta: "Get Started Now",
      guarantee: "Free analysis • No credit card required • Instant results"
    },
    pt: {
      title: "Pronto para Maximizar as Suas Receitas?",
      subtitle: "Junte-se a centenas de proprietários bem-sucedidos que transformaram o seu negócio com os nossos insights de IA",
      cta: "Começar Agora",
      guarantee: "Análise gratuita • Sem cartão de crédito • Resultados instantâneos"
    }
  };
  
  const currentContent = language === "en" ? content.en : content.pt;
  
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bedroomImage}
          alt="Luxury bedroom"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-black/90 via-brand-black/80 to-brand-black/70"></div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/20">
            <Sparkles className="h-4 w-4" />
            {language === "en" ? "Limited Time Offer" : "Oferta por Tempo Limitado"}
          </div>
          
          {/* Title */}
          <h2 className="text-4xl md:text-6xl font-bold text-white font-playfair leading-tight">
            {currentContent.title}
          </h2>
          
          {/* Subtitle */}
          <p className="text-xl text-gray-200 font-inter max-w-2xl mx-auto leading-relaxed">
            {currentContent.subtitle}
          </p>
          
          {/* CTA Button */}
          <div className="space-y-4">
            <Button
              onClick={scrollToForm}
              size="lg"
              className="bg-gradient-to-r from-brand-pink to-brand-pink/80 hover:from-brand-pink/90 hover:to-brand-pink/70 text-white font-semibold text-lg py-7 px-12 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover-scale"
            >
              {currentContent.cta}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            {/* Guarantee */}
            <div className="text-sm text-gray-300 font-inter">
              {currentContent.guarantee}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

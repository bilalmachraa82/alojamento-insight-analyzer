import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, TrendingUp, Award, Zap } from 'lucide-react';
import heroImage from '@/assets/hero-rental-property.jpg';

interface HeroSection2Props {
  language: "en" | "pt";
  scrollToForm: () => void;
}

const HeroSection2: React.FC<HeroSection2Props> = ({ language, scrollToForm }) => {
  const content = {
    en: {
      badge: "AI-Powered Analysis",
      title: "Transform Your Short-Term Rental Into a",
      titleHighlight: "High-Performance Property",
      subtitle: "Get comprehensive AI-driven insights to boost your Airbnb or Booking.com listing. Increase bookings, improve ratings, and maximize revenue.",
      benefits: [
        { icon: TrendingUp, text: "Increase revenue by up to 30%" },
        { icon: Award, text: "Improve your rating score" },
        { icon: Zap, text: "Instant actionable insights" }
      ],
      cta: "Get My Free Analysis",
      trustBadge: "Trusted by 500+ property owners in Portugal"
    },
    pt: {
      badge: "Análise com Inteligência Artificial",
      title: "Transforme o Seu Alojamento Local Num",
      titleHighlight: "Negócio de Alto Desempenho",
      subtitle: "Obtenha insights completos com IA para potenciar o seu Airbnb ou Booking.com. Aumente reservas, melhore avaliações e maximize receitas.",
      benefits: [
        { icon: TrendingUp, text: "Aumente receitas até 30%" },
        { icon: Award, text: "Melhore a sua classificação" },
        { icon: Zap, text: "Insights práticos instantâneos" }
      ],
      cta: "Quero a Minha Análise Grátis",
      trustBadge: "Confiança de 500+ proprietários em Portugal"
    }
  };
  
  const currentContent = language === "en" ? content.en : content.pt;
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-cream via-white to-brand-beige/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>
      
      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-brand-pink/10 text-brand-pink px-4 py-2 rounded-full text-sm font-medium">
              <Zap className="h-4 w-4" />
              {currentContent.badge}
            </div>
            
            {/* Title */}
            <div className="space-y-3">
              <h1 className="text-4xl md:text-6xl font-bold text-brand-black font-playfair leading-tight">
                {currentContent.title}
              </h1>
              <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-brand-pink to-brand-blue bg-clip-text text-transparent font-playfair leading-tight">
                {currentContent.titleHighlight}
              </h2>
            </div>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-600 font-inter leading-relaxed">
              {currentContent.subtitle}
            </p>
            
            {/* Benefits */}
            <div className="space-y-4">
              {currentContent.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-brand-pink/10 rounded-lg flex items-center justify-center group-hover:bg-brand-pink/20 transition-colors">
                    <benefit.icon className="h-5 w-5 text-brand-pink" />
                  </div>
                  <span className="text-gray-700 font-inter font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
            
            {/* CTA Button */}
            <div className="space-y-4">
              <Button 
                onClick={scrollToForm} 
                size="lg"
                className="bg-gradient-to-r from-brand-pink to-brand-pink/80 hover:from-brand-pink/90 hover:to-brand-pink/70 text-white font-semibold text-lg py-7 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover-scale"
              >
                {currentContent.cta}
                <Zap className="ml-2 h-5 w-5" />
              </Button>
              
              {/* Trust Badge */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{currentContent.trustBadge}</span>
              </div>
            </div>
          </div>
          
          {/* Right Column - Image */}
          <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {/* Floating Badge */}
            <div className="absolute -top-6 -left-6 z-10 bg-white rounded-2xl shadow-xl p-4 animate-[bounce_3s_ease-in-out_infinite]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">+30%</div>
                  <div className="text-xs text-gray-600">{language === "en" ? "Revenue" : "Receitas"}</div>
                </div>
              </div>
            </div>
            
            {/* Main Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt="Luxury rental property"
                className="w-full h-auto object-cover"
                loading="eager"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-6 animate-[bounce_3s_ease-in-out_infinite] [animation-delay:1.5s]">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-pink">4.9</div>
                  <div className="text-xs text-gray-600">Rating</div>
                </div>
                <div className="w-px h-12 bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-blue">500+</div>
                  <div className="text-xs text-gray-600">{language === "en" ? "Clients" : "Clientes"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection2;

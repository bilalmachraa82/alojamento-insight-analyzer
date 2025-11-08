
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import OptimizedImage from '@/components/ui/optimized-image';

interface HeroSectionProps {
  language: "en" | "pt";
  scrollToForm: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ language, scrollToForm }) => {
  const content = {
    en: {
      title: "Boost Your Short-Term Rental With AI",
      description: "Receive a full report based on your Booking or Airbnb profile, with practical suggestions to improve reputation, pricing and occupancy.",
      benefits: [
        "Real data from your property",
        "Score out of 100",
        "Guest experience audit",
        "Pricing strategy",
        "PDF + HTML plan"
      ],
      cta: "Get My Smart Report"
    },
    pt: {
      title: "Melhore o seu Alojamento com Diagnóstico Inteligente",
      description: "Receba um plano personalizado com base na sua presença em Booking ou Airbnb. Otimize avaliações, preços e rentabilidade com apoio da nossa equipa e inteligência artificial.",
      benefits: [
        "Dados reais da sua propriedade",
        "Pontuação de 0 a 100",
        "Análise da experiência do hóspede",
        "Estratégia de preços",
        "Plano em PDF + HTML"
      ],
      cta: "Quero o Meu Relatório"
    }
  };
  
  const currentContent = language === "en" ? content.en : content.pt;
  
  return (
    <section className="py-10 md:py-16 px-4 md:px-0">
      <div className="md:flex md:items-center md:justify-between">
        <div className="md:w-1/2 md:pr-12">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-brand-black font-playfair leading-tight">
            {currentContent.title}
          </h1>
          <p className="text-lg mb-8 text-gray-700 font-inter">
            {currentContent.description}
          </p>
          <ul className="space-y-3 mb-8">
            {/* Using benefit text as key - it's unique and stable for this static content */}
            {currentContent.benefits.map((benefit, index) => (
              <li key={`benefit-${benefit}`} className="flex items-center font-inter text-gray-700">
                <CheckCircle className="h-5 w-5 mr-2 text-brand-pink" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          <Button 
            onClick={scrollToForm} 
            size="lg"
            className="bg-brand-pink hover:bg-opacity-90 text-brand-black font-medium text-lg py-6 px-8"
          >
            {currentContent.cta}
          </Button>
        </div>
        <div className="hidden md:block md:w-1/2">
          <div className="rounded-lg bg-gradient-to-br from-brand-pink/20 to-brand-blue/20 p-6 h-96 flex items-center justify-center">
            <OptimizedImage
              src="https://images.unsplash.com/photo-1721322800607-8c38375eef04"
              alt="Short-Term Rental Accommodation"
              width={1200}
              height={800}
              priority
              className="rounded-lg shadow-lg"
              objectFit="contain"
              sizes="(max-width: 768px) 0vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

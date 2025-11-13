import React from 'react';
import { Link2, BarChart3, FileText, ArrowRight } from 'lucide-react';
import analyticsImage from '@/assets/analytics-dashboard.jpg';
import aiAssistantImage from '@/assets/ai-assistant.jpg';

interface HowItWorks2Props {
  language: "en" | "pt";
}

const HowItWorks2: React.FC<HowItWorks2Props> = ({ language }) => {
  const content = {
    en: {
      badge: "Simple Process",
      title: "How It Works",
      subtitle: "Get your personalized action plan in 3 simple steps",
      steps: [
        {
          number: "01",
          icon: Link2,
          title: "Share Your Property Link",
          description: "Simply paste your Booking.com or Airbnb listing URL. Our AI will analyze all available data.",
          highlight: "Takes less than 30 seconds"
        },
        {
          number: "02",
          icon: BarChart3,
          title: "AI Analysis + Expert Review",
          description: "Our advanced AI analyzes your property data while our experts validate and enrich the insights.",
          highlight: "Processing time: 3-5 minutes"
        },
        {
          number: "03",
          icon: FileText,
          title: "Receive Your Action Plan",
          description: "Get a detailed report with personalized recommendations to boost your property's performance.",
          highlight: "PDF + HTML formats"
        }
      ]
    },
    pt: {
      badge: "Processo Simples",
      title: "Como Funciona",
      subtitle: "Obtenha o seu plano de ação personalizado em 3 passos simples",
      steps: [
        {
          number: "01",
          icon: Link2,
          title: "Partilhe o Link da Propriedade",
          description: "Basta colar o URL do seu anúncio no Booking.com ou Airbnb. A nossa IA analisa todos os dados disponíveis.",
          highlight: "Leva menos de 30 segundos"
        },
        {
          number: "02",
          icon: BarChart3,
          title: "Análise IA + Revisão Especializada",
          description: "A nossa IA avançada analisa os dados da propriedade enquanto os nossos especialistas validam e enriquecem os insights.",
          highlight: "Tempo de processamento: 3-5 minutos"
        },
        {
          number: "03",
          icon: FileText,
          title: "Receba o Seu Plano de Ação",
          description: "Obtenha um relatório detalhado com recomendações personalizadas para potenciar o desempenho da sua propriedade.",
          highlight: "Formatos PDF + HTML"
        }
      ]
    }
  };
  
  const currentContent = language === "en" ? content.en : content.pt;
  
  return (
    <section className="relative py-20 md:py-28 bg-background overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-brand-cream/30 dark:from-brand-cream/10 to-transparent"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-brand-blue/10 text-brand-blue px-4 py-2 rounded-full text-sm font-medium">
            {currentContent.badge}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground font-playfair">
            {currentContent.title}
          </h2>
          <p className="text-lg text-muted-foreground font-inter">
            {currentContent.subtitle}
          </p>
        </div>
        
        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {currentContent.steps.map((step, index) => (
            <div
              key={step.number}
              className="relative group"
            >
              {/* Connection Arrow (desktop only) */}
              {index < currentContent.steps.length - 1 && (
                <div className="hidden md:block absolute top-20 left-full w-full h-px bg-gradient-to-r from-brand-pink to-transparent z-0">
                  <ArrowRight className="absolute -right-2 -top-3 h-6 w-6 text-brand-pink" />
                </div>
              )}
              
              {/* Card */}
              <div className="relative bg-card rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-border group-hover:border-brand-pink/20">
                {/* Number Badge */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-brand-pink to-brand-pink/70 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-brand-pink/10 to-brand-blue/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <step.icon className="h-8 w-8 text-brand-pink" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold mb-3 text-foreground font-montserrat">
                  {step.title}
                </h3>
                <p className="text-muted-foreground font-inter mb-4 leading-relaxed">
                  {step.description}
                </p>
                
                {/* Highlight */}
                <div className="inline-flex items-center gap-2 text-sm text-brand-blue font-medium bg-brand-blue/10 px-3 py-1 rounded-full">
                  {step.highlight}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Visual Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mt-20">
          {/* Analytics Image */}
          <div className="relative animate-fade-in">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={analyticsImage} 
                alt="Analytics Dashboard"
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
            
            {/* Floating badge */}
            <div className="absolute -bottom-6 left-6 bg-card rounded-xl shadow-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-pink/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-brand-pink" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {language === "en" ? "Real-time Analysis" : "Análise em Tempo Real"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {language === "en" ? "Powered by AI" : "Powered by IA"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* AI Assistant Image */}
          <div className="relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-brand-blue/10 to-brand-pink/10 p-8">
              <img 
                src={aiAssistantImage} 
                alt="AI Assistant"
                className="w-full h-auto object-contain max-h-96"
                loading="lazy"
              />
            </div>
            
            {/* Content */}
            <div className="mt-6 space-y-4">
              <h3 className="text-2xl font-bold text-foreground font-playfair">
                {language === "en" ? "Powered by Advanced AI" : "Powered by IA Avançada"}
              </h3>
              <p className="text-muted-foreground font-inter leading-relaxed">
                {language === "en" 
                  ? "Our AI assistant analyzes thousands of data points from your property, reviews, pricing, and competition to provide you with actionable insights that drive real results."
                  : "O nosso assistente de IA analisa milhares de pontos de dados da sua propriedade, avaliações, preços e concorrência para fornecer insights acionáveis que geram resultados reais."
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks2;

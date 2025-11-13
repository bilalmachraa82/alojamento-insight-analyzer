import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Star, Sparkles, Crown } from 'lucide-react';

interface PricingTable2Props {
  language: "en" | "pt";
  scrollToForm: () => void;
}

const PricingTable2: React.FC<PricingTable2Props> = ({ language, scrollToForm }) => {
  const content = {
    en: {
      badge: "Simple Pricing",
      title: "Choose Your Plan",
      subtitle: "Start with our free analysis and upgrade when you're ready",
      plans: [
        {
          name: "Free",
          price: "€0",
          period: "one-time",
          description: "Perfect to get started",
          icon: Star,
          features: [
            "Basic property analysis",
            "Overall health score (0-100)",
            "One key improvement suggestion",
            "Valid for 7 days"
          ],
          buttonText: "Start Free Analysis",
          popular: false,
          gradient: "from-gray-100 to-gray-50"
        },
        {
          name: "Premium",
          price: "€19.90",
          period: "one-time",
          description: "Complete analysis with actionable insights",
          icon: Sparkles,
          features: [
            "Detailed property analysis",
            "Score by category (reputation, pricing, experience)",
            "Complete recommendations list",
            "PDF + HTML export",
            "Email support",
            "Priority processing"
          ],
          buttonText: "Get Premium Report",
          popular: true,
          gradient: "from-brand-pink/20 to-brand-blue/20"
        },
        {
          name: "Implementation",
          price: "Custom",
          period: "quote",
          description: "We implement the improvements for you",
          icon: Crown,
          features: [
            "Everything in Premium",
            "Hands-on implementation",
            "Monthly performance monitoring",
            "Direct consultant support",
            "Full property management available"
          ],
          buttonText: "Contact Our Team",
          popular: false,
          gradient: "from-brand-blue/20 to-brand-pink/20"
        }
      ],
      guarantee: "30-day money-back guarantee"
    },
    pt: {
      badge: "Preços Simples",
      title: "Escolha o Seu Plano",
      subtitle: "Comece com a nossa análise gratuita e faça upgrade quando estiver pronto",
      plans: [
        {
          name: "Gratuito",
          price: "€0",
          period: "único",
          description: "Perfeito para começar",
          icon: Star,
          features: [
            "Análise básica da propriedade",
            "Pontuação geral de saúde (0-100)",
            "Uma sugestão chave de melhoria",
            "Válido por 7 dias"
          ],
          buttonText: "Começar Análise Grátis",
          popular: false,
          gradient: "from-gray-100 to-gray-50"
        },
        {
          name: "Premium",
          price: "€19,90",
          period: "único",
          description: "Análise completa com insights acionáveis",
          icon: Sparkles,
          features: [
            "Análise detalhada da propriedade",
            "Pontuação por categoria (reputação, preços, experiência)",
            "Lista completa de recomendações",
            "Exportação em PDF + HTML",
            "Suporte por email",
            "Processamento prioritário"
          ],
          buttonText: "Obter Relatório Premium",
          popular: true,
          gradient: "from-brand-pink/20 to-brand-blue/20"
        },
        {
          name: "Implementação",
          price: "Personalizado",
          period: "orçamento",
          description: "Implementamos as melhorias por si",
          icon: Crown,
          features: [
            "Tudo no Premium",
            "Implementação prática",
            "Monitorização mensal de desempenho",
            "Suporte direto de consultor",
            "Gestão completa disponível"
          ],
          buttonText: "Contactar Equipa",
          popular: false,
          gradient: "from-brand-blue/20 to-brand-pink/20"
        }
      ],
      guarantee: "Garantia de reembolso de 30 dias"
    }
  };
  
  const currentContent = language === "en" ? content.en : content.pt;
  
  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-br from-white via-brand-cream/20 to-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-brand-pink/10 text-brand-pink px-4 py-2 rounded-full text-sm font-medium">
            {currentContent.badge}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground font-playfair">
            {currentContent.title}
          </h2>
          <p className="text-lg text-muted-foreground font-inter">
            {currentContent.subtitle}
          </p>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {currentContent.plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative group ${
                plan.popular 
                  ? 'md:-mt-4 md:scale-105 z-10' 
                  : 'md:mt-0'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <div className="bg-gradient-to-r from-brand-pink to-brand-blue text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                    {language === "en" ? "MOST POPULAR" : "MAIS POPULAR"}
                  </div>
                </div>
              )}
              
              {/* Card */}
              <div className={`relative bg-gradient-to-br ${plan.gradient} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                plan.popular 
                  ? 'border-2 border-brand-pink' 
                  : 'border-2 border-gray-100 hover:border-brand-pink/30'
              } h-full flex flex-col`}>
                {/* Icon */}
                <div className="mb-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    plan.popular 
                      ? 'bg-gradient-to-br from-brand-pink to-brand-blue' 
                      : 'bg-white'
                  } shadow-lg`}>
                    <plan.icon className={`h-8 w-8 ${
                      plan.popular ? 'text-white' : 'text-brand-pink'
                    }`} />
                  </div>
                </div>
                
                {/* Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground font-montserrat mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground font-inter text-sm">
                    {plan.description}
                  </p>
                </div>
                
                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    {plan.period !== "quote" && (
                      <span className="text-muted-foreground text-sm">
                        / {plan.period}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Features */}
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-muted-foreground font-inter text-sm leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                {/* CTA Button */}
                <Button
                  onClick={scrollToForm}
                  className={`w-full py-6 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-brand-pink to-brand-blue hover:from-brand-pink/90 hover:to-brand-blue/90 text-white'
                      : 'bg-card hover:bg-accent text-foreground border-2 border-border'
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Guarantee */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 text-muted-foreground bg-card px-6 py-3 rounded-full shadow-md">
            <Check className="h-5 w-5 text-green-500" />
            <span className="font-inter">{currentContent.guarantee}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingTable2;

import React from 'react';
import { Shield, Zap, Award, HeartHandshake, TrendingUp, Target } from 'lucide-react';

interface FeaturesBannerProps {
  language: "en" | "pt";
}

const FeaturesBanner: React.FC<FeaturesBannerProps> = ({ language }) => {
  const content = {
    en: {
      title: "Why Choose Maria Faz?",
      features: [
        {
          icon: Zap,
          title: "Lightning Fast",
          description: "Get your analysis in 3-5 minutes"
        },
        {
          icon: Shield,
          title: "100% Secure",
          description: "Your data is encrypted and protected"
        },
        {
          icon: Award,
          title: "Expert Validated",
          description: "AI insights reviewed by specialists"
        },
        {
          icon: TrendingUp,
          title: "Proven Results",
          description: "30% average revenue increase"
        },
        {
          icon: Target,
          title: "Actionable Insights",
          description: "Clear, practical recommendations"
        },
        {
          icon: HeartHandshake,
          title: "Dedicated Support",
          description: "Our team is here to help you succeed"
        }
      ]
    },
    pt: {
      title: "Porquê Escolher a Maria Faz?",
      features: [
        {
          icon: Zap,
          title: "Ultra Rápido",
          description: "Análise em 3-5 minutos"
        },
        {
          icon: Shield,
          title: "100% Seguro",
          description: "Os seus dados são encriptados e protegidos"
        },
        {
          icon: Award,
          title: "Validado por Especialistas",
          description: "Insights de IA revistos por especialistas"
        },
        {
          icon: TrendingUp,
          title: "Resultados Comprovados",
          description: "Aumento médio de 30% nas receitas"
        },
        {
          icon: Target,
          title: "Insights Práticos",
          description: "Recomendações claras e acionáveis"
        },
        {
          icon: HeartHandshake,
          title: "Suporte Dedicado",
          description: "A nossa equipa está aqui para o ajudar"
        }
      ]
    }
  };
  
  const currentContent = language === "en" ? content.en : content.pt;
  
  return (
    <section className="py-16 md:py-20 bg-gradient-to-r from-brand-pink/5 via-brand-blue/5 to-brand-pink/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-brand-black font-playfair">
          {currentContent.title}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {currentContent.features.map((feature, index) => (
            <div
              key={index}
              className="group text-center space-y-3 p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 mx-auto bg-gradient-to-br from-brand-pink/10 to-brand-blue/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <feature.icon className="h-7 w-7 text-brand-pink" />
              </div>
              <div>
                <div className="font-semibold text-brand-black text-sm mb-1 font-montserrat">
                  {feature.title}
                </div>
                <div className="text-xs text-gray-600 font-inter leading-tight">
                  {feature.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesBanner;

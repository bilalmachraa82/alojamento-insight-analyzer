
import React from 'react';
import { Link, Upload, FileCheck } from 'lucide-react';

interface HowItWorksProps {
  language: "en" | "pt";
}

const HowItWorks: React.FC<HowItWorksProps> = ({ language }) => {
  const content = {
    en: {
      title: "How It Works",
      steps: [
        {
          icon: <Link className="h-10 w-10 text-brand-pink" />,
          title: "Step 1: Submit your property link",
          description: "Share your Booking, Airbnb or other platform listing URL with us."
        },
        {
          icon: <Upload className="h-10 w-10 text-brand-blue" />,
          title: "Step 2: AI + expert review",
          description: "Our system analyzes your property data and experts review the results."
        },
        {
          icon: <FileCheck className="h-10 w-10 text-brand-pink" />,
          title: "Step 3: Get your personalized action plan",
          description: "Receive a comprehensive report with actionable improvements."
        }
      ]
    },
    pt: {
      title: "Como Funciona",
      steps: [
        {
          icon: <Link className="h-10 w-10 text-brand-pink" />,
          title: "Passo 1: Envie o link do seu alojamento",
          description: "Partilhe o URL da sua propriedade no Booking, Airbnb ou outra plataforma."
        },
        {
          icon: <Upload className="h-10 w-10 text-brand-blue" />,
          title: "Passo 2: Análise com IA + consultores",
          description: "O nosso sistema analisa os dados da propriedade e especialistas revisam os resultados."
        },
        {
          icon: <FileCheck className="h-10 w-10 text-brand-pink" />,
          title: "Passo 3: Receba o plano estratégico",
          description: "Obtenha um relatório completo com melhorias práticas e implementáveis."
        }
      ]
    }
  };
  
  const currentContent = language === "en" ? content.en : content.pt;
  
  return (
    <section className="py-10">
      <h2 className="text-3xl font-bold text-center mb-12 text-brand-black font-playfair">
        {currentContent.title}
      </h2>
      
      <div className="grid md:grid-cols-3 gap-8">
        {/* Using step title as key - it's unique and stable for this static content */}
        {currentContent.steps.map((step, index) => (
          <div
            key={`step-${step.title}`}
            className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="mb-4 p-4 rounded-full bg-gray-50">
              {step.icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-brand-black font-montserrat">
              {step.title}
            </h3>
            <p className="text-gray-600 font-inter">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;

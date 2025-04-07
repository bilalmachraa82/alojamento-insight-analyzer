
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface PricingTableProps {
  language: "en" | "pt";
  scrollToForm: () => void;
}

const PricingTable: React.FC<PricingTableProps> = ({ language, scrollToForm }) => {
  const content = {
    en: {
      title: "Pricing",
      tableHeaders: ["Plan", "Price", "Includes"],
      plans: [
        {
          name: "Free",
          price: "€0",
          description: "Simplified report",
          features: ["Basic property analysis", "Overall score", "One improvement suggestion"],
          buttonText: "Start Free"
        },
        {
          name: "Premium",
          price: "€19.90",
          description: "Complete plan + PDF + recommendations",
          features: ["Detailed property analysis", "Overall & category scores", "Full recommendations list", "PDF export", "Email support"],
          buttonText: "Choose Premium",
          highlighted: true
        },
        {
          name: "Implementation",
          price: "Custom",
          description: "Implementation with the \"A Maria Faz\" team",
          features: ["Everything in Premium", "Hands-on implementation", "Monthly monitoring", "Full property management available"],
          buttonText: "Contact Us"
        }
      ]
    },
    pt: {
      title: "Preços",
      tableHeaders: ["Plano", "Preço", "Inclui"],
      plans: [
        {
          name: "Gratuito",
          price: "€0",
          description: "Relatório simplificado",
          features: ["Análise básica da propriedade", "Pontuação geral", "Uma sugestão de melhoria"],
          buttonText: "Começar Grátis"
        },
        {
          name: "Premium",
          price: "€19.90",
          description: "Plano completo + PDF + recomendações",
          features: ["Análise detalhada da propriedade", "Pontuações gerais e por categoria", "Lista completa de recomendações", "Exportação em PDF", "Suporte por email"],
          buttonText: "Escolher Premium",
          highlighted: true
        },
        {
          name: "Execução",
          price: "Orçamento",
          description: "Implementação com a equipa \"A Maria Faz\"",
          features: ["Tudo no Premium", "Implementação prática", "Monitorização mensal", "Gestão completa disponível"],
          buttonText: "Contacte-nos"
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
      
      <div className="grid md:grid-cols-3 gap-6">
        {currentContent.plans.map((plan, index) => (
          <div 
            key={index} 
            className={`flex flex-col p-6 rounded-lg border ${
              plan.highlighted 
                ? 'border-brand-pink border-2 shadow-md' 
                : 'border-gray-200 shadow-sm'
            } bg-white`}
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2 text-brand-black font-montserrat">
                {plan.name}
              </h3>
              <div className="flex items-baseline mb-2">
                <span className="text-3xl font-bold text-brand-black">
                  {plan.price}
                </span>
              </div>
              <p className="text-gray-600 font-inter">
                {plan.description}
              </p>
            </div>
            
            <ul className="mb-6 space-y-3 flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <Check className="h-5 w-5 text-brand-pink mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 font-inter">{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button 
              onClick={scrollToForm}
              className={`mt-auto ${
                plan.highlighted 
                  ? 'bg-brand-pink hover:bg-opacity-90 text-brand-black' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              variant={plan.highlighted ? "default" : "outline"}
            >
              {plan.buttonText}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PricingTable;

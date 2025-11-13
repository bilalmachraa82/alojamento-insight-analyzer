import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from 'lucide-react';

interface FAQProps {
  language: "en" | "pt";
}

const FAQ: React.FC<FAQProps> = ({ language }) => {
  const content = {
    en: {
      badge: "FAQ",
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know about our service",
      questions: [
        {
          q: "How long does the analysis take?",
          a: "The AI analysis typically takes 3-5 minutes. You'll receive an email notification when your report is ready."
        },
        {
          q: "What platforms do you support?",
          a: "We currently support Airbnb, Booking.com, and VRBO listings. Simply paste your property URL and we'll do the rest."
        },
        {
          q: "Is my data secure?",
          a: "Absolutely! We use enterprise-grade encryption and follow strict GDPR compliance. Your data is never shared with third parties."
        },
        {
          q: "What's included in the free analysis?",
          a: "The free plan includes a basic property analysis, overall health score (0-100), and one key improvement suggestion."
        },
        {
          q: "Can I upgrade to Premium later?",
          a: "Yes! You can start with the free analysis and upgrade to Premium anytime to unlock the full detailed report with all recommendations."
        },
        {
          q: "What if I need help implementing the recommendations?",
          a: "Choose our Implementation plan and our expert team will handle everything for you, from setup to ongoing optimization."
        }
      ]
    },
    pt: {
      badge: "FAQ",
      title: "Perguntas Frequentes",
      subtitle: "Tudo o que precisa saber sobre o nosso serviço",
      questions: [
        {
          q: "Quanto tempo demora a análise?",
          a: "A análise com IA normalmente demora 3-5 minutos. Receberá uma notificação por email quando o seu relatório estiver pronto."
        },
        {
          q: "Que plataformas suportam?",
          a: "Atualmente suportamos anúncios do Airbnb, Booking.com e VRBO. Basta colar o URL da sua propriedade e fazemos o resto."
        },
        {
          q: "Os meus dados estão seguros?",
          a: "Absolutamente! Usamos encriptação de nível empresarial e seguimos rigorosa conformidade GDPR. Os seus dados nunca são partilhados com terceiros."
        },
        {
          q: "O que está incluído na análise gratuita?",
          a: "O plano gratuito inclui uma análise básica da propriedade, pontuação geral de saúde (0-100) e uma sugestão chave de melhoria."
        },
        {
          q: "Posso fazer upgrade para Premium mais tarde?",
          a: "Sim! Pode começar com a análise gratuita e fazer upgrade para Premium a qualquer momento para desbloquear o relatório detalhado completo com todas as recomendações."
        },
        {
          q: "E se precisar de ajuda a implementar as recomendações?",
          a: "Escolha o nosso plano de Implementação e a nossa equipa de especialistas tratará de tudo por si, desde a configuração até à otimização contínua."
        }
      ]
    }
  };
  
  const currentContent = language === "en" ? content.en : content.pt;
  
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-brand-blue/10 text-brand-blue px-4 py-2 rounded-full text-sm font-medium">
            <HelpCircle className="h-4 w-4" />
            {currentContent.badge}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-brand-black font-playfair">
            {currentContent.title}
          </h2>
          <p className="text-lg text-gray-600 font-inter">
            {currentContent.subtitle}
          </p>
        </div>
        
        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {currentContent.questions.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-xl px-6 hover:border-brand-pink/20 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="font-semibold text-brand-black font-montserrat">
                    {item.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 font-inter leading-relaxed pb-5">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;

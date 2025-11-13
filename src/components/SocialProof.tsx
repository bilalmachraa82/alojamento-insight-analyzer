import React from 'react';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SocialProofProps {
  language: "en" | "pt";
}

const SocialProof: React.FC<SocialProofProps> = ({ language }) => {
  const content = {
    en: {
      badge: "Success Stories",
      title: "Trusted by Property Owners Across Portugal",
      subtitle: "See how our AI-powered insights helped transform their rentals",
      testimonials: [
        {
          name: "João Silva",
          role: "Airbnb Host, Porto",
          rating: 5,
          text: "After implementing the recommendations, my bookings increased by 40% in just 2 months. The pricing strategy alone was worth it!",
          initials: "JS"
        },
        {
          name: "Maria Costa",
          role: "Property Manager, Lisbon",
          rating: 5,
          text: "The detailed analysis helped me understand exactly what guests were complaining about. Fixed those issues and my rating went from 4.2 to 4.8!",
          initials: "MC"
        },
        {
          name: "Pedro Santos",
          role: "Booking.com Host, Algarve",
          rating: 5,
          text: "I was skeptical at first, but the insights were spot on. The competitive analysis showed me I was underpricing by 25%. Revenue is up significantly now.",
          initials: "PS"
        }
      ],
      stats: [
        { value: "500+", label: "Properties Analyzed" },
        { value: "4.9/5", label: "Average Rating" },
        { value: "30%", label: "Avg. Revenue Increase" }
      ]
    },
    pt: {
      badge: "Histórias de Sucesso",
      title: "Confiança de Proprietários em Todo Portugal",
      subtitle: "Veja como os nossos insights com IA transformaram os seus alojamentos",
      testimonials: [
        {
          name: "João Silva",
          role: "Anfitrião Airbnb, Porto",
          rating: 5,
          text: "Após implementar as recomendações, as minhas reservas aumentaram 40% em apenas 2 meses. A estratégia de preços valeu muito a pena!",
          initials: "JS"
        },
        {
          name: "Maria Costa",
          role: "Gestora de Propriedades, Lisboa",
          rating: 5,
          text: "A análise detalhada ajudou-me a entender exatamente o que os hóspedes reclamavam. Resolvi esses problemas e a minha avaliação subiu de 4.2 para 4.8!",
          initials: "MC"
        },
        {
          name: "Pedro Santos",
          role: "Anfitrião Booking.com, Algarve",
          rating: 5,
          text: "Estava cético no início, mas os insights foram certeiros. A análise competitiva mostrou que estava a cobrar 25% abaixo do mercado. As receitas subiram significativamente.",
          initials: "PS"
        }
      ],
      stats: [
        { value: "500+", label: "Propriedades Analisadas" },
        { value: "4.9/5", label: "Classificação Média" },
        { value: "30%", label: "Aumento Médio de Receitas" }
      ]
    }
  };
  
  const currentContent = language === "en" ? content.en : content.pt;
  
  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-br from-brand-beige/20 via-white to-brand-cream/30 overflow-hidden">
      <div className="container mx-auto px-4">
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
        
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
          {currentContent.stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-brand-pink to-brand-blue bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground font-inter">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        
        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {currentContent.testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="bg-card border-2 border-border hover:border-brand-pink/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6 space-y-4">
                {/* Quote Icon */}
                <div className="w-10 h-10 bg-brand-pink/10 rounded-lg flex items-center justify-center">
                  <Quote className="h-5 w-5 text-brand-pink" />
                </div>
                
                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                {/* Testimonial Text */}
                <p className="text-muted-foreground font-inter leading-relaxed">
                  "{testimonial.text}"
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-brand-pink to-brand-blue text-white font-semibold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground text-sm">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;

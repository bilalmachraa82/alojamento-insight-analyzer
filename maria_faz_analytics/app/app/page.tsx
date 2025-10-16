import Link from 'next/link'
import { ArrowRight, BarChart3, FileText, CreditCard, CheckCircle, TrendingUp, Users, Star, Zap, Eye, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { ClientWrapper } from '@/components/client-wrapper'
import { Footer } from '@/components/layout/footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <ClientWrapper>
        <Header />
      </ClientWrapper>
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 lg:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="animate-fade-up font-playfair text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Transforma dados em{' '}
              <span className="bg-maria-gradient bg-clip-text text-transparent">
                resultados
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
              Plataforma especializada em análise de performance para alojamento local. 
              Relatórios profissionais com Health Score e recomendações personalizadas 
              que aumentam a tua rentabilidade em até 40%.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild variant="maria" size="maria" className="animate-fade-up">
                <Link href="/auth/signup">
                  Começar Grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#demonstracao">
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Demonstração
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              ✨ Primeiro relatório completamente grátis • Sem cartão de crédito
            </p>
          </div>
        </div>
        
        {/* Background gradient */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-maria-gradient opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-16 sm:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-playfair text-3xl font-bold tracking-tight sm:text-4xl">
              Como funciona
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Em 3 passos simples, obtém um relatório completo da tua propriedade
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-up">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-maria-gradient">
                  <FileText className="h-8 w-8 text-foreground" />
                </div>
                <CardTitle>1. Adiciona a tua propriedade</CardTitle>
                <CardDescription>
                  Insere o link da tua propriedade no Airbnb, Booking.com ou Vrbo
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-up">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-maria-gradient">
                  <BarChart3 className="h-8 w-8 text-foreground" />
                </div>
                <CardTitle>2. Análise automática</CardTitle>
                <CardDescription>
                  A nossa IA analisa performance, reviews, preços e concorrência
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-up">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-maria-gradient">
                  <TrendingUp className="h-8 w-8 text-foreground" />
                </div>
                <CardTitle>3. Recebe relatório completo</CardTitle>
                <CardDescription>
                  Relatório profissional com Health Score e plano de ação detalhado
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="py-16 sm:py-24 bg-muted/50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-playfair text-3xl font-bold tracking-tight sm:text-4xl">
              Preços transparentes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Experimenta grátis, paga apenas pelos relatórios que precisas
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-2">
            {/* Relatório Grátis */}
            <Card className="relative border-maria-rosa shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Relatório Gratuito</CardTitle>
                  <div className="rounded-full bg-maria-gradient px-3 py-1 text-sm font-medium">
                    Recomendado
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-bold">€0</span>
                  <span className="text-muted-foreground">/primeiro relatório</span>
                </div>
                <CardDescription className="text-base">
                  Perfeito para experimentares a nossa análise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                    <span>1 relatório completo gratuito</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                    <span>Health Score personalizado</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                    <span>Análise de reviews e concorrência</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                    <span>Recomendações de preços</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                    <span>Exportação para PDF</span>
                  </li>
                </ul>
                <Button asChild variant="maria" size="maria" className="w-full mt-6">
                  <Link href="/auth/signup">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Começar Grátis
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Relatórios Adicionais */}
            <Card className="border-maria-azul shadow-lg">
              <CardHeader>
                <CardTitle>Relatórios Adicionais</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">€29</span>
                  <span className="text-muted-foreground">/relatório</span>
                </div>
                <CardDescription className="text-base">
                  Para proprietários com múltiplas propriedades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                    <span>Relatórios ilimitados</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                    <span>Análise comparativa entre propriedades</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                    <span>Histórico de performance</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                    <span>Dashboard avançado</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                    <span>Suporte prioritário</span>
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full mt-6">
                  <Link href="/auth/signup">
                    Experimentar Primeiro Grátis
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              💳 Pagamento seguro com Stripe • Sem subscrições mensais • Paga apenas o que usas
            </p>
          </div>
        </div>
      </section>

      {/* Demonstração */}
      <section id="demonstracao" className="py-16 sm:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-playfair text-3xl font-bold tracking-tight sm:text-4xl">
              Vê um exemplo real
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Relatório completo para uma propriedade no Porto - igual ao que vais receber
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-4xl">
            <Card className="border-0 shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2">
                  <Star className="h-6 w-6 text-yellow-500" />
                  <span>Apartamento Douro Vintage - Health Score: 73/100</span>
                </CardTitle>
                <CardDescription>
                  Análise completa realizada em Setembro 2024
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                      <span className="text-xl font-bold">4.2</span>
                    </div>
                    <h3 className="mt-2 font-semibold">Classificação</h3>
                    <p className="text-sm text-muted-foreground">127 avaliações</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <span className="text-lg font-bold">€18.4k</span>
                    </div>
                    <h3 className="mt-2 font-semibold">Receita Anual</h3>
                    <p className="text-sm text-muted-foreground">Performance atual</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <span className="text-lg font-bold">€65</span>
                    </div>
                    <h3 className="mt-2 font-semibold">Preço/Noite</h3>
                    <p className="text-sm text-muted-foreground">17% abaixo do mercado</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                      <span className="text-lg font-bold">+40%</span>
                    </div>
                    <h3 className="mt-2 font-semibold">Potencial</h3>
                    <p className="text-sm text-muted-foreground">Aumento projetado</p>
                  </div>
                </div>
                
                <div className="mt-8 rounded-lg bg-muted p-4">
                  <h4 className="font-semibold text-green-600 mb-2">✅ Pontos Fortes Identificados:</h4>
                  <ul className="text-sm space-y-1 mb-4">
                    <li>• Localização excepcional no centro do Porto</li>
                    <li>• Vista única para o Douro muito elogiada</li>
                    <li>• Comunicação impecável com hóspedes</li>
                  </ul>
                  
                  <h4 className="font-semibold text-red-600 mb-2">🔧 Melhorias Prioritárias:</h4>
                  <ul className="text-sm space-y-1 mb-4">
                    <li>• Resolver ruído da rua (47% das críticas)</li>
                    <li>• Upgrade Wi-Fi para fibra ótica</li>
                    <li>• Otimizar preços sazonais (+€6.5k/ano)</li>
                  </ul>
                  
                  <div className="text-center">
                    <Button asChild variant="outline" className="mt-2">
                      <Link href="/relatorio-demonstracao" target="_blank">
                        <Download className="mr-2 h-4 w-4" />
                        Ver Relatório Completo
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-maria-gradient py-16 sm:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-playfair text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Pronto para aumentar a rentabilidade?
            </h2>
            <p className="mt-4 text-lg text-foreground/80">
              Milhares de propriedades já aumentaram os lucros com os nossos relatórios. 
              Começa com o teu relatório gratuito hoje mesmo.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button 
                asChild 
                variant="secondary" 
                size="maria"
                className="bg-white text-foreground hover:bg-white/90"
              >
                <Link href="/auth/signup">
                  <Zap className="mr-2 h-5 w-5" />
                  Começar Grátis Agora
                </Link>
              </Button>
              <div className="flex items-center space-x-2 text-sm text-foreground/80">
                <Users className="h-4 w-4" />
                <span>Junta-te a 500+ proprietários satisfeitos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
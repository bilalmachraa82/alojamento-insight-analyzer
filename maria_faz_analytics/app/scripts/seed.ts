
import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 A semear a base de dados...')

  // 1. Criar métricas de Health Score
  console.log('📊 A criar métricas de Health Score...')
  const healthMetrics = [
    {
      category: 'rating',
      weight: 0.25,
      description: 'Classificação média e número de avaliações'
    },
    {
      category: 'revenue',
      weight: 0.20,
      description: 'Performance de receita e preços'
    },
    {
      category: 'occupancy',
      weight: 0.20,
      description: 'Taxa de ocupação e disponibilidade'
    },
    {
      category: 'market_position',
      weight: 0.20,
      description: 'Posição competitiva no mercado'
    },
    {
      category: 'digital_presence',
      weight: 0.15,
      description: 'Qualidade da presença online'
    }
  ]

  for (const metric of healthMetrics) {
    await prisma.healthScoreMetrics.upsert({
      where: { category: metric.category },
      update: {},
      create: metric
    })
  }

  // 2. Criar utilizador admin de teste (mandatório e oculto)
  console.log('👤 A criar utilizador admin de teste...')
  const hashedPassword = await bcryptjs.hash('johndoe123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      firstName: 'John',
      lastName: 'Doe',
      password: hashedPassword,
      role: 'admin',
      credits: 10, // Admin tem mais créditos
      name: 'John Doe'
    }
  })

  // 3. Criar utilizador de demonstração
  console.log('🏠 A criar utilizador de demonstração...')
  const demoPassword = await bcryptjs.hash('demo123', 12)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'maria.silva@exemplo.com' },
    update: {},
    create: {
      email: 'maria.silva@exemplo.com',
      firstName: 'Maria',
      lastName: 'Silva',
      company: 'Propriedades Porto Lda',
      phone: '+351 912 345 678',
      password: demoPassword,
      role: 'user',
      credits: 1,
      name: 'Maria Silva'
    }
  })

  // 4. Criar propriedades de exemplo
  console.log('🏡 A criar propriedades de exemplo...')
  const property1 = await prisma.property.create({
    data: {
      userId: demoUser.id,
      name: 'Apartamento Douro Vintage',
      address: 'Rua do Ouro, 123',
      city: 'Porto',
      country: 'Portugal',
      propertyType: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      airbnbUrl: 'https://airbnb.com/rooms/12345',
      bookingUrl: 'https://booking.com/hotel/pt/douro-vintage.html',
      currentRating: 4.2,
      totalReviews: 127,
      averagePrice: 65,
      monthlyRevenue: 1533,
      occupancyRate: 68,
      responseRate: 98,
      superHostStatus: false,
      marketAveragePrice: 78,
      marketAverageRating: 4.4,
      lastScrapedAt: new Date(),
    }
  })

  const property2 = await prisma.property.create({
    data: {
      userId: demoUser.id,
      name: 'Casa da Ribeira Premium',
      address: 'Travessa da Ribeira, 45',
      city: 'Porto',
      country: 'Portugal',
      propertyType: 'house',
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      airbnbUrl: 'https://airbnb.com/rooms/67890',
      currentRating: 4.6,
      totalReviews: 89,
      averagePrice: 95,
      monthlyRevenue: 2280,
      occupancyRate: 78,
      responseRate: 100,
      superHostStatus: true,
      marketAveragePrice: 92,
      marketAverageRating: 4.4,
      lastScrapedAt: new Date(),
    }
  })

  // 5. Criar relatórios de exemplo
  console.log('📋 A criar relatórios de exemplo...')
  const report1 = await prisma.report.create({
    data: {
      userId: demoUser.id,
      propertyId: property1.id,
      title: 'Relatório de Consultoria - Apartamento Douro Vintage',
      description: 'Análise completa de performance e recomendações de melhoria',
      healthScore: 73,
      scoreCategory: 'good',
      currentRating: 4.2,
      targetRating: 4.6,
      currentRevenue: 18400,
      projectedRevenue: 25900,
      currentOccupancy: 68,
      targetOccupancy: 82,
      averagePrice: 65,
      suggestedPrice: 85,
      reputationAnalysis: 'Propriedade bem posicionada mas com margem de melhoria na gestão de reviews negativas.',
      infrastructureIssues: 'Problemas identificados: Wi-Fi instável, ruído da rua, colchão desconfortável.',
      pricingRecommendations: 'Preço atual 17% abaixo da média de mercado. Recomenda-se aumento gradual.',
      marketingInsights: 'Presença digital precisa de otimização, especialmente fotografias e descrição.',
      guestExperience: 'Experiência positiva mas com pontos críticos que afetam classificações.',
      strongPoints: JSON.stringify([
        'Localização excepcional',
        'Vista para o Douro',
        'Comunicação do anfitrião',
        'Limpeza impecável',
        'Relação qualidade-preço'
      ]),
      criticalIssues: JSON.stringify([
        'Ruído da rua (47% das críticas)',
        'Wi-Fi instável (31%)',
        'Cozinha mal equipada (28%)',
        'Check-in complicado (23%)',
        'Colchão desconfortável (19%)'
      ]),
      recommendations: JSON.stringify([
        'Upgrade para fibra ótica + router mesh',
        'Vidros duplos + cortinas blackout',
        'Colchão memory foam novo',
        'Kit utensílios completo para cozinha',
        'Caixa-forte inteligente para check-in'
      ]),
      status: 'generated'
    }
  })

  const report2 = await prisma.report.create({
    data: {
      userId: demoUser.id,
      propertyId: property2.id,
      title: 'Relatório de Consultoria - Casa da Ribeira Premium',
      description: 'Propriedade com excelente performance - estratégias de otimização avançadas',
      healthScore: 87,
      scoreCategory: 'excellent',
      currentRating: 4.6,
      targetRating: 4.8,
      currentRevenue: 27360,
      projectedRevenue: 32500,
      currentOccupancy: 78,
      targetOccupancy: 85,
      averagePrice: 95,
      suggestedPrice: 110,
      reputationAnalysis: 'Excelente gestão de reputação com Superhost status. Continuar estratégia atual.',
      infrastructureIssues: 'Propriedade bem mantida. Pequenos ajustes recomendados para maximizar comfort.',
      pricingRecommendations: 'Preço competitivo mas com margem para aumento sazonal.',
      marketingInsights: 'Presença digital forte. Foco em expansão para outras plataformas.',
      guestExperience: 'Experiência premium consistente. Implementar programa de fidelização.',
      strongPoints: JSON.stringify([
        'Superhost status',
        'Localização premium na Ribeira',
        'Decoração de qualidade superior',
        'Comunicação impecável',
        'Experiências exclusivas oferecidas'
      ]),
      criticalIssues: JSON.stringify([
        'Preço poderia ser otimizado (minor)',
        'Estratégia de upselling limitada',
        'Presença em redes sociais reduzida'
      ]),
      recommendations: JSON.stringify([
        'Implementar preços dinâmicos sazonais',
        'Criar pacotes de experiências premium',
        'Desenvolver presença no Instagram',
        'Programa de fidelização para hóspedes recorrentes'
      ]),
      status: 'generated'
    }
  })

  // 6. Criar algumas notificações de exemplo
  console.log('📧 A criar notificações de exemplo...')
  await prisma.notification.create({
    data: {
      userId: demoUser.id,
      type: 'welcome',
      subject: 'Bem-vinda à A Maria Faz Analytics!',
      message: 'Olá Maria! O teu relatório grátis está disponível. Explora todas as funcionalidades da nossa plataforma.',
      emailTo: demoUser.email,
      sent: true,
      sentAt: new Date()
    }
  })

  await prisma.notification.create({
    data: {
      adminNotification: true,
      type: 'new_signup',
      subject: 'Novo registo na plataforma',
      message: `Nova utilizadora registada: ${demoUser.email}`,
      emailTo: 'admin@amariafaz.com'
    }
  })

  console.log('✅ Base de dados semeada com sucesso!')
  console.log(`👤 Utilizador admin: john@doe.com (password: johndoe123)`)
  console.log(`🏠 Utilizador demo: maria.silva@exemplo.com (password: demo123)`)
  console.log(`📊 ${healthMetrics.length} métricas de Health Score criadas`)
  console.log(`🏡 2 propriedades de exemplo criadas`)
  console.log(`📋 2 relatórios de exemplo criados`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

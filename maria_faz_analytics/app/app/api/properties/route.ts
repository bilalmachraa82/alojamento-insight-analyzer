
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - Buscar propriedades do utilizador
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const properties = await prisma.property.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(properties)
  } catch (error) {
    console.error('Erro ao buscar propriedades:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Adicionar nova propriedade
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { url, platform } = body

    if (!url || !platform) {
      return NextResponse.json({ error: 'URL e plataforma são obrigatórios' }, { status: 400 })
    }

    // Verificar se o utilizador tem créditos
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.credits <= 0) {
      return NextResponse.json({ error: 'Créditos insuficientes' }, { status: 400 })
    }

    // Simular extração de dados (em produção seria web scraping)
    const mockPropertyData = {
      name: `Propriedade ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
      address: 'Rua Exemplo, 123',
      city: 'Porto',
      country: 'Portugal',
      propertyType: 'apartment',
      bedrooms: Math.floor(Math.random() * 3) + 1,
      bathrooms: Math.floor(Math.random() * 2) + 1,
      maxGuests: Math.floor(Math.random() * 4) + 2,
      currentRating: 3.5 + Math.random() * 1.5,
      totalReviews: Math.floor(Math.random() * 200) + 20,
      averagePrice: Math.floor(Math.random() * 80) + 40,
      monthlyRevenue: Math.floor(Math.random() * 2000) + 1000,
      occupancyRate: Math.floor(Math.random() * 40) + 60,
      responseRate: Math.floor(Math.random() * 20) + 80,
      superHostStatus: Math.random() > 0.7,
      marketAveragePrice: Math.floor(Math.random() * 80) + 50,
      marketAverageRating: 4.0 + Math.random() * 0.5,
      lastScrapedAt: new Date()
    }

    // Criar propriedade
    const property = await prisma.property.create({
      data: {
        userId: session.user.id,
        [`${platform}Url`]: url,
        ...mockPropertyData
      }
    })

    // Gerar relatório automático
    const healthScore = Math.floor(Math.random() * 40) + 60 // Score entre 60-100
    const scoreCategory = healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : 'critical'

    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        propertyId: property.id,
        title: `Relatório de Consultoria - ${property.name}`,
        description: 'Análise completa de performance e recomendações',
        healthScore,
        scoreCategory,
        currentRating: property.currentRating,
        targetRating: Math.min(5.0, (property.currentRating || 0) + 0.4),
        currentRevenue: property.monthlyRevenue ? property.monthlyRevenue * 12 : undefined,
        projectedRevenue: property.monthlyRevenue ? Math.floor(property.monthlyRevenue * 12 * 1.35) : undefined,
        currentOccupancy: property.occupancyRate,
        targetOccupancy: Math.min(95, (property.occupancyRate || 0) + 15),
        averagePrice: property.averagePrice,
        suggestedPrice: property.averagePrice ? Math.floor(property.averagePrice * 1.2) : undefined,
        reputationAnalysis: 'Propriedade bem posicionada com oportunidades de melhoria.',
        infrastructureIssues: 'Algumas melhorias identificadas para aumentar conforto.',
        pricingRecommendations: 'Preço atual abaixo do potencial de mercado.',
        marketingInsights: 'Presença digital pode ser otimizada.',
        guestExperience: 'Experiência positiva com pontos de melhoria específicos.',
        strongPoints: JSON.stringify([
          'Localização privilegiada',
          'Boa comunicação com hóspedes',
          'Limpeza consistente'
        ]),
        criticalIssues: JSON.stringify([
          'Preços abaixo do mercado',
          'Alguns aspectos de infraestrutura',
          'Marketing digital limitado'
        ]),
        recommendations: JSON.stringify([
          'Otimizar preços sazonalmente',
          'Melhorar fotografias da propriedade',
          'Implementar melhorias estruturais'
        ]),
        status: 'generated'
      }
    })

    // Decrementar créditos do utilizador
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        credits: user.credits - 1
      }
    })

    return NextResponse.json({
      success: true,
      property,
      reportId: report.id,
      message: 'Propriedade adicionada e relatório gerado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao adicionar propriedade:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

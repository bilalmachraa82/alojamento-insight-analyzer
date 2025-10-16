
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, Plus, Home, FileText, CreditCard, Settings, LogOut, 
  TrendingUp, Users, Star, Calendar, Download, Eye, AlertCircle,
  Link2, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  role: string
  credits: number
}

interface Property {
  id: string
  name: string
  city?: string
  currentRating?: number
  totalReviews?: number
  averagePrice?: number
  monthlyRevenue?: number
  airbnbUrl?: string
  bookingUrl?: string
  vrboUrl?: string
  createdAt: string
}

interface Report {
  id: string
  title: string
  healthScore: number
  scoreCategory: string
  generatedAt: string
  status: string
  property: {
    name: string
    city?: string
  }
}

interface DashboardClientProps {
  user: User
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [properties, setProperties] = useState<Property[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newPropertyUrl, setNewPropertyUrl] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const router = useRouter()

  // Carregar dados do dashboard
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [propertiesRes, reportsRes] = await Promise.all([
        fetch('/api/properties'),
        fetch('/api/reports')
      ])

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json()
        setProperties(propertiesData)
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json()
        setReports(reportsData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPropertyUrl.trim()) {
      toast.error('Por favor, insere o link da propriedade')
      return
    }

    if (user.credits <= 0) {
      toast.error('Não tens créditos suficientes. Compra mais relatórios.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: newPropertyUrl,
          platform: selectedPlatform,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao adicionar propriedade')
      }

      toast.success('Propriedade adicionada! A gerar relatório...')
      setNewPropertyUrl('')
      setSelectedPlatform('')
      
      // Recarregar dados
      await loadDashboardData()
      
      // Redirecionar para o relatório quando estiver pronto
      if (data.reportId) {
        setTimeout(() => {
          router.push(`/relatorio/${data.reportId}`)
        }, 2000)
      }
    } catch (error) {
      console.error('Erro ao adicionar propriedade:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar propriedade')
    } finally {
      setIsLoading(false)
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreCategoryLabel = (category: string) => {
    switch (category) {
      case 'excellent': return 'Excelente'
      case 'good': return 'Bom'
      case 'critical': return 'Crítico'
      default: return category
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <BarChart3 className="h-8 w-8 text-maria-azul" />
              <h1 className="font-playfair text-xl font-bold">Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                <CreditCard className="inline h-4 w-4 mr-1" />
                {user.credits} créditos
              </div>
              
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="space-y-2">
              <Button
                variant={activeTab === 'overview' ? 'maria' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('overview')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Visão Geral
              </Button>
              
              <Button
                variant={activeTab === 'properties' ? 'maria' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('properties')}
              >
                <Home className="h-4 w-4 mr-2" />
                Propriedades
              </Button>
              
              <Button
                variant={activeTab === 'reports' ? 'maria' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('reports')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Relatórios
              </Button>
              
              <Button
                variant={activeTab === 'credits' ? 'maria' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('credits')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Créditos
              </Button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-playfair font-bold tracking-tight">
                    Olá, {user.firstName || user.name}!
                  </h2>
                  <p className="text-muted-foreground">
                    Bem-vindo ao teu dashboard de analytics de alojamento local
                  </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Propriedades</CardTitle>
                      <Home className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{properties.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Propriedades analisadas
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Relatórios</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{reports.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Relatórios gerados
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Créditos</CardTitle>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{user.credits}</div>
                      <p className="text-xs text-muted-foreground">
                        Relatórios disponíveis
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Health Score Médio</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {reports.length > 0 
                          ? Math.round(reports.reduce((acc, r) => acc + r.healthScore, 0) / reports.length)
                          : '--'
                        }
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Score médio das propriedades
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Add New Property */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Plus className="h-5 w-5 mr-2" />
                      Analisar Nova Propriedade
                    </CardTitle>
                    <CardDescription>
                      Adiciona o link da tua propriedade para receber um relatório detalhado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddProperty} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Plataforma</Label>
                        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolhe a plataforma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="airbnb">Airbnb</SelectItem>
                            <SelectItem value="booking">Booking.com</SelectItem>
                            <SelectItem value="vrbo">Vrbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Link da Propriedade</Label>
                        <div className="flex space-x-2">
                          <div className="relative flex-1">
                            <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              placeholder="https://airbnb.com/rooms/12345..."
                              value={newPropertyUrl}
                              onChange={(e) => setNewPropertyUrl(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <Button type="submit" variant="maria" disabled={isLoading}>
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Analisar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {user.credits <= 0 && (
                        <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">
                            Não tens créditos suficientes. <Button variant="link" className="p-0 h-auto text-amber-600 underline">Comprar mais créditos</Button>
                          </span>
                        </div>
                      )}
                    </form>
                  </CardContent>
                </Card>

                {/* Recent Reports */}
                {reports.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Relatórios Recentes</CardTitle>
                      <CardDescription>
                        Os teus últimos relatórios gerados
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {reports.slice(0, 3).map((report) => (
                          <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${getHealthScoreColor(report.healthScore)}`}>
                                {report.healthScore}
                              </div>
                              <div>
                                <h4 className="font-semibold">{report.property.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {report.property.city} • {getScoreCategoryLabel(report.scoreCategory)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                Ver
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Properties Tab */}
            {activeTab === 'properties' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-playfair font-bold">As Tuas Propriedades</h2>
                  <p className="text-muted-foreground">
                    Gere todas as tuas propriedades e relatórios
                  </p>
                </div>

                {properties.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Ainda não tens propriedades</h3>
                      <p className="text-muted-foreground mb-4">
                        Adiciona a primeira propriedade para começar a receber relatórios
                      </p>
                      <Button variant="maria" onClick={() => setActiveTab('overview')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Propriedade
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                      <Card key={property.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg">{property.name}</CardTitle>
                          <CardDescription>{property.city}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {property.currentRating && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Rating</span>
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                                  <span>{property.currentRating}/5</span>
                                </div>
                              </div>
                            )}
                            
                            {property.totalReviews && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Reviews</span>
                                <span>{property.totalReviews}</span>
                              </div>
                            )}
                            
                            {property.averagePrice && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Preço/Noite</span>
                                <span>€{property.averagePrice}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-4">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                            <Button variant="maria" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              Relatório
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-playfair font-bold">Relatórios</h2>
                  <p className="text-muted-foreground">
                    Todos os teus relatórios de análise
                  </p>
                </div>

                {reports.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhum relatório ainda</h3>
                      <p className="text-muted-foreground mb-4">
                        Adiciona uma propriedade para gerar o teu primeiro relatório
                      </p>
                      <Button variant="maria" onClick={() => setActiveTab('overview')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Gerar Primeiro Relatório
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <Card key={report.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ${getHealthScoreColor(report.healthScore)}`}>
                                {report.healthScore}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{report.property.name}</h3>
                                <p className="text-muted-foreground">
                                  {report.property.city} • Gerado em {new Date(report.generatedAt).toLocaleDateString('pt-PT')}
                                </p>
                                <p className="text-sm font-medium text-maria-azul">
                                  Score: {getScoreCategoryLabel(report.scoreCategory)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Relatório
                              </Button>
                              <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Exportar PDF
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Credits Tab */}
            {activeTab === 'credits' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-playfair font-bold">Créditos</h2>
                  <p className="text-muted-foreground">
                    Gere os teus créditos para relatórios
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Créditos Disponíveis</CardTitle>
                    <CardDescription>
                      Cada crédito permite gerar um relatório completo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-6xl font-bold text-maria-azul mb-4">
                        {user.credits}
                      </div>
                      <p className="text-muted-foreground mb-6">
                        {user.credits === 1 ? 'crédito disponível' : 'créditos disponíveis'}
                      </p>
                      
                      {user.credits <= 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                          <div className="flex items-center justify-center space-x-2 text-amber-600">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">Sem créditos disponíveis</span>
                          </div>
                          <p className="text-sm text-amber-600 mt-1">
                            Compra mais créditos para continuar a gerar relatórios
                          </p>
                        </div>
                      )}
                      
                      <Button variant="maria" size="lg">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Comprar Mais Relatórios
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preços</CardTitle>
                    <CardDescription>
                      Preços transparentes por relatório
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">1 Relatório</h4>
                          <p className="text-sm text-muted-foreground">Análise completa de uma propriedade</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">€29</div>
                          <div className="text-sm text-muted-foreground">por relatório</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-maria-rosa/10">
                        <div>
                          <h4 className="font-semibold">5 Relatórios</h4>
                          <p className="text-sm text-muted-foreground">Poupa €20 no total</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">€125</div>
                          <div className="text-sm text-muted-foreground">€25 por relatório</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-maria-azul/10">
                        <div>
                          <h4 className="font-semibold">10 Relatórios</h4>
                          <p className="text-sm text-muted-foreground">Melhor valor - poupa €60</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">€230</div>
                          <div className="text-sm text-muted-foreground">€23 por relatório</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

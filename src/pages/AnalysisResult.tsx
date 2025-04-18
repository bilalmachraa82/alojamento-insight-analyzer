import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Check, AlertTriangle, TrendingUp, TrendingDown, Zap, Shield, Target, ChevronDown, ChevronUp, ListChecks, Calendar, DollarSign } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type AnalysisResultProps = {};

interface PropertyData {
  name?: string;
  location?: string;
  rating?: string | number;
  reviewCount?: number;
}

interface ScrapedData {
  property_data?: PropertyData;
}

interface DiagnosticSubmission {
  id: string;
  analysis_result: any;
  scraped_data?: ScrapedData | null;
  plataforma?: string;
  link?: string;
}

const AnalysisResult: React.FC<AnalysisResultProps> = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [propertyInfo, setPropertyInfo] = useState<any | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    diagnostico: true,
    estrategia: false,
    experiencia: false,
    precos: false,
    canais: false,
    monitorizacao: false,
    concorrencia: false,
  });

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('diagnostic_submissions')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (!data || !data.analysis_result) {
          throw new Error('Análise não encontrada ou ainda não concluída');
        }
        
        setAnalysis(data.analysis_result);
        
        const submissionData = data as DiagnosticSubmission;
        if (submissionData.scraped_data && typeof submissionData.scraped_data === 'object' && submissionData.scraped_data.property_data) {
          const propertyData = submissionData.scraped_data.property_data;
          
          setPropertyInfo({
            name: propertyData.name || 'Propriedade',
            location: propertyData.location || 'Localização não disponível',
            platform: submissionData.plataforma || 'Plataforma não especificada',
            rating: propertyData.rating || 'N/A',
            reviewCount: propertyData.reviewCount || 0,
            url: submissionData.link
          });
        }
        
      } catch (err: any) {
        console.error('Erro ao buscar análise:', err);
        setError(err.message);
        toast({
          variant: "destructive",
          title: "Erro ao carregar análise",
          description: err.message
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalysisData();
  }, [id]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-amber-500';
    return 'text-red-500';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-amber-100 text-amber-800';
      case 'baixa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const chartConfig = {
    ocupacao: { color: '#8B5CF6' },
    preco_atual: { color: '#F97316' },
    preco_sugerido: { color: '#0EA5E9' },
  };
  
  const seasonalPriceData = analysis?.estrategia_precos?.dados_sazonalidade ? [
    {
      name: 'Alta Temporada',
      preco_atual: Number(propertyInfo?.price?.replace(/[^0-9.-]+/g, '') || 0),
      preco_sugerido: Number(analysis.estrategia_precos.dados_sazonalidade.alta_temporada.preco_recomendado?.replace(/[^0-9.-]+/g, '') || 0),
    },
    {
      name: 'Média Temporada',
      preco_atual: Number(propertyInfo?.price?.replace(/[^0-9.-]+/g, '') || 0),
      preco_sugerido: Number(analysis.estrategia_precos.dados_sazonalidade.media_temporada.preco_recomendado?.replace(/[^0-9.-]+/g, '') || 0),
    },
    {
      name: 'Baixa Temporada',
      preco_atual: Number(propertyInfo?.price?.replace(/[^0-9.-]+/g, '') || 0),
      preco_sugerido: Number(analysis.estrategia_precos.dados_sazonalidade.baixa_temporada.preco_recomendado?.replace(/[^0-9.-]+/g, '') || 0),
    }
  ] : [];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-brand-blue mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Carregando análise da propriedade...</h2>
          <p className="text-gray-500 mt-2">Aguarde enquanto buscamos os resultados da análise</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Erro ao carregar a análise</h2>
          <p className="text-gray-500 mt-2">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Análise não disponível</h2>
          <p className="text-gray-500 mt-2">A análise desta propriedade ainda não foi concluída ou não está disponível.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-playfair">
                Diagnóstico Estratégico
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Análise completa e recomendações para otimização
              </p>
            </div>
            <Button onClick={() => window.history.back()} variant="outline">
              Voltar
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{propertyInfo?.name}</h2>
                <p className="text-gray-500 flex items-center mt-1">
                  <span>{propertyInfo?.location}</span>
                  <span className="mx-2">•</span>
                  <span>{propertyInfo?.platform}</span>
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center">
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <span className="mr-1">★</span>
                  <span>{propertyInfo?.rating}</span>
                  <span className="mx-1">•</span>
                  <span>{propertyInfo?.reviewCount} avaliações</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Pontuação de Visibilidade</CardTitle>
              <CardDescription>Desempenho atual na plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <div className={`text-6xl font-bold ${getScoreColor(analysis.diagnostico_inicial.desempenho_atual.pontuacao_visibilidade)}`}>
                  {analysis.diagnostico_inicial.desempenho_atual.pontuacao_visibilidade}
                  <span className="text-lg text-gray-500">/10</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Taxa de Ocupação</CardTitle>
              <CardDescription>Estimativa atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <div className="text-6xl font-bold text-brand-blue">
                  {analysis.diagnostico_inicial.desempenho_atual.taxa_ocupacao_estimada}
                  <span className="text-lg text-gray-500">%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Potencial de Crescimento</CardTitle>
              <CardDescription>Oportunidade de melhoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <div className="text-3xl font-bold text-emerald-600">
                  {analysis.diagnostico_inicial.metricas_chave.potencial_crescimento}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Collapsible
            open={expandedSections.diagnostico}
            onOpenChange={() => toggleSection('diagnostico')}
            className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6"
          >
            <CollapsibleTrigger className="w-full p-6 flex items-center justify-between text-left">
              <div className="flex items-center">
                <Target className="h-6 w-6 text-brand-blue mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">Diagnóstico Inicial</h2>
              </div>
              {expandedSections.diagnostico ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 pb-6">
                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-lg text-gray-800 mb-3">Desempenho Atual</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Análise de Preços</h4>
                        <p className="mt-1">{analysis.diagnostico_inicial.desempenho_atual.analise_precos}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Análise de Ocupação</h4>
                        <p className="mt-1">{analysis.diagnostico_inicial.desempenho_atual.analise_ocupacao}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Comparativo de Mercado</h4>
                        <p className="mt-1">{analysis.diagnostico_inicial.desempenho_atual.comparativo_mercado}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg text-gray-800 mb-3">Métricas Chave</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-sm font-medium text-gray-500">Preço Médio por Noite</div>
                          <div className="mt-2 text-3xl font-bold">
                            €{analysis.diagnostico_inicial.metricas_chave.preco_medio_noite}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-sm font-medium text-gray-500">Preço Otimizado Sugerido</div>
                          <div className="mt-2 text-3xl font-bold text-emerald-600">
                            €{analysis.diagnostico_inicial.metricas_chave.preco_otimizado_sugerido}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="sm:col-span-2">
                        <CardContent className="pt-6">
                          <div className="text-sm font-medium text-gray-500">Previsão de Receita Anual</div>
                          <div className="mt-2 text-3xl font-bold text-brand-blue">
                            {analysis.diagnostico_inicial.metricas_chave.previsao_receita_anual}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="font-medium text-lg text-gray-800 mb-3">Pontos Fortes</h3>
                    <ul className="space-y-2">
                      {analysis.diagnostico_inicial.pontos_fortes.map((ponto: string, idx: number) => (
                        <li key={`forte-${idx}`} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                          <span>{ponto}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg text-gray-800 mb-3">Áreas de Melhoria</h3>
                    <ul className="space-y-2">
                      {analysis.diagnostico_inicial.areas_melhoria.map((area: string, idx: number) => (
                        <li key={`melhoria-${idx}`} className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 shrink-0 mt-0.5" />
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          <Collapsible
            open={expandedSections.estrategia}
            onOpenChange={() => toggleSection('estrategia')}
            className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6"
          >
            <CollapsibleTrigger className="w-full p-6 flex items-center justify-between text-left">
              <div className="flex items-center">
                <Zap className="h-6 w-6 text-amber-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">Estratégia de Melhoria</h2>
              </div>
              {expandedSections.estrategia ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 pb-6">
                <Separator className="my-4" />
                
                <h3 className="font-medium text-lg text-gray-800 mb-4">Recomendações Técnicas</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recomendação</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Custo</TableHead>
                        <TableHead>Impacto</TableHead>
                        <TableHead>ROI Estimado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.estrategia_melhoria.recomendacoes_tecnicas.map((rec: any, idx: number) => (
                        <TableRow key={`rec-${idx}`}>
                          <TableCell className="font-medium">{rec.descricao}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(rec.prioridade)}`}>
                              {rec.prioridade}
                            </span>
                          </TableCell>
                          <TableCell>{rec.custo_estimado}</TableCell>
                          <TableCell>{rec.impacto_esperado}</TableCell>
                          <TableCell>{rec.roi_estimado}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <h3 className="font-medium text-lg text-gray-800 mb-4 mt-8">Recomendações de Marketing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.estrategia_melhoria.recomendacoes_marketing.map((rec: any, idx: number) => (
                    <Card key={`mkt-${idx}`}>
                      <CardContent className="pt-6">
                        <h4 className="font-medium text-gray-800">{rec.descricao}</h4>
                        <div className="mt-2 space-y-2 text-sm">
                          <div className="flex items-start">
                            <span className="font-medium text-gray-500 w-32">Canal:</span>
                            <span>{rec.canal}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="font-medium text-gray-500 w-32">Impacto:</span>
                            <span>{rec.impacto_esperado}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="font-medium text-gray-500 w-32">Recursos:</span>
                            <span>{rec.recursos_necessarios}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {analysis.estrategia_melhoria.sugestoes_rebranding && (
                  <div className="mt-8">
                    <h3 className="font-medium text-lg text-gray-800 mb-3">Sugestões de Rebranding</h3>
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                      <p className="text-blue-800">{analysis.estrategia_melhoria.sugestoes_rebranding}</p>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          <Collapsible
            open={expandedSections.experiencia}
            onOpenChange={() => toggleSection('experiencia')}
            className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6"
          >
            <CollapsibleTrigger className="w-full p-6 flex items-center justify-between text-left">
              <div className="flex items-center">
                <ListChecks className="h-6 w-6 text-emerald-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">Experiência do Hóspede</h2>
              </div>
              {expandedSections.experiencia ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 pb-6">
                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-lg text-gray-800 mb-3">Análise de Comentários</h3>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="text-sm font-medium text-gray-800 mb-3">Temas Positivos</h4>
                        <ul className="space-y-2">
                          {analysis.experiencia_hospede.analise_comentarios.temas_positivos.map((tema: string, idx: number) => (
                            <li key={`pos-${idx}`} className="flex items-start">
                              <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                              <span>{tema}</span>
                            </li>
                          ))}
                        </ul>
                        
                        <h4 className="text-sm font-medium text-gray-800 mt-4 mb-3">Temas Negativos</h4>
                        <ul className="space-y-2">
                          {analysis.experiencia_hospede.analise_comentarios.temas_negativos.map((tema: string, idx: number) => (
                            <li key={`neg-${idx}`} className="flex items-start">
                              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 shrink-0 mt-0.5" />
                              <span>{tema}</span>
                            </li>
                          ))}
                        </ul>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="text-sm font-medium text-gray-500">Sentimento Geral</div>
                          <div className="mt-1 font-medium">
                            {analysis.experiencia_hospede.analise_comentarios.sentimento_geral}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="mt-6">
                      <h3 className="font-medium text-lg text-gray-800 mb-3">Pontos Positivos Atuais</h3>
                      <ul className="space-y-2">
                        {analysis.experiencia_hospede.pontos_positivos.map((ponto: string, idx: number) => (
                          <li key={`exp-pos-${idx}`} className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                            <span>{ponto}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg text-gray-800 mb-3">Sugestões de Melhoria</h3>
                    <div className="space-y-4">
                      {analysis.experiencia_hospede.sugestoes_melhoria.map((sugestao: any, idx: number) => (
                        <Card key={`sug-${idx}`}>
                          <CardContent className="pt-6">
                            <h4 className="font-medium text-gray-800">{sugestao.descricao}</h4>
                            <div className="mt-2 space-y-2 text-sm">
                              <div className="flex items-start">
                                <span className="font-medium text-gray-500 w-36">Implementação:</span>
                                <span>{sugestao.implementacao}</span>
                              </div>
                              <div className="flex items-start">
                                <span className="font-medium text-gray-500 w-36">Custo Estimado:</span>
                                <span>{sugestao.custo_estimado}</span>
                              </div>
                              <div className="flex items-start">
                                <span className="font-medium text-gray-500 w-36">Impacto na Experiência:</span>
                                <span>{sugestao.impacto_experiencia}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-medium text-lg text-gray-800 mb-3">Ideias de Valor Agregado</h3>
                      <ul className="space-y-2">
                        {analysis.experiencia_hospede.ideias_valor_agregado.map((ideia: string, idx: number) => (
                          <li key={`ideia-${idx}`} className="flex items-start">
                            <Zap className="h-5 w-5 text-amber-500 mr-2 shrink-0 mt-0.5" />
                            <span>{ideia}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          <Collapsible
            open={expandedSections.precos}
            onOpenChange={() => toggleSection('precos')}
            className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6"
          >
            <CollapsibleTrigger className="w-full p-6 flex items-center justify-between text-left">
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 text-green-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">Estratégia de Preços</h2>
              </div>
              {expandedSections.precos ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 pb-6">
                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-lg text-gray-800 mb-3">Análise de Preços</h3>
                    <div className="space-y-4">
                      <div>
                        <p>{analysis.estrategia_precos.analise_atual}</p>
                        <div className="mt-4 bg-green-50 p-4 rounded-md border border-green-100">
                          <h4 className="font-medium text-green-800">Recomendação de Preço Base</h4>
                          <p className="mt-1 text-green-700">{analysis.estrategia_precos.recomendacao_preco_base}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-medium text-lg text-gray-800 mb-3">Política de Descontos</h3>
                      <ul className="space-y-2">
                        {analysis.estrategia_precos.politica_descontos.map((politica: string, idx: number) => (
                          <li key={`desc-${idx}`} className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                            <span>{politica}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-medium text-lg text-gray-800 mb-3">Preços Sugeridos por Período</h3>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Estadia Semanal:</span>
                              <span className="text-lg font-bold">€{analysis.estrategia_precos.tabela_precos_sugeridos.semanal}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Estadia Mensal:</span>
                              <span className="text-lg font-bold">€{analysis.estrategia_precos.tabela_precos_sugeridos.mensal}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Estadia Mínima Recomendada:</span>
                              <span className="text-lg font-bold">{analysis.estrategia_precos.tabela_precos_sugeridos.minimo_estadia_recomendado} noites</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg text-gray-800 mb-3">Estratégia Sazonal</h3>
                    <div className="h-72">
                      <ChartContainer 
                        className="h-full"
                        config={chartConfig}
                      >
                        <BarChart 
                          data={seasonalPriceData} 
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <ChartTooltip 
                            content={<ChartTooltipContent />} 
                            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} 
                          />
                          <Legend />
                          <Bar dataKey="preco_atual" name="Preço Atual" fill={chartConfig.preco_atual.color} />
                          <Bar dataKey="preco_sugerido" name="Preço Sugerido" fill={chartConfig.preco_sugerido.color} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                      {Object.entries(analysis.estrategia_precos.dados_sazonalidade).map(([temporada, dados]: [string, any]) => (
                        <Card key={temporada}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium capitalize">{temporada.replace('_', ' ')}</CardTitle>
                            <CardDescription>{dados.meses.join(', ')}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">{dados.estrategia}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {analysis.estrategia_precos.eventos_especiais.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-medium text-lg text-gray-800 mb-3">Eventos Especiais</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {analysis.estrategia_precos.eventos_especiais.map((evento: any, idx: number) => (
                            <Card key={`evento-${idx}`}>
                              <CardContent className="pt-6">
                                <div className="flex justify-between">
                                  <div>
                                    <h4 className="font-medium text-gray-800">{evento.nome}</h4>
                                    <p className="text-sm text-gray-500">{evento.data}</p>
                                  </div>
                                </div>
                                <p className="mt-2 text-sm">{evento.estrategia_preco}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          <div className="flex gap-4 justify-end mt-8">
            <Button variant="outline">
              Baixar Relatório PDF
            </Button>
            <Button>
              Agendar Consultoria
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;

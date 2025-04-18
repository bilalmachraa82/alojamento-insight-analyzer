
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnalysisSection from "./AnalysisSection";
import PerformanceMetrics from "./PerformanceMetrics";
import RecommendationsList from "./RecommendationsList";
import PricingStrategy from "./PricingStrategy";
import CompetitorAnalysis from "./CompetitorAnalysis";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalysisResultsViewerProps {
  analysis: any;
  propertyInfo: any;
  loading?: boolean;
}

const AnalysisResultsViewer = ({ analysis, propertyInfo, loading = false }: AnalysisResultsViewerProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  if (loading) {
    return <AnalysisResultsSkeleton />;
  }

  if (!analysis || !propertyInfo) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Analysis Not Found</h2>
        <p className="text-gray-600">
          We couldn't find the analysis results. It may have been deleted or not yet processed.
        </p>
      </div>
    );
  }

  // Extract data from analysis result
  const {
    diagnostico_inicial,
    estrategia_melhoria,
    experiencia_hospede,
    estrategia_precos,
    gestao_canais,
    monitorizacao_desempenho,
    analise_concorrencia
  } = analysis;
  
  // Prepare performance metrics data
  const performanceMetrics = {
    visibilityScore: diagnostico_inicial?.desempenho_atual?.pontuacao_visibilidade || 0,
    occupancyRate: diagnostico_inicial?.desempenho_atual?.taxa_ocupacao_estimada || 0,
    ratingScore: diagnostico_inicial?.desempenho_atual?.pontuacao_rating || 0,
    avgPrice: diagnostico_inicial?.metricas_chave?.preco_medio_noite || 0,
    suggestedPrice: diagnostico_inicial?.metricas_chave?.preco_otimizado_sugerido || 0,
    annualRevenue: diagnostico_inicial?.metricas_chave?.previsao_receita_anual || "0€",
    growthPotential: diagnostico_inicial?.metricas_chave?.potencial_crescimento || "0%"
  };
  
  // Prepare price comparison data
  const priceCompData = [
    {
      name: "Daily",
      current: performanceMetrics.avgPrice,
      suggested: performanceMetrics.suggestedPrice,
      benchmark: Math.round((performanceMetrics.avgPrice + performanceMetrics.suggestedPrice) / 2)
    },
    {
      name: "Weekly",
      current: performanceMetrics.avgPrice * 7 * 0.9,
      suggested: performanceMetrics.suggestedPrice * 7 * 0.9,
      benchmark: Math.round(((performanceMetrics.avgPrice + performanceMetrics.suggestedPrice) / 2) * 7 * 0.9)
    },
    {
      name: "Monthly",
      current: performanceMetrics.avgPrice * 30 * 0.8,
      suggested: performanceMetrics.suggestedPrice * 30 * 0.8,
      benchmark: Math.round(((performanceMetrics.avgPrice + performanceMetrics.suggestedPrice) / 2) * 30 * 0.8)
    }
  ];

  // Prepare technical recommendations
  const technicalRecommendations = estrategia_melhoria?.recomendacoes_tecnicas?.map((rec: any, index: number) => ({
    id: `tech-${index}`,
    description: rec.descricao,
    priority: rec.prioridade,
    cost: rec.custo_estimado,
    impact: rec.impacto_esperado,
    roi: rec.roi_estimado,
    timeframe: rec.tempo_implementacao
  })) || [];

  // Prepare marketing recommendations
  const marketingRecommendations = estrategia_melhoria?.recomendacoes_marketing?.map((rec: any, index: number) => ({
    id: `marketing-${index}`,
    description: rec.descricao,
    priority: "medium",
    cost: rec.recursos_necessarios,
    impact: rec.impacto_esperado,
    roi: "Varies",
    timeframe: "1-3 months"
  })) || [];

  // Prepare guest experience recommendations
  const guestExperienceRecommendations = experiencia_hospede?.sugestoes_melhoria?.map((rec: any, index: number) => ({
    id: `guest-${index}`,
    description: rec.descricao,
    priority: "medium",
    cost: rec.custo_estimado,
    impact: rec.impacto_experiencia,
    roi: "High",
    timeframe: "1-2 months"
  })) || [];

  // Prepare pricing strategy data
  const pricingStrategyData = {
    basePrice: `${estrategia_precos?.recomendacao_preco_base || ""}`,
    currentAnalysis: estrategia_precos?.analise_atual || "",
    seasonalPricing: [
      {
        season: "high",
        months: estrategia_precos?.dados_sazonalidade?.alta_temporada?.meses || [],
        price: parseInt(estrategia_precos?.dados_sazonalidade?.alta_temporada?.preco_recomendado || "0"),
        strategy: estrategia_precos?.dados_sazonalidade?.alta_temporada?.estrategia || ""
      },
      {
        season: "medium",
        months: estrategia_precos?.dados_sazonalidade?.media_temporada?.meses || [],
        price: parseInt(estrategia_precos?.dados_sazonalidade?.media_temporada?.preco_recomendado || "0"),
        strategy: estrategia_precos?.dados_sazonalidade?.media_temporada?.estrategia || ""
      },
      {
        season: "low",
        months: estrategia_precos?.dados_sazonalidade?.baixa_temporada?.meses || [],
        price: parseInt(estrategia_precos?.dados_sazonalidade?.baixa_temporada?.preco_recomendado || "0"),
        strategy: estrategia_precos?.dados_sazonalidade?.baixa_temporada?.estrategia || ""
      }
    ],
    specialEvents: estrategia_precos?.eventos_especiais || [],
    discountPolicies: estrategia_precos?.politica_descontos || [],
    weeklyPrice: estrategia_precos?.tabela_precos_sugeridos?.semanal || 0,
    monthlyPrice: estrategia_precos?.tabela_precos_sugeridos?.mensal || 0,
    minStay: estrategia_precos?.tabela_precos_sugeridos?.minimo_estadia_recomendado || 1
  };

  // Prepare competitor analysis data
  const competitorAnalysisData = {
    marketPosition: analise_concorrencia?.posicionamento_mercado || "",
    advantages: analise_concorrencia?.vantagens_competitivas || [],
    disadvantages: analise_concorrencia?.areas_desvantagem || [],
    opportunities: analise_concorrencia?.oportunidades || [],
    threats: analise_concorrencia?.ameacas || [],
    competitors: analise_concorrencia?.benchmark_concorrentes?.map((comp: any) => ({
      name: comp.nome,
      price: comp.preco,
      strengths: comp.pontos_fortes,
      differentiator: comp.diferencial_competitivo
    })) || []
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{propertyInfo.name}</h1>
            <p className="text-gray-600">{propertyInfo.location}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="text-sm text-gray-500">Platform</div>
            <div className="font-semibold">{propertyInfo.platform}</div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <div className="text-sm text-gray-500">Rating</div>
            <div className="font-semibold">{propertyInfo.rating}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Reviews</div>
            <div className="font-semibold">{propertyInfo.reviewCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Price</div>
            <div className="font-semibold">{propertyInfo.price}</div>
          </div>
        </div>

        <Tabs 
          defaultValue="overview" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Strategy</TabsTrigger>
            <TabsTrigger value="competition">Competition</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="overview" className="space-y-6">
              <AnalysisSection title="Performance Overview" initiallyExpanded={true}>
                <PerformanceMetrics 
                  metrics={performanceMetrics}
                  comparativeData={priceCompData}
                />
              </AnalysisSection>
              
              <AnalysisSection title="Strengths & Improvement Areas">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Strengths</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {diagnostico_inicial?.pontos_fortes?.map((item: string, index: number) => (
                        <li key={index} className="text-gray-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Areas for Improvement</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {diagnostico_inicial?.areas_melhoria?.map((item: string, index: number) => (
                        <li key={index} className="text-gray-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AnalysisSection>
              
              <AnalysisSection title="Guest Experience">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Positive Aspects</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {experiencia_hospede?.pontos_positivos?.map((item: string, index: number) => (
                        <li key={index} className="text-gray-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Review Sentiment</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium mb-2">General Sentiment</h4>
                      <p className="text-gray-700 mb-4">{experiencia_hospede?.analise_comentarios?.sentimento_geral}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-green-700 mb-1">Positive Themes</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {experiencia_hospede?.analise_comentarios?.temas_positivos?.map((item: string, index: number) => (
                              <li key={index} className="text-gray-700">{item}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-red-700 mb-1">Negative Themes</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {experiencia_hospede?.analise_comentarios?.temas_negativos?.map((item: string, index: number) => (
                              <li key={index} className="text-gray-700">{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnalysisSection>
              
              <AnalysisSection title="Channel Management">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Recommended Platforms</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {gestao_canais?.plataformas_recomendadas?.map((item: string, index: number) => (
                        <li key={index} className="text-gray-700">{item}</li>
                      ))}
                    </ul>
                    
                    <h3 className="text-lg font-medium mt-4 mb-3">Additional Suggested Channels</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {gestao_canais?.canais_adicionais_sugeridos?.map((item: string, index: number) => (
                        <li key={index} className="text-gray-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Distribution Strategy</h3>
                    <p className="text-gray-700 mb-4">{gestao_canais?.estrategia_distribuicao}</p>
                    
                    <h3 className="text-lg font-medium mt-4 mb-3">Optimization Tips</h3>
                    <div className="space-y-3">
                      {gestao_canais?.dicas_otimizacao?.map((tip: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-md">
                          <h4 className="font-medium">{tip.plataforma}</h4>
                          <p className="text-sm text-gray-600 mb-1">Action: {tip.acao}</p>
                          <p className="text-sm">Benefit: {tip.beneficio}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AnalysisSection>
              
              <AnalysisSection title="Performance Monitoring">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Key Performance Indicators</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-200 px-4 py-2 text-left">Metric</th>
                            <th className="border border-gray-200 px-4 py-2 text-left">Current</th>
                            <th className="border border-gray-200 px-4 py-2 text-left">Target</th>
                            <th className="border border-gray-200 px-4 py-2 text-left">Frequency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monitorizacao_desempenho?.kpis_principais?.map((kpi: any, index: number) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-200 px-4 py-2">{kpi.metrica}</td>
                              <td className="border border-gray-200 px-4 py-2">{kpi.valor_atual}</td>
                              <td className="border border-gray-200 px-4 py-2">{kpi.objetivo}</td>
                              <td className="border border-gray-200 px-4 py-2">{kpi.frequencia_monitoramento}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Financial Projections</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-md">
                        <h4 className="font-medium text-blue-800 mb-2">Conservative Scenario</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-sm text-gray-500">Annual Revenue</span>
                            <p className="font-semibold">{monitorizacao_desempenho?.projecoes_financeiras?.cenario_conservador?.receita_anual}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Expenses</span>
                            <p className="font-semibold">{monitorizacao_desempenho?.projecoes_financeiras?.cenario_conservador?.despesas}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-sm text-gray-500">Estimated Profit</span>
                            <p className="font-semibold">{monitorizacao_desempenho?.projecoes_financeiras?.cenario_conservador?.lucro_estimado}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-md">
                        <h4 className="font-medium text-green-800 mb-2">Optimistic Scenario</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-sm text-gray-500">Annual Revenue</span>
                            <p className="font-semibold">{monitorizacao_desempenho?.projecoes_financeiras?.cenario_otimista?.receita_anual}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Expenses</span>
                            <p className="font-semibold">{monitorizacao_desempenho?.projecoes_financeiras?.cenario_otimista?.despesas}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-sm text-gray-500">Estimated Profit</span>
                            <p className="font-semibold">{monitorizacao_desempenho?.projecoes_financeiras?.cenario_otimista?.lucro_estimado}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-amber-50 p-4 rounded-md">
                        <h4 className="font-medium text-amber-800 mb-2">Return on Investment</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-sm text-gray-500">Estimated Time</span>
                            <p className="font-semibold">{monitorizacao_desempenho?.projecoes_financeiras?.retorno_investimento?.tempo_estimado}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">ROI %</span>
                            <p className="font-semibold">{monitorizacao_desempenho?.projecoes_financeiras?.retorno_investimento?.roi_percentual}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnalysisSection>
            </TabsContent>
            
            <TabsContent value="recommendations" className="space-y-6">
              <AnalysisSection title="Technical Improvements" initiallyExpanded={true}>
                <RecommendationsList 
                  recommendations={technicalRecommendations}
                  title="Technical Recommendations"
                />
              </AnalysisSection>
              
              <AnalysisSection title="Marketing Strategy">
                <RecommendationsList 
                  recommendations={marketingRecommendations}
                  title="Marketing Recommendations"
                />
              </AnalysisSection>
              
              <AnalysisSection title="Guest Experience Improvements">
                <RecommendationsList 
                  recommendations={guestExperienceRecommendations}
                  title="Guest Experience Enhancements"
                />
              </AnalysisSection>
              
              {estrategia_melhoria?.sugestoes_rebranding && (
                <AnalysisSection title="Rebranding Suggestions">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-gray-700">{estrategia_melhoria?.sugestoes_rebranding}</p>
                  </div>
                </AnalysisSection>
              )}
              
              <AnalysisSection title="Value-Added Ideas">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-3">Ideas to Add Value</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {experiencia_hospede?.ideias_valor_agregado?.map((item: string, index: number) => (
                      <li key={index} className="text-gray-700">{item}</li>
                    ))}
                  </ul>
                </div>
              </AnalysisSection>
            </TabsContent>
            
            <TabsContent value="pricing" className="space-y-6">
              <AnalysisSection title="Pricing Strategy" initiallyExpanded={true}>
                <PricingStrategy {...pricingStrategyData} />
              </AnalysisSection>
            </TabsContent>
            
            <TabsContent value="competition" className="space-y-6">
              <AnalysisSection title="Competitive Analysis" initiallyExpanded={true}>
                <CompetitorAnalysis {...competitorAnalysisData} />
              </AnalysisSection>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

const AnalysisResultsSkeleton = () => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="mt-4 md:mt-0">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-36" />
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>

        <div className="mb-4">
          <Skeleton className="h-10 w-full" />
        </div>
        
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4">
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="p-4">
                <div className="grid gap-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultsViewer;

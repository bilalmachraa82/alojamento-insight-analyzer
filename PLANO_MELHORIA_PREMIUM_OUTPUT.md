# 📊 Plano de Melhoria Premium - Sistema de Análise de Alojamento Local

**Data:** 16 Outubro 2025  
**Projeto:** Alojamento Insight Analyzer  
**Objetivo:** Transformar o sistema actual num produto premium alinhado com as best practices da indústria

---

## 🎯 Sumário Executivo

Após análise profunda do sistema actual e investigação das best practices da indústria (AirDNA, PriceLabs, STR, Beyond Pricing), identificámos gaps críticos e definimos um roadmap de implementação em 6 fases para criar outputs premium de classe mundial.

### Estado Actual vs. Indústria

| Aspecto | Actual | Best Practice Indústria | Gap |
|---------|--------|------------------------|-----|
| **KPIs Core** | ADR, Ocupação básicos | ADR, RevPAR, TRevPAR, GOPPAR, NRevPAR | ⚠️ Alto |
| **Benchmarking** | Inexistente | ARI, MPI, RGI vs. comp set | 🔴 Crítico |
| **Health Score** | 6 proxies simples | Ponderado por pilares, normalizado | ⚠️ Alto |
| **Market Intelligence** | Dados mock/estimados | Rate shopping real-time, eventos | 🔴 Crítico |
| **Reviews Analysis** | Sem análise | NLP topic-based sentiment | ⚠️ Alto |
| **Pricing** | Estático | Dynamic pricing + sazonalidade | ⚠️ Alto |
| **Canais** | Não trackado | NRevPAR por canal, DRR | ⚠️ Alto |
| **Template Premium** | 30% integrado | 100% data-driven | ⚠️ Alto |

---

## 📈 Best Practices da Indústria Identificadas

### 1. KPIs Standard (Fontes: STR, AltExsoft, SummerOS)

#### Métricas Core de Revenue
- **ADR** (Average Daily Rate) = Room Revenue / Rooms Sold
- **RevPAR** (Revenue per Available Room) = Room Revenue / Rooms Available = ADR × Occupancy
- **TRevPAR** (Total RevPAR) = Total Revenue (room + ancillary) / Rooms Available
- **GOPPAR** (Gross Operating Profit PAR) = (Revenue - Operating Expenses) / Rooms Available
- **NRevPAR** (Net RevPAR) = (Room Revenue - Distribution Costs) / Rooms Available
- **CPOR** (Cost per Occupied Room) = Operating Expenses / Rooms Sold
- **ALOS** (Average Length of Stay) = Room Nights / Bookings

#### Métricas de Benchmarking
- **ARI** (Average Rate Index) = Your ADR / Market ADR × 100
- **MPI** (Market Penetration Index) = Your Occupancy / Market Occupancy × 100
- **RGI** (Revenue Generation Index) = Your RevPAR / Market RevPAR × 100

#### Métricas de Distribuição
- **DRR** (Direct Revenue Ratio) = Direct Revenue / Total Revenue × 100
- **LBR** (Look-to-Book Ratio) = Bookings / Views
- **MCPB** (Marketing Cost per Booking) = Marketing Costs / Bookings

#### Métricas de Guest Experience
- **CSAT** (Customer Satisfaction Score) - Rating directo 0-10
- **NPS** (Net Promoter Score) - "Likelihood to recommend" 0-10
- **CES** (Customer Effort Score) - Facilidade de interacção
- **Repeat Guest Rate** = Repeat Guests / Total Guests × 100
- **Response Time** & **Response Rate** (< 24h)

### 2. Health Score Methodology (Indústria Hospitality)

#### Estrutura de Pilares Ponderados
```
Health Score = Σ (Pilar_Score × Peso_Pilar)

Pilares e Pesos:
├─ Revenue Performance (30%)
│  ├─ RevPAR percentile vs. market
│  ├─ ADR trend (YoY, MoM)
│  └─ Occupancy trend
│
├─ Market Position (15%)
│  ├─ RGI (primário)
│  ├─ ARI
│  └─ MPI
│
├─ Guest Experience (25%)
│  ├─ NPS/CSAT normalized
│  ├─ Response time/rate
│  └─ Repeat guest rate
│
├─ Distribution & Demand (15%)
│  ├─ NRevPAR por canal
│  ├─ DRR
│  └─ LBR + Cancellation rate
│
├─ Operational Efficiency (10%)
│  ├─ CPOR
│  └─ TRevPAR vs. target
│
└─ Data Quality (5%)
   ├─ Completeness (% dias completos)
   ├─ Freshness (latency)
   └─ Consistency
```

#### Normalização de Métricas
- **Benchmarks:** Percentil vs. comp set (RGI 100 = top quartil)
- **Z-score truncado:** Evitar outliers
- **Metas SMART:** Quando definidas internamente

#### Categorização
- 85-100: **Excelente** 🟢
- 70-84: **Bom** 🟡
- 50-69: **Atenção** 🟠
- 0-49: **Crítico** 🔴

### 3. Dynamic Pricing Standards (PriceLabs, Beyond Pricing, Wheelhouse)

#### Factores de Ajuste Dinâmico
1. **Sazonalidade:** High/Mid/Low season multipliers
2. **Dia da semana:** Weekend vs. weekday premiums
3. **Eventos locais:** Conferences, festivals, sports
4. **Booking window:** Last-minute vs. advance booking
5. **Competitor rates:** Real-time rate shopping
6. **Occupancy forecast:** Demand-based adjustments
7. **Length of stay:** Discounts for longer stays

#### Metodologia Recomendada
```
Recommended_Price = Base_ADR × 
                   Seasonality_Factor × 
                   Day_of_Week_Factor × 
                   Event_Impact × 
                   Demand_Factor × 
                   Competitive_Position_Factor
```

### 4. Review Sentiment Analysis (Hospitality NLP Standards)

#### Topic-Based Analysis
Tópicos Standard:
- **Limpeza:** Cleanliness, hygiene, maintenance
- **Conforto:** Bed quality, noise, temperature
- **Localização:** Accessibility, neighbourhood, parking
- **Comunicação:** Host responsiveness, instructions
- **Amenities:** WiFi, kitchen, appliances
- **Value:** Price-quality ratio

#### Sentiment Extraction
- **Positivo:** 0.6-1.0
- **Neutro:** 0.4-0.6
- **Negativo:** 0.0-0.4

#### Outputs Esperados
- Sentiment score por tópico
- Volume de menções por tópico
- Evolução temporal do sentiment
- Comparação com comp set

---

## 🏗️ Arquitectura de Dados Recomendada

### Schema Star Model (Supabase)

```sql
-- DIMENSÕES
CREATE TABLE dim_property (
    property_id UUID PRIMARY KEY,
    market_id UUID,
    name TEXT,
    room_count INT,
    property_type TEXT
);

CREATE TABLE dim_date (
    date DATE PRIMARY KEY,
    day_of_week INT,
    week INT,
    month INT,
    quarter INT,
    year INT,
    is_weekend BOOLEAN,
    is_holiday BOOLEAN
);

CREATE TABLE dim_channel (
    channel_id UUID PRIMARY KEY,
    name TEXT,
    type TEXT, -- 'OTA' | 'Direct'
    commission_rate DECIMAL
);

CREATE TABLE dim_competitor (
    competitor_id UUID PRIMARY KEY,
    market_id UUID,
    name TEXT,
    distance_km DECIMAL
);

CREATE TABLE dim_event (
    event_id UUID PRIMARY KEY,
    market_id UUID,
    name TEXT,
    start_date DATE,
    end_date DATE,
    event_type TEXT,
    impact_score DECIMAL
);

-- FACTOS (Grão = property + date)
CREATE TABLE fact_daily (
    property_id UUID,
    date DATE,
    rooms_available INT,
    rooms_sold INT,
    room_revenue DECIMAL,
    total_revenue DECIMAL, -- inclui ancillary
    room_cost DECIMAL,
    cancellations INT,
    searches INT,
    bookings INT,
    direct_revenue DECIMAL,
    PRIMARY KEY (property_id, date)
);

CREATE TABLE fact_channel_daily (
    property_id UUID,
    date DATE,
    channel_id UUID,
    room_revenue DECIMAL,
    bookings INT,
    cancellations INT,
    acquisition_cost DECIMAL,
    PRIMARY KEY (property_id, date, channel_id)
);

CREATE TABLE fact_competitor_rates (
    property_id UUID,
    date DATE,
    competitor_id UUID,
    adr_comp DECIMAL,
    occupancy_comp DECIMAL,
    revpar_comp DECIMAL,
    PRIMARY KEY (property_id, date, competitor_id)
);

CREATE TABLE fact_reviews (
    review_id UUID PRIMARY KEY,
    property_id UUID,
    date DATE,
    platform TEXT,
    rating DECIMAL,
    nps_score INT,
    csat_score INT,
    response_time_hours DECIMAL
);

CREATE TABLE fact_sentiment_topics (
    property_id UUID,
    date DATE,
    platform TEXT,
    topic TEXT,
    sentiment_score DECIMAL,
    mention_count INT,
    PRIMARY KEY (property_id, date, platform, topic)
);

-- VIEWS DE KPIs
CREATE MATERIALIZED VIEW kpi_daily AS
SELECT 
    property_id,
    date,
    -- Core Metrics
    ROUND(rooms_sold::DECIMAL / NULLIF(rooms_available, 0) * 100, 2) as occupancy_rate,
    ROUND(room_revenue / NULLIF(rooms_sold, 0), 2) as adr,
    ROUND(room_revenue / NULLIF(rooms_available, 0), 2) as revpar,
    ROUND(total_revenue / NULLIF(rooms_available, 0), 2) as trevpar,
    ROUND(room_cost / NULLIF(rooms_sold, 0), 2) as cpor,
    ROUND(rooms_sold::DECIMAL / NULLIF(bookings, 0), 2) as alos,
    -- Distribution Metrics
    ROUND(direct_revenue::DECIMAL / NULLIF(room_revenue, 0) * 100, 2) as drr,
    ROUND(bookings::DECIMAL / NULLIF(searches, 0) * 100, 2) as lbr,
    -- Raw data
    rooms_available,
    rooms_sold,
    room_revenue,
    total_revenue,
    bookings
FROM fact_daily;

CREATE MATERIALIZED VIEW kpi_comp_set_daily AS
SELECT 
    f.property_id,
    f.date,
    AVG(c.adr_comp) as market_adr,
    AVG(c.occupancy_comp) as market_occupancy,
    AVG(c.revpar_comp) as market_revpar,
    -- Benchmarking Indices
    ROUND((k.adr / NULLIF(AVG(c.adr_comp), 0)) * 100, 2) as ari,
    ROUND((k.occupancy_rate / NULLIF(AVG(c.occupancy_comp), 0)) * 100, 2) as mpi,
    ROUND((k.revpar / NULLIF(AVG(c.revpar_comp), 0)) * 100, 2) as rgi
FROM fact_competitor_rates c
JOIN kpi_daily k ON k.property_id = c.property_id AND k.date = c.date
GROUP BY f.property_id, f.date, k.adr, k.occupancy_rate, k.revpar;

CREATE MATERIALIZED VIEW health_score_daily AS
-- Implementação detalhada do Health Score com ponderação por pilares
-- (Ver secção "Health Score Calculation" abaixo)
```

---

## 🚀 Roadmap de Implementação (6 Fases)

### **Fase 0: Fundações de Dados** 🏗️
**Duração:** 1-3 dias  
**Esforço:** Médio  
**Prioridade:** 🔴 CRÍTICO

#### Objectivos
- Criar schema base (dimensões + fact_daily)
- Implementar ingestão diária via Edge Functions
- Calcular KPIs core (Occupancy, ADR, RevPAR, ALOS, TRevPAR)
- Configurar RLS (Row Level Security) por propriedade

#### Tarefas Técnicas
```typescript
// 1. Migração Supabase
-- migrations/001_create_star_schema.sql

// 2. Edge Function: daily-ingest
export const handler = async (req) => {
  // Fetch data from PMS/Booking systems
  // Transform & validate
  // Insert into fact_daily
  // Refresh materialized views
};

// 3. Cron Job Setup
supabase functions schedule daily-ingest --cron "0 3 * * *"

// 4. React Hook
export const useKPIsDaily = (propertyId: string, dateRange: DateRange) => {
  return useQuery(['kpis-daily', propertyId, dateRange], async () => {
    const { data } = await supabase
      .from('kpi_daily')
      .select('*')
      .eq('property_id', propertyId)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end);
    return data;
  });
};
```

#### Outputs
- ✅ Dashboard básico com KPIs diários e MTD
- ✅ Dados históricos estruturados
- ✅ Base para todas as fases seguintes

#### Métricas de Sucesso
- [ ] 100% de dias com dados completos (últimos 30 dias)
- [ ] Latência de ingestão < 1h após meia-noite
- [ ] 0 erros de validação em dados core

---

### **Fase 1: Benchmarking e Mercado** 📊
**Duração:** 2-4 dias  
**Esforço:** Médio  
**Prioridade:** 🔴 ALTO

#### Objectivos
- Implementar competitor rate shopping
- Calcular ARI, MPI, RGI
- Adicionar eventos locais e sazonalidade
- Substituir mocks do MarketIntelligenceService

#### Tarefas Técnicas
```typescript
// 1. Edge Function: competitor-rates
export const fetchCompetitorRates = async (propertyId: string) => {
  // Scraping or API calls (AirDNA, Booking.com, etc.)
  // Rate limiting & caching
  // Store in fact_competitor_rates
};

// 2. Events Calendar Integration
const loadLocalEvents = async (marketId: string, dateRange: DateRange) => {
  // Public APIs: Eventbrite, local tourism boards
  // Impact scoring algorithm
  // Store in dim_event & fact_events
};

// 3. Seasonal Adjustment
const getSeasonalFactor = (date: Date, marketId: string) => {
  // Historical analysis
  // Returns multiplier 0.7 - 1.3
};
```

#### Outputs
- ✅ Benchmarking dashboard com ARI/MPI/RGI
- ✅ Tags de eventos em timeline
- ✅ Comp set analysis (top 5 competitors)
- ✅ Relatórios premium com posição de mercado

#### Métricas de Sucesso
- [ ] RGI calculado para 90% das propriedades
- [ ] Comp set com min. 3 competidores válidos
- [ ] Eventos identificados para próximos 90 dias

---

### **Fase 2: Canais e Distribuição** 💰
**Duração:** 2-4 dias  
**Esforço:** Médio  
**Prioridade:** 🟡 MÉDIO

#### Objectivos
- Tracking de revenue por canal
- Calcular NRevPAR (net de custos de aquisição)
- Optimizar mix de distribuição
- Recomendações de channel management

#### Tarefas Técnicas
```typescript
// 1. Channel Data Model
interface ChannelPerformance {
  channel_id: string;
  channel_name: string;
  bookings: number;
  revenue: number;
  acquisition_cost: number;
  nrevpar: number;
  cancellation_rate: number;
}

// 2. Distribution Mix Analysis
const analyzeChannelMix = (propertyId: string) => {
  // Calculate DRR
  // Compare NRevPAR across channels
  // Identify underperforming channels
  // Generate recommendations
};

// 3. Recommendations Engine
const generateChannelRecommendations = () => {
  if (drr < 30) return "Increase direct bookings via SEO/ads";
  if (channel_x_nrevpar < market_avg) return "Reduce allocation to Channel X";
  // etc.
};
```

#### Outputs
- ✅ Dashboard de mix de canais
- ✅ NRevPAR por canal
- ✅ DRR tracking
- ✅ Recomendações automatizadas

#### Métricas de Sucesso
- [ ] Tracking de 100% dos canais activos
- [ ] DRR visible para todas as propriedades
- [ ] Min. 3 recomendações accionáveis por propriedade

---

### **Fase 3: Guest Experience e Sentiment** ⭐
**Duração:** 1-2 sprints (1-2 semanas)  
**Esforço:** Grande  
**Prioridade:** 🟡 MÉDIO-ALTO

#### Objectivos
- Ingestão automática de reviews (Airbnb, Booking, etc.)
- NLP para sentiment analysis por tópico
- Calcular NPS, CSAT, CES quando disponível
- Response time & rate tracking

#### Tarefas Técnicas
```typescript
// 1. Reviews Scraper/API Integration
const fetchReviews = async (propertyId: string, platform: string) => {
  // Platform-specific APIs or scraping
  // Rate limiting
  // Store in fact_reviews
};

// 2. NLP Topic-Based Sentiment
import { analyzeSentiment } from '@lib/nlp';

const extractTopics = async (reviewText: string) => {
  const topics = ['cleanliness', 'comfort', 'location', 'communication', 'amenities', 'value'];
  const results = [];
  
  for (const topic of topics) {
    const sentiment = await analyzeSentiment(reviewText, topic);
    results.push({
      topic,
      sentiment_score: sentiment.score, // 0-1
      mentions: sentiment.mentions
    });
  }
  
  return results;
};

// 3. Guest Experience Score
const calculateGuestExperienceScore = (propertyId: string) => {
  // NPS normalized (0-100)
  // CSAT normalized
  // Response metrics
  // Repeat guest rate
  // Weighted average
};
```

#### Outputs
- ✅ Sentiment dashboard por tópico
- ✅ Trending de issues negativas
- ✅ NPS/CSAT/CES quando disponível
- ✅ Guest Experience pillar no Health Score

#### Métricas de Sucesso
- [ ] 95% de reviews com sentiment analysed
- [ ] Topic accuracy > 85% (manual validation)
- [ ] Response time < 2h average
- [ ] Response rate > 95%

---

### **Fase 4: Revenue Management Avançado** 💎
**Duração:** 1-2 sprints (1-2 semanas)  
**Esforço:** Grande  
**Prioridade:** 🟡 MÉDIO

#### Objectivos
- Booking windows & pacing analysis
- Dynamic pricing rule engine
- Previsões de demand (simples)
- Recomendações com ROI estimado

#### Tarefas Técnicas
```typescript
// 1. Booking Window Analysis
interface BookingPacing {
  window: '0-3d' | '4-7d' | '8-14d' | '15-30d' | '31-60d' | '60+d';
  bookings: number;
  revenue: number;
  pace_vs_last_year: number;
}

// 2. Dynamic Pricing Rules
const calculateDynamicPrice = (baseADR: number, context: PricingContext) => {
  let price = baseADR;
  
  // Seasonality
  price *= context.seasonalFactor; // 0.7 - 1.3
  
  // Day of week
  if (context.isWeekend) price *= 1.15;
  
  // Events
  price *= (1 + context.eventImpact); // 0 - 0.5
  
  // Competitive position (RGI)
  if (context.rgi < 80) price *= 1.05; // Under-priced
  if (context.rgi > 120) price *= 0.95; // Over-priced
  
  // Occupancy forecast
  if (context.forecastOccupancy < 40) price *= 0.9; // Discount
  if (context.forecastOccupancy > 85) price *= 1.1; // Premium
  
  // Last-minute
  if (context.daysUntilCheckin <= 3) price *= 0.85;
  
  return Math.round(price);
};

// 3. ROI Estimation
interface Recommendation {
  action: string;
  estimated_cost: number;
  estimated_impact_revpar: number;
  roi_months: number;
  priority: 'high' | 'medium' | 'low';
}

const estimateROI = (action: string, propertyMetrics: PropertyMetrics) => {
  // Rule-based estimation
  // Historical impact from similar properties
  // Confidence interval
};
```

#### Outputs
- ✅ Booking pace dashboard
- ✅ Dynamic price recommendations
- ✅ Recomendações com ROI quantificado
- ✅ Alerts de pacing vs. comp set

#### Métricas de Sucesso
- [ ] Pacing accuracy > 80% (vs. actual)
- [ ] Price recommendations accepted rate > 50%
- [ ] ROI estimates < 20% error margin (validated post-action)

---

### **Fase 5: Health Score e Metas SMART** 🎯
**Duração:** 3-5 dias  
**Esforço:** Médio  
**Prioridade:** 🟡 MÉDIO-ALTO

#### Objectivos
- Implementar Health Score ponderado por pilares
- Sistema de metas SMART por propriedade
- Tracking de OKRs
- Visualização executiva no template premium

#### Tarefas Técnicas
```typescript
// 1. Health Score Calculation
interface HealthScoreBreakdown {
  total: number; // 0-100
  category: 'excellent' | 'good' | 'attention' | 'critical';
  pillars: {
    revenue_performance: { score: number; weight: 30; drivers: string[] };
    market_position: { score: number; weight: 15; drivers: string[] };
    guest_experience: { score: number; weight: 25; drivers: string[] };
    distribution: { score: number; weight: 15; drivers: string[] };
    operational_efficiency: { score: number; weight: 10; drivers: string[] };
    data_quality: { score: number; weight: 5; drivers: string[] };
  };
  top_upsides: string[];
  top_downsides: string[];
}

const calculateHealthScore = (propertyId: string, date: Date): HealthScoreBreakdown => {
  // 1. Normalize each metric to 0-100 scale
  const revenueScore = normalizeToPercentile(kpi.revpar, compSet.revpar_distribution);
  const guestScore = normalizeToPercentile(kpi.nps, compSet.nps_distribution);
  // ... etc for all metrics
  
  // 2. Calculate pillar scores
  const pillars = {
    revenue_performance: {
      score: (revenueScore * 0.5 + adrTrendScore * 0.3 + occTrendScore * 0.2),
      weight: 30,
      drivers: identifyDrivers([revenueScore, adrTrendScore, occTrendScore])
    },
    // ... other pillars
  };
  
  // 3. Weighted total
  const total = Object.values(pillars).reduce((sum, p) => sum + (p.score * p.weight / 100), 0);
  
  // 4. Apply data quality gate
  if (dataQualityScore < 60) total = Math.min(total, 60);
  
  return { total, pillars, ... };
};

// 2. SMART Goals System
interface PropertyGoal {
  metric: string; // 'revpar', 'occupancy', 'nps', etc.
  current: number;
  target: number;
  deadline: Date;
  progress: number; // 0-100%
  status: 'on-track' | 'at-risk' | 'achieved' | 'missed';
}

// 3. Template Premium Integration
const PremiumReportHealthScore = ({ propertyId }) => {
  const { data: healthScore } = useHealthScore(propertyId);
  
  return (
    <HealthScoreCard score={healthScore.total} category={healthScore.category}>
      <PillarBreakdown pillars={healthScore.pillars} />
      <Insights upsides={healthScore.top_upsides} downsides={healthScore.top_downsides} />
      <GoalsTracking goals={propertyGoals} />
    </HealthScoreCard>
  );
};
```

#### Outputs
- ✅ Health Score dashboard com drill-down
- ✅ Sistema de metas SMART
- ✅ Progress tracking visual
- ✅ Template premium com score integrado

#### Métricas de Sucesso
- [ ] Health Score calculado daily para 100% propriedades
- [ ] Correlation > 0.7 entre score e actual revenue performance
- [ ] Min. 3 goals SMART definidos por propriedade
- [ ] 90% de goals "on-track" ou "achieved"

---

### **Fase 6: Hardening e Operação** 🛠️
**Duração:** 3-5 dias  
**Esforço:** Médio  
**Prioridade:** 🟢 NECESSÁRIO

#### Objectivos
- Performance optimization
- Data quality monitoring
- Alertas e observabilidade
- Testes de regressão
- Documentação

#### Tarefas Técnicas
```sql
-- 1. Performance: Indices & Partitioning
CREATE INDEX idx_fact_daily_property_date ON fact_daily(property_id, date DESC);
CREATE INDEX idx_fact_reviews_property ON fact_reviews(property_id, date DESC);

-- Partitioning por mês
CREATE TABLE fact_daily_2025_10 PARTITION OF fact_daily
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- 2. Materialized Views Refresh Strategy
CREATE OR REPLACE FUNCTION refresh_kpis() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_comp_set_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY health_score_daily;
END;
$$ LANGUAGE plpgsql;

-- Scheduled refresh
SELECT cron.schedule('refresh-kpis', '0 4 * * *', 'SELECT refresh_kpis();');
```

```typescript
// 3. Data Quality Monitoring
interface DataQualityReport {
  property_id: string;
  date: Date;
  completeness: number; // % of expected fields filled
  freshness: number; // hours since last update
  consistency: number; // cross-checks pass rate
  issues: string[];
}

const monitorDataQuality = async () => {
  // Check completeness
  const missing_data = await checkMissingFields();
  
  // Check freshness
  const stale_data = await checkStaleness();
  
  // Check consistency
  const inconsistencies = await checkCrossFieldLogic();
  
  // Send alerts if thresholds breached
  if (completeness < 90 || freshness > 24) {
    await sendAlert('data-quality', report);
  }
};

// 4. Observability
import { logger } from '@lib/observability';

logger.info('daily-ingest', {
  properties_processed: count,
  duration_ms: elapsed,
  errors: error_count
});

// 5. Tests
describe('KPI Calculations', () => {
  it('should calculate RevPAR correctly', () => {
    const result = calculateRevPAR({ rooms_sold: 5, rooms_available: 10, revenue: 1000 });
    expect(result).toBe(100);
  });
  
  it('should handle edge cases', () => {
    expect(calculateRevPAR({ rooms_available: 0 })).toBe(0);
  });
});
```

#### Outputs
- ✅ Sistema estável e performante
- ✅ Monitoring dashboard (latency, errors, data quality)
- ✅ Automated alerts
- ✅ Comprehensive tests (80%+ coverage)
- ✅ Documentation (setup, APIs, troubleshooting)

#### Métricas de Sucesso
- [ ] P95 query latency < 500ms
- [ ] 99.5% uptime (excl. planned maintenance)
- [ ] Data quality score > 95%
- [ ] 0 critical bugs in production

---

## 📋 Template Premium: Integração Completa

### Estrutura do Relatório Premium (Data-Driven)

```typescript
interface PremiumReportData {
  // 1. Executive Summary
  executive_summary: {
    property_name: string;
    report_date: Date;
    health_score: HealthScoreBreakdown;
    key_highlights: string[];
    critical_issues: string[];
  };
  
  // 2. Performance Metrics
  performance: {
    current_period: KPISnapshot;
    previous_period: KPISnapshot;
    yoy_comparison: KPISnapshot;
    market_comparison: {
      ari: number;
      mpi: number;
      rgi: number;
    };
  };
  
  // 3. Revenue Analysis
  revenue: {
    adr_trend: TimeSeries;
    revpar_trend: TimeSeries;
    occupancy_trend: TimeSeries;
    seasonal_analysis: SeasonalBreakdown;
    channel_mix: ChannelPerformance[];
    pricing_recommendations: PricingStrategy;
  };
  
  // 4. Guest Experience
  guest_experience: {
    overall_rating: number;
    rating_trend: TimeSeries;
    nps: number;
    sentiment_by_topic: TopicSentiment[];
    top_positives: string[];
    top_negatives: string[];
    response_metrics: {
      avg_response_time: number;
      response_rate: number;
    };
  };
  
  // 5. Market Position
  market: {
    comp_set: Competitor[];
    market_share: number;
    competitive_advantages: string[];
    competitive_weaknesses: string[];
    events_calendar: LocalEvent[];
  };
  
  // 6. Recommendations (Action Plan)
  recommendations: {
    priority_interventions: Recommendation[];
    quick_wins: Recommendation[];
    strategic_initiatives: Recommendation[];
    investment_roadmap: Timeline;
  };
  
  // 7. Goals & Tracking
  goals: {
    current_goals: PropertyGoal[];
    progress_summary: GoalProgress;
    milestones: Milestone[];
    forecasts: {
      revenue_12m: number;
      occupancy_12m: number;
      health_score_6m: number;
    };
  };
}
```

### Template Handlebars Integration

```typescript
// Edge Function: generate-premium-pdf
import Handlebars from 'handlebars';
import { readFile } from 'fs/promises';

export const handler = async (req: Request) => {
  const { property_id, date_range } = await req.json();
  
  // 1. Fetch all data
  const reportData = await fetchPremiumReportData(property_id, date_range);
  
  // 2. Load template
  const templateHTML = await readFile('./premium-report-template.html', 'utf-8');
  const template = Handlebars.compile(templateHTML);
  
  // 3. Register helpers
  Handlebars.registerHelper('formatCurrency', (value) => `€${value.toFixed(2)}`);
  Handlebars.registerHelper('formatPercent', (value) => `${value.toFixed(1)}%`);
  
  // 4. Render
  const html = template(reportData);
  
  // 5. Generate PDF (puppeteer ou similar)
  const pdf = await generatePDF(html);
  
  return new Response(pdf, {
    headers: { 'Content-Type': 'application/pdf' }
  });
};
```

---

## 🎯 Métricas de Sucesso do Projecto

### KPIs de Qualidade do Output

| Métrica | Target | Actual | Status |
|---------|--------|--------|--------|
| Data Completeness | > 95% | TBD | ⏳ |
| Data Freshness (hours) | < 2h | TBD | ⏳ |
| Health Score Accuracy (vs. manual) | > 90% | TBD | ⏳ |
| Recommendation Acceptance Rate | > 60% | TBD | ⏳ |
| Template Sections Data-Driven | 100% | 30% | 🔴 |
| User Satisfaction (CSAT) | > 8.5/10 | TBD | ⏳ |

### ROI Esperado

- **Tempo de análise:** 4h manual → 5min automatizado (98% redução)
- **Insights accionáveis:** 3-5 genéricos → 15-20 data-driven
- **Revenue uplift:** +8-12% (benchmark indústria para dynamic pricing + optimization)
- **Guest satisfaction:** +0.3-0.5 stars (através de issue resolution proactivo)

---

## 🚨 Riscos e Mitigações

### Risco 1: Dados Incompletos de Competidores
**Mitigação:**
- Fallback para dados estimados com disclaimer "Estimado"
- Cache de "last good value" (7-30 dias)
- Manual override option

### Risco 2: Custos de API de Rate Shopping
**Mitigação:**
- Caching agressivo (refresh 24h)
- Rate limiting
- Selective scraping (top 5 comp set)
- Considerar partnership com AirDNA/KeyData (data feed)

### Risco 3: NLP Accuracy para Reviews PT
**Mitigação:**
- Use multilingual models (mBERT, XLM-R)
- Manual validation set (100 reviews)
- Confidence threshold (only show > 75% confidence)
- Human-in-the-loop para casos edge

### Risco 4: Performance com Grande Volume
**Mitigação:**
- Materialized views com refresh incremental
- Partitioning por data
- CDN para assets estáticos
- Query optimization (indices, explain analyze)

### Risco 5: Mudanças em Plataformas (Airbnb, Booking API)
**Mitigação:**
- Abstraction layer (DataProcessor já existe)
- Version detection
- Monitoring de success rate
- Fallback pipelines

---

## 📚 Referências e Best Practices

### Fontes de Pesquisa
1. **STR (Smith Travel Research)** - Global hotel benchmarking standards
2. **AltExsoft** - RevPAR, ADR, GOPPAR methodology
3. **AirDNA** - Vacation rental analytics leader
4. **PriceLabs, Beyond Pricing, Wheelhouse** - Dynamic pricing methodologies
5. **SummerOS** - 27 Airbnb metrics framework
6. **Rental Scale-Up** - Industry best practices blog

### Tools e Integrações Recomendadas
- **Rate Shopping:** AirDNA API, ScrapeHero Cloud, Bright Data
- **NLP:** Hugging Face (multilingual sentiment), Compromise.js
- **PDF Generation:** Puppeteer, PDFKit
- **Observability:** Sentry, Datadog, Supabase Logs
- **Cron/Scheduling:** Supabase Cron, Inngest

---

## 🎓 Conclusão e Próximos Passos

### Estado Final (Após Fase 6)

O sistema terá:
- ✅ **27+ KPIs** alinhados com standards STR/AirDNA
- ✅ **Health Score robusto** com 6 pilares ponderados
- ✅ **Benchmarking competitivo** (ARI/MPI/RGI) em tempo real
- ✅ **Sentiment analysis** topic-based para reviews
- ✅ **Dynamic pricing** recommendations data-driven
- ✅ **Channel optimization** com NRevPAR tracking
- ✅ **Template premium 100% integrado** com dados reais
- ✅ **Metas SMART** e tracking de OKRs
- ✅ **Data quality monitoring** e alertas
- ✅ **Sistema escalável** e performante

### Output Premium Diferenciado

O que torna este relatório "premium" vs. concorrência:
1. **Data-driven completo** (0% estimativas não marcadas)
2. **Benchmarking real-time** (vs. comp set local)
3. **Recomendações quantificadas** (ROI, custo, impacto)
4. **Sentiment analysis granular** (por tópico)
5. **Previsões accionáveis** (não apenas histórico)
6. **Design profissional** (template A Maria Faz)
7. **Tracking de progresso** (goals vs. actual)

### Prioridade de Execução Recomendada

```
Fase 0 (CRITICAL) → Fase 1 (HIGH) → Fase 5 (HIGH) → Fase 2 (MEDIUM) → Fase 3 (MEDIUM) → Fase 4 (MEDIUM) → Fase 6 (REQUIRED)
```

**Justificação:** Dados core + benchmarking + Health Score são foundation value. Canais e sentiment adicionam depth. Revenue management avançado é optimization layer.

---

**Documento criado:** 16 Outubro 2025  
**Versão:** 1.0  
**Autor:** Amp AI + Investigação Indústria  
**Próxima Revisão:** Após Fase 0 completion

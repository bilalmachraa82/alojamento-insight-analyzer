import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSeasonalityData, useEventsData } from "@/hooks/admin/useAllPropertiesKPIs";
import { Calendar, TrendingUp, Sun, Cloud, Snowflake, CalendarDays, DollarSign } from "lucide-react";

interface PricingResult {
  base_price: number;
  suggested_price: number;
  price_change_percent: string;
  factors: {
    day_of_week_factor: number;
    seasonality_factor: number;
    event_factor: number;
    competitor_factor: number;
    occupancy_factor: number;
    lead_time_factor: number;
  };
  relevant_events: Array<{
    name: string;
    event_type: string;
    impact_score: number;
  }>;
  market_id: string;
  target_date: string;
}

const MARKETS = [
  { id: "sintra", name: "Sintra" },
  { id: "lisboa", name: "Lisboa" },
  { id: "porto", name: "Porto" },
  { id: "algarve", name: "Algarve" },
];

const getSeasonIcon = (seasonType: string) => {
  switch (seasonType) {
    case "high": return <Sun className="h-4 w-4 text-yellow-500" />;
    case "mid": return <Cloud className="h-4 w-4 text-blue-400" />;
    case "low": return <Snowflake className="h-4 w-4 text-cyan-500" />;
    default: return null;
  }
};

export function DynamicPricingSimulator() {
  const [basePrice, setBasePrice] = useState("100");
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split("T")[0]);
  const [marketId, setMarketId] = useState("sintra");
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<PricingResult | null>(null);
  const { toast } = useToast();

  const { data: seasonalityData, isLoading: loadingSeasonality } = useSeasonalityData();
  const { data: eventsData, isLoading: loadingEvents } = useEventsData();

  // Filter seasonality for selected market
  const marketSeasonality = seasonalityData?.filter(s => s.market_id === marketId) || [];

  // Filter upcoming events for selected market
  const today = new Date().toISOString().split("T")[0];
  const upcomingEvents = eventsData?.filter(e => 
    e.end_date >= today && 
    (e.market_id === marketId || e.market_id === "all")
  ).slice(0, 5) || [];

  const handleCalculate = async () => {
    if (!basePrice || parseFloat(basePrice) <= 0) {
      toast({
        title: "Preço inválido",
        description: "Por favor insira um preço base válido.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    try {
      // Note: In production, you'd use a real property_id
      // For simulation, we use a placeholder
      const { data, error } = await supabase.functions.invoke("calculate-dynamic-price", {
        body: {
          property_id: "00000000-0000-0000-0000-000000000001", // Placeholder for simulation
          base_price: parseFloat(basePrice),
          target_date: targetDate,
          market_id: marketId,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data);
      toast({
        title: "Preço calculado",
        description: `Preço sugerido: €${data.suggested_price}`,
      });
    } catch (err: any) {
      toast({
        title: "Erro ao calcular",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const formatFactor = (factor: number) => {
    const percent = ((factor - 1) * 100).toFixed(0);
    const sign = factor >= 1 ? "+" : "";
    return `${sign}${percent}%`;
  };

  return (
    <div className="space-y-6">
      {/* Simulator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Simulador de Preço Dinâmico
          </CardTitle>
          <CardDescription>
            Calcule o preço sugerido baseado em sazonalidade, eventos e concorrência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="base-price">Preço Base (€)</Label>
              <Input
                id="base-price"
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-date">Data Alvo</Label>
              <Input
                id="target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="market">Mercado</Label>
              <Select value={marketId} onValueChange={setMarketId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mercado" />
                </SelectTrigger>
                <SelectContent>
                  {MARKETS.map((market) => (
                    <SelectItem key={market.id} value={market.id}>
                      {market.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                className="w-full" 
                onClick={handleCalculate}
                disabled={isCalculating}
              >
                {isCalculating ? "A calcular..." : "Calcular Preço"}
              </Button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Preço Base</p>
                  <p className="text-2xl font-bold">€{result.base_price}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Preço Sugerido</p>
                  <p className="text-3xl font-bold text-primary">€{result.suggested_price}</p>
                  <Badge variant={parseFloat(result.price_change_percent) >= 0 ? "default" : "secondary"}>
                    {parseFloat(result.price_change_percent) >= 0 ? "+" : ""}{result.price_change_percent}%
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-4">
                <div className="bg-background rounded p-3 text-center">
                  <p className="text-xs text-muted-foreground">Dia da Semana</p>
                  <p className="font-semibold">{formatFactor(result.factors.day_of_week_factor)}</p>
                </div>
                <div className="bg-background rounded p-3 text-center">
                  <p className="text-xs text-muted-foreground">Sazonalidade</p>
                  <p className="font-semibold">{formatFactor(result.factors.seasonality_factor)}</p>
                </div>
                <div className="bg-background rounded p-3 text-center">
                  <p className="text-xs text-muted-foreground">Eventos</p>
                  <p className="font-semibold">{formatFactor(result.factors.event_factor)}</p>
                </div>
                <div className="bg-background rounded p-3 text-center">
                  <p className="text-xs text-muted-foreground">Concorrência</p>
                  <p className="font-semibold">{formatFactor(result.factors.competitor_factor)}</p>
                </div>
                <div className="bg-background rounded p-3 text-center">
                  <p className="text-xs text-muted-foreground">Ocupação</p>
                  <p className="font-semibold">{formatFactor(result.factors.occupancy_factor)}</p>
                </div>
                <div className="bg-background rounded p-3 text-center">
                  <p className="text-xs text-muted-foreground">Lead Time</p>
                  <p className="font-semibold">{formatFactor(result.factors.lead_time_factor)}</p>
                </div>
              </div>

              {result.relevant_events.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Eventos Relevantes:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.relevant_events.map((event, i) => (
                      <Badge key={i} variant="outline">
                        {event.name} (Impact: {event.impact_score})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seasonality Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Fatores de Sazonalidade - {MARKETS.find(m => m.id === marketId)?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSeasonality ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {marketSeasonality.map((s) => (
                <div 
                  key={s.month} 
                  className={`rounded-lg p-3 text-center ${
                    s.season_type === 'high' ? 'bg-yellow-500/10' :
                    s.season_type === 'mid' ? 'bg-blue-500/10' : 'bg-cyan-500/10'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    {getSeasonIcon(s.season_type)}
                  </div>
                  <p className="text-xs font-medium">
                    {new Date(2025, s.month - 1).toLocaleDateString('pt', { month: 'short' })}
                  </p>
                  <p className="text-lg font-bold">{(Number(s.factor) * 100 - 100).toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">
                    FDS: +{(Number(s.weekend_premium) * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Próximos Eventos - {MARKETS.find(m => m.id === marketId)?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEvents ? (
            <Skeleton className="h-32 w-full" />
          ) : upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum evento próximo</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.start_date).toLocaleDateString('pt')} 
                      {event.start_date !== event.end_date && 
                        ` - ${new Date(event.end_date).toLocaleDateString('pt')}`
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={Number(event.impact_score) >= 8 ? "default" : "secondary"}>
                      Impact: {event.impact_score}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{event.event_type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
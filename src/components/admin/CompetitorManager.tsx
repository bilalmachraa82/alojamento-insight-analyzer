import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompetitorManagement } from "@/hooks/admin/useAllPropertiesKPIs";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, ExternalLink, Check, X, Globe, RefreshCw } from "lucide-react";

interface Competitor {
  id: string;
  name: string;
  location: string | null;
  market_id: string | null;
  property_url: string | null;
  booking_url: string | null;
  airbnb_url: string | null;
  distance_km: number | null;
  scrape_errors: number;
  scrape_success_count: number;
  last_scraped_at: string | null;
  is_active: boolean;
}

export function CompetitorManager() {
  const { data: competitors, isLoading, error } = useCompetitorManagement();
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);
  const [bookingUrl, setBookingUrl] = useState("");
  const [airbnbUrl, setAirbnbUrl] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleEditCompetitor = (competitor: Competitor) => {
    setEditingCompetitor(competitor);
    setBookingUrl(competitor.booking_url || "");
    setAirbnbUrl(competitor.airbnb_url || "");
    setIsDialogOpen(true);
  };

  const handleSaveUrls = async () => {
    if (!editingCompetitor) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("dim_competitor")
        .update({
          booking_url: bookingUrl || null,
          airbnb_url: airbnbUrl || null,
        })
        .eq("id", editingCompetitor.id);

      if (error) throw error;

      toast({
        title: "URLs atualizadas",
        description: `URLs do competidor ${editingCompetitor.name} foram atualizadas com sucesso.`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-competitors"] });
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({
        title: "Erro ao atualizar",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestScrape = async (competitorId: string) => {
    toast({
      title: "Scraping iniciado",
      description: "O scraping será executado em background. Verifique os logs para mais detalhes.",
    });

    try {
      await supabase.functions.invoke("competitor-rate-shopping", {
        body: { competitor_ids: [competitorId] },
      });
    } catch (err) {
      console.error("Scrape error:", err);
    }
  };

  const groupedCompetitors = competitors?.reduce((acc, comp) => {
    const market = comp.market_id || "sem_mercado";
    if (!acc[market]) acc[market] = [];
    acc[market].push(comp);
    return acc;
  }, {} as Record<string, Competitor[]>) || {};

  const hasUrl = (comp: Competitor) => comp.booking_url || comp.airbnb_url;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar competidores: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const totalCompetitors = competitors?.length || 0;
  const withUrls = competitors?.filter(hasUrl).length || 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Competidores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompetitors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Com URLs Configuradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{withUrls}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sem URLs (Dados Sintéticos)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalCompetitors - withUrls}</div>
          </CardContent>
        </Card>
      </div>

      {/* Competitors by Market */}
      {Object.entries(groupedCompetitors).map(([market, marketCompetitors]) => (
        <Card key={market}>
          <CardHeader>
            <CardTitle className="capitalize">{market.replace("_", " ")}</CardTitle>
            <CardDescription>
              {marketCompetitors.length} competidores • {marketCompetitors.filter(hasUrl).length} com URLs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>URLs</TableHead>
                  <TableHead>Status Scraping</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketCompetitors.slice(0, 10).map((competitor) => (
                  <TableRow key={competitor.id}>
                    <TableCell className="font-medium">{competitor.name}</TableCell>
                    <TableCell>{competitor.location || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {competitor.booking_url ? (
                          <Badge variant="default" className="gap-1">
                            <Check className="h-3 w-3" /> Booking
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-muted-foreground">
                            <X className="h-3 w-3" /> Booking
                          </Badge>
                        )}
                        {competitor.airbnb_url ? (
                          <Badge variant="default" className="gap-1">
                            <Check className="h-3 w-3" /> Airbnb
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-muted-foreground">
                            <X className="h-3 w-3" /> Airbnb
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {hasUrl(competitor) ? (
                        <div className="text-sm">
                          <span className="text-green-600">{competitor.scrape_success_count || 0} ✓</span>
                          {" / "}
                          <span className="text-red-600">{competitor.scrape_errors || 0} ✗</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Dados sintéticos</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCompetitor(competitor)}
                        >
                          <Globe className="h-4 w-4 mr-1" />
                          URLs
                        </Button>
                        {hasUrl(competitor) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestScrape(competitor.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {marketCompetitors.length > 10 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      ... e mais {marketCompetitors.length - 10} competidores
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar URLs do Competidor</DialogTitle>
            <DialogDescription>
              Adicione URLs do Booking.com e/ou Airbnb para {editingCompetitor?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="booking-url">URL do Booking.com</Label>
              <Input
                id="booking-url"
                placeholder="https://www.booking.com/hotel/..."
                value={bookingUrl}
                onChange={(e) => setBookingUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="airbnb-url">URL do Airbnb</Label>
              <Input
                id="airbnb-url"
                placeholder="https://www.airbnb.com/rooms/..."
                value={airbnbUrl}
                onChange={(e) => setAirbnbUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUrls} disabled={isSaving}>
              {isSaving ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
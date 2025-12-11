import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAllReviews, useCreateReview, useUpdateReview, useDeleteReview, useReviewsSummary } from '@/hooks/analytics';
import { useProperties } from '@/hooks/useProperties';
import { MessageSquare, Plus, Trash2, Star, CheckCircle, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const PLATFORM_OPTIONS = [
  { value: 'booking', label: 'Booking.com' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'tripadvisor', label: 'TripAdvisor' },
  { value: 'google', label: 'Google' },
  { value: 'other', label: 'Outro' },
];

export function ReviewsManager() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    property_id: '',
    date: new Date().toISOString().split('T')[0],
    platform: 'booking',
    rating: '5',
    review_text: '',
    responded: false,
    response_time_hours: '',
  });

  const { data: reviews, isLoading } = useAllReviews(100);
  const { data: summary } = useReviewsSummary();
  const { properties } = useProperties();
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();

  const handleCreateReview = async () => {
    if (!newReview.property_id || !newReview.platform || !newReview.rating) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha propriedade, plataforma e classificação.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createReview.mutateAsync({
        property_id: newReview.property_id,
        date: newReview.date,
        platform: newReview.platform,
        rating: parseFloat(newReview.rating),
        review_text: newReview.review_text || undefined,
        responded: newReview.responded,
        response_time_hours: newReview.response_time_hours ? parseInt(newReview.response_time_hours) : undefined,
      });

      toast({ title: 'Avaliação adicionada', description: 'A avaliação foi registada com sucesso.' });
      setIsDialogOpen(false);
      setNewReview({
        property_id: '',
        date: new Date().toISOString().split('T')[0],
        platform: 'booking',
        rating: '5',
        review_text: '',
        responded: false,
        response_time_hours: '',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar avaliação.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkResponded = async (reviewId: string) => {
    try {
      await updateReview.mutateAsync({ id: reviewId, responded: true });
      toast({ title: 'Marcado como respondido' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;

    try {
      await deleteReview.mutateAsync(reviewId);
      toast({ title: 'Avaliação excluída' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const renderStars = (rating: number | null) => {
    if (rating === null) return '-';
    const fullStars = Math.floor(rating);
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < fullStars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-sm ml-1">({rating})</span>
      </div>
    );
  };

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      booking: 'bg-blue-100 text-blue-800',
      airbnb: 'bg-pink-100 text-pink-800',
      tripadvisor: 'bg-green-100 text-green-800',
      google: 'bg-yellow-100 text-yellow-800',
    };
    return <Badge className={colors[platform] || 'bg-gray-100 text-gray-800'}>{platform}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalReviews || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Classificação Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-yellow-600">{summary?.averageRating || '-'}</div>
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary?.responseRate || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.avgResponseTimeHours || 0}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hóspedes Repetidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-purple-600">{summary?.repeatGuestCount || 0}</div>
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Gestão de Avaliações
            </CardTitle>
            <CardDescription>Registe e acompanhe avaliações de hóspedes</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Avaliação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Adicionar Avaliação</DialogTitle>
                <DialogDescription>Registe uma nova avaliação de hóspede</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Propriedade</Label>
                    <Select value={newReview.property_id} onValueChange={v => setNewReview({ ...newReview, property_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties?.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Plataforma</Label>
                    <Select value={newReview.platform} onValueChange={v => setNewReview({ ...newReview, platform: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORM_OPTIONS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={newReview.date}
                      onChange={e => setNewReview({ ...newReview, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Classificação (1-5)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={newReview.rating}
                      onChange={e => setNewReview({ ...newReview, rating: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Texto da Avaliação (opcional)</Label>
                  <Textarea
                    value={newReview.review_text}
                    onChange={e => setNewReview({ ...newReview, review_text: e.target.value })}
                    placeholder="Texto da avaliação do hóspede..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newReview.responded}
                      onChange={e => setNewReview({ ...newReview, responded: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Já respondido</span>
                  </label>
                  {newReview.responded && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Tempo (horas):</Label>
                      <Input
                        type="number"
                        className="w-20"
                        value={newReview.response_time_hours}
                        onChange={e => setNewReview({ ...newReview, response_time_hours: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateReview} disabled={createReview.isPending}>
                  {createReview.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando avaliações...</div>
          ) : !reviews?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma avaliação registada</p>
              <p className="text-sm">Adicione avaliações para acompanhar a reputação das suas propriedades</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Propriedade</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead>Respondido</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review: any) => (
                    <TableRow key={review.id}>
                      <TableCell>{format(new Date(review.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-medium">{review.property_name}</TableCell>
                      <TableCell>{getPlatformBadge(review.platform)}</TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {review.review_text || '-'}
                      </TableCell>
                      <TableCell>
                        {review.responded ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sim
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!review.responded && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkResponded(review.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(review.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ReviewsManager;

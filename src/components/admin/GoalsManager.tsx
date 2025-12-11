import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAllGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useGoalsSummary } from '@/hooks/analytics';
import { useProperties } from '@/hooks/useProperties';
import { Target, Plus, Trash2, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const METRIC_OPTIONS = [
  { value: 'occupancy_rate', label: 'Taxa de Ocupação (%)', unit: '%' },
  { value: 'adr', label: 'ADR (€)', unit: '€' },
  { value: 'revpar', label: 'RevPAR (€)', unit: '€' },
  { value: 'average_rating', label: 'Classificação Média', unit: '' },
  { value: 'response_rate', label: 'Taxa de Resposta (%)', unit: '%' },
  { value: 'bookings', label: 'Total Reservas', unit: '' },
  { value: 'revenue', label: 'Receita Total (€)', unit: '€' },
];

export function GoalsManager() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    property_id: '',
    metric_name: '',
    target_value: '',
    start_date: new Date().toISOString().split('T')[0],
    deadline: '',
  });

  const { data: goals, isLoading } = useAllGoals();
  const { data: summary } = useGoalsSummary();
  const { properties } = useProperties();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const handleCreateGoal = async () => {
    if (!newGoal.property_id || !newGoal.metric_name || !newGoal.target_value || !newGoal.deadline) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createGoal.mutateAsync({
        property_id: newGoal.property_id,
        metric_name: newGoal.metric_name,
        target_value: parseFloat(newGoal.target_value),
        start_date: newGoal.start_date,
        deadline: newGoal.deadline,
      });

      toast({ title: 'Objetivo criado', description: 'O objetivo foi criado com sucesso.' });
      setIsDialogOpen(false);
      setNewGoal({
        property_id: '',
        metric_name: '',
        target_value: '',
        start_date: new Date().toISOString().split('T')[0],
        deadline: '',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar objetivo.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (goalId: string, status: string, currentValue?: number) => {
    try {
      await updateGoal.mutateAsync({ id: goalId, status, current_value: currentValue });
      toast({ title: 'Objetivo atualizado' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('Tem certeza que deseja excluir este objetivo?')) return;

    try {
      await deleteGoal.mutateAsync(goalId);
      toast({ title: 'Objetivo excluído' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusBadge = (goal: any) => {
    const isOverdue = new Date(goal.deadline) < new Date() && goal.status !== 'completed';
    
    if (goal.status === 'completed') {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Concluído</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Atrasado</Badge>;
    }
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Em Progresso</Badge>;
  };

  const getProgress = (goal: any) => {
    if (!goal.current_value || !goal.target_value) return 0;
    return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  };

  const getMetricLabel = (metricName: string) => {
    return METRIC_OPTIONS.find(m => m.value === metricName)?.label || metricName;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Objetivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary?.active || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary?.completed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary?.overdue || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Gestão de Objetivos
            </CardTitle>
            <CardDescription>Defina e acompanhe objetivos para as suas propriedades</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Objetivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Objetivo</DialogTitle>
                <DialogDescription>Defina um objetivo de desempenho para uma propriedade</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Propriedade</Label>
                  <Select value={newGoal.property_id} onValueChange={v => setNewGoal({ ...newGoal, property_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma propriedade" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Métrica</Label>
                  <Select value={newGoal.metric_name} onValueChange={v => setNewGoal({ ...newGoal, metric_name: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a métrica" />
                    </SelectTrigger>
                    <SelectContent>
                      {METRIC_OPTIONS.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor Alvo</Label>
                  <Input
                    type="number"
                    value={newGoal.target_value}
                    onChange={e => setNewGoal({ ...newGoal, target_value: e.target.value })}
                    placeholder="Ex: 85"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={newGoal.start_date}
                      onChange={e => setNewGoal({ ...newGoal, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo</Label>
                    <Input
                      type="date"
                      value={newGoal.deadline}
                      onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateGoal} disabled={createGoal.isPending}>
                  {createGoal.isPending ? 'Criando...' : 'Criar Objetivo'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando objetivos...</div>
          ) : !goals?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum objetivo definido</p>
              <p className="text-sm">Crie objetivos para acompanhar o desempenho das suas propriedades</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propriedade</TableHead>
                  <TableHead>Métrica</TableHead>
                  <TableHead>Alvo</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((goal: any) => (
                  <TableRow key={goal.id}>
                    <TableCell className="font-medium">{goal.property_name}</TableCell>
                    <TableCell>{getMetricLabel(goal.metric_name)}</TableCell>
                    <TableCell>{goal.target_value}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={getProgress(goal)} className="h-2" />
                        <span className="text-sm text-muted-foreground">{getProgress(goal)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(goal.deadline), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{getStatusBadge(goal)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {goal.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(goal.id, 'completed', goal.target_value)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GoalsManager;

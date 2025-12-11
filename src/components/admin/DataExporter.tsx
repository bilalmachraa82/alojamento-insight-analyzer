import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileJson, FileSpreadsheet, Loader2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProperties } from '@/hooks/useProperties';

type ExportType = 'submissions' | 'reviews' | 'kpis' | 'pricing' | 'goals' | 'all';
type ExportFormat = 'json' | 'csv';

export function DataExporter() {
  const { toast } = useToast();
  const [exportType, setExportType] = useState<ExportType>('all');
  const [format, setFormat] = useState<ExportFormat>('json');
  const [propertyId, setPropertyId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const { properties } = useProperties();

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão não encontrada. Por favor, faça login novamente.');
      }

      const body: any = {
        export_type: exportType,
        format,
      };

      if (propertyId !== 'all') {
        body.property_id = propertyId;
      }

      if (startDate && endDate) {
        body.date_range = {
          start: startDate,
          end: endDate,
        };
      }

      const { data, error } = await supabase.functions.invoke('export-data', {
        body,
      });

      if (error) throw error;

      // Create a blob and download
      let blob: Blob;
      let filename: string;

      if (format === 'csv') {
        blob = new Blob([data], { type: 'text/csv' });
        filename = `maria-faz-export-${exportType}-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        filename = `maria-faz-export-${exportType}-${new Date().toISOString().split('T')[0]}.json`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportação concluída',
        description: `Ficheiro ${filename} transferido com sucesso.`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Erro na exportação',
        description: error.message || 'Não foi possível exportar os dados.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    { value: 'all', label: 'Tudo (Completo)', description: 'Exportar todos os dados disponíveis' },
    { value: 'submissions', label: 'Submissões', description: 'Diagnósticos submetidos (Admin)' },
    { value: 'reviews', label: 'Avaliações', description: 'Avaliações de hóspedes' },
    { value: 'kpis', label: 'KPIs', description: 'Indicadores de desempenho diários' },
    { value: 'pricing', label: 'Preços', description: 'Recomendações de preços' },
    { value: 'goals', label: 'Objetivos', description: 'Objetivos definidos' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Dados
        </CardTitle>
        <CardDescription>
          Exporte dados para análise externa ou backup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Dados</Label>
            <Select value={exportType} onValueChange={(v: ExportType) => setExportType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exportOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Formato</Label>
            <Select value={format} onValueChange={(v: ExportFormat) => setFormat(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Propriedade</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as propriedades</SelectItem>
                {properties?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Período (opcional)
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Quick Date Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              const last30 = new Date(today);
              last30.setDate(last30.getDate() - 30);
              setStartDate(last30.toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
          >
            Últimos 30 dias
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              const last90 = new Date(today);
              last90.setDate(last90.getDate() - 90);
              setStartDate(last90.toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
          >
            Últimos 90 dias
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              const yearStart = new Date(today.getFullYear(), 0, 1);
              setStartDate(yearStart.toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
          >
            Este ano
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
          >
            Limpar datas
          </Button>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportar {format.toUpperCase()}
            </>
          )}
        </Button>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• <strong>JSON:</strong> Melhor para importação em outras ferramentas ou processamento programático</p>
          <p>• <strong>CSV:</strong> Melhor para Excel, Google Sheets ou análise manual</p>
          <p>• Submissões só estão disponíveis para administradores</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default DataExporter;

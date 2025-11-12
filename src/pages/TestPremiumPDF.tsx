import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import MetaTags from '@/components/SEO/MetaTags';

const TestPremiumPDF: React.FC = () => {
  const [submissionId, setSubmissionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGeneratePDF = async () => {
    if (!submissionId.trim()) {
      toast({
        variant: "destructive",
        title: "ID Obrigatório",
        description: "Por favor, insira um ID de submissão válido.",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setPdfUrl(null);

    try {
      // First, fetch the submission to get analysis data
      const { data: submission, error: fetchError } = await supabase
        .from('diagnostic_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (fetchError || !submission) {
        throw new Error('Submissão não encontrada ou erro ao buscar dados');
      }

      if (!submission.analysis_result) {
        throw new Error('Esta submissão ainda não tem análise completa');
      }

      console.log('Generating PDF for submission:', submissionId);

      // Call the PDF generation function
      const { data, error: pdfError } = await supabase.functions.invoke('generate-premium-pdf', {
        body: {
          submissionId: submissionId,
          analysisData: submission.analysis_result
        }
      });

      if (pdfError) {
        throw pdfError;
      }

      if (data?.reportUrl) {
        setPdfUrl(data.reportUrl);
        toast({
          title: "PDF Gerado com Sucesso!",
          description: "O relatório premium foi gerado. Clique no link abaixo para visualizar.",
        });
      } else {
        throw new Error('URL do PDF não foi retornada');
      }
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError(err.message || 'Erro desconhecido ao gerar PDF');
      toast({
        variant: "destructive",
        title: "Erro ao Gerar PDF",
        description: err.message || 'Ocorreu um erro ao gerar o relatório premium.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWithSampleData = async () => {
    setIsLoading(true);
    setError(null);
    setPdfUrl(null);

    try {
      // Fetch the most recent completed submission
      const { data: submissions, error: fetchError } = await supabase
        .from('diagnostic_submissions')
        .select('*')
        .eq('status', 'completed')
        .not('analysis_result', 'is', null)
        .order('data_submissao', { ascending: false })
        .limit(1);

      if (fetchError || !submissions || submissions.length === 0) {
        throw new Error('Nenhuma submissão completa encontrada para testar');
      }

      const testSubmission = submissions[0];
      setSubmissionId(testSubmission.id);

      console.log('Testing with submission:', testSubmission.id);

      const { data, error: pdfError } = await supabase.functions.invoke('generate-premium-pdf', {
        body: {
          submissionId: testSubmission.id,
          analysisData: testSubmission.analysis_result
        }
      });

      if (pdfError) {
        throw pdfError;
      }

      if (data?.reportUrl) {
        setPdfUrl(data.reportUrl);
        toast({
          title: "PDF de Teste Gerado!",
          description: `Usando submissão: ${testSubmission.id}`,
        });
      }
    } catch (err: any) {
      console.error('Error in test:', err);
      setError(err.message || 'Erro ao testar com dados de exemplo');
      toast({
        variant: "destructive",
        title: "Erro no Teste",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <MetaTags
        title="Test PDF Generation | Maria Faz"
        description="Internal testing page for PDF generation."
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Teste de Geração de PDF Premium
            </CardTitle>
            <CardDescription>
              Gere um relatório premium em PDF a partir de uma submissão analisada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">ID da Submissão</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Ex: 123e4567-e89b-12d3-a456-426614174000"
                    value={submissionId}
                    onChange={(e) => setSubmissionId(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleGeneratePDF}
                    disabled={isLoading || !submissionId.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      'Gerar PDF'
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 border-t" />
                <span className="text-sm text-gray-500">ou</span>
                <div className="flex-1 border-t" />
              </div>

              <Button
                onClick={handleTestWithSampleData}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando dados de teste...
                  </>
                ) : (
                  'Testar com Última Submissão Completa'
                )}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {pdfUrl && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p className="font-medium">PDF gerado com sucesso!</p>
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      <FileText className="w-4 h-4" />
                      Abrir Relatório Premium
                    </a>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h3 className="font-medium text-sm">Como usar:</h3>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Insira o ID de uma submissão que já tenha análise completa</li>
                <li>Ou use o botão de teste para usar a última submissão disponível</li>
                <li>Aguarde a geração do PDF (pode levar alguns segundos)</li>
                <li>Clique no link para visualizar o relatório premium</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default TestPremiumPDF;


import { readFile } from 'fs/promises'
import { join } from 'path'

export default async function RelatorioDemo() {
  try {
    const filePath = join(process.cwd(), 'public', 'templates', 'relatorio-template.html')
    const htmlContent = await readFile(filePath, 'utf-8')
    
    return (
      <div 
        className="w-full min-h-screen"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    )
  } catch (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Erro ao carregar o relatório de demonstração
          </h1>
          <p className="text-muted-foreground">
            Por favor, tenta novamente mais tarde.
          </p>
        </div>
      </div>
    )
  }
}

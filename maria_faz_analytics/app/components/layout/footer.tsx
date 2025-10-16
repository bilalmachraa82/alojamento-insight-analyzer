
import Link from 'next/link'
import { BarChart3, Mail, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full border-t bg-muted/50">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-maria-azul" />
              <span className="font-playfair text-xl font-bold">
                A Maria Faz Analytics
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Especialistas em análise de performance para alojamento local.
              Relatórios profissionais que transformam dados em resultados.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Produto</h4>
            <div className="space-y-2">
              <Link href="/#como-funciona" className="block text-sm text-muted-foreground hover:text-maria-azul transition-colors">
                Como Funciona
              </Link>
              <Link href="/#demonstracao" className="block text-sm text-muted-foreground hover:text-maria-azul transition-colors">
                Ver Demonstração
              </Link>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Empresa</h4>
            <div className="space-y-2">
              <Link href="/auth/signin" className="block text-sm text-muted-foreground hover:text-maria-azul transition-colors">
                Entrar na Conta
              </Link>
              <Link href="/auth/signup" className="block text-sm text-muted-foreground hover:text-maria-azul transition-colors">
                Começar Grátis
              </Link>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Contacto</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>admin@amariafaz.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Porto, Portugal</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 A Maria Faz Analytics. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

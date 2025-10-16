
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { BarChart3, Menu, X, LogOut, User, CreditCard } from 'lucide-react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session, status } = useSession() || { data: null, status: 'loading' }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-maria-azul" />
            <span className="hidden font-playfair text-xl font-bold sm:inline-block">
              A Maria Faz Analytics
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/#como-funciona"
              className="transition-colors hover:text-maria-azul"
            >
              Como Funciona
            </Link>
            <Link
              href="/#precos"
              className="transition-colors hover:text-maria-azul"
            >
              Preços
            </Link>
            <Link
              href="/#demonstracao"
              className="transition-colors hover:text-maria-azul"
            >
              Demonstração
            </Link>
          </nav>
        </div>
        
        {/* Mobile menu button */}
        <button
          className="mr-2 inline-flex items-center justify-center rounded-md p-2 text-muted-foreground md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        
        {/* Mobile brand */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <Link href="/" className="flex items-center space-x-2 md:hidden">
            <BarChart3 className="h-6 w-6 text-maria-azul" />
            <span className="font-playfair text-lg font-bold">Maria Faz</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            {status === 'loading' ? (
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            ) : session?.user ? (
              <div className="flex items-center space-x-2">
                <span className="hidden text-sm text-muted-foreground sm:inline-block">
                  {session.user?.credits} créditos
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
                <Button asChild variant="maria" size="sm">
                  <Link href="/dashboard">
                    <User className="h-4 w-4 mr-1" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/signin">Entrar</Link>
                </Button>
                <Button asChild variant="maria" size="sm">
                  <Link href="/auth/signup">
                    <CreditCard className="h-4 w-4 mr-1" />
                    Começar Grátis
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="border-t bg-background md:hidden">
          <nav className="container py-4">
            <div className="grid gap-4">
              <Link
                href="/#como-funciona"
                className="flex items-center text-sm font-medium transition-colors hover:text-maria-azul"
                onClick={() => setIsMenuOpen(false)}
              >
                Como Funciona
              </Link>
              <Link
                href="/#precos"
                className="flex items-center text-sm font-medium transition-colors hover:text-maria-azul"
                onClick={() => setIsMenuOpen(false)}
              >
                Preços
              </Link>
              <Link
                href="/#demonstracao"
                className="flex items-center text-sm font-medium transition-colors hover:text-maria-azul"
                onClick={() => setIsMenuOpen(false)}
              >
                Demonstração
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

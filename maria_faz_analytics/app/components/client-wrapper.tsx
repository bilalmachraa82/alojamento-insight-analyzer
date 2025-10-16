
'use client'

import { useEffect, useState } from 'react'

interface ClientWrapperProps {
  children: React.ReactNode
}

export function ClientWrapper({ children }: ClientWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 hidden md:flex">
            <div className="mr-6 flex items-center space-x-2">
              <div className="h-6 w-6 bg-muted rounded animate-pulse" />
              <span className="hidden font-playfair text-xl font-bold sm:inline-block">
                A Maria Faz Analytics
              </span>
            </div>
          </div>
          
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="flex items-center space-x-2 md:hidden">
              <div className="h-6 w-6 bg-muted rounded animate-pulse" />
              <span className="font-playfair text-lg font-bold">Maria Faz</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  return <>{children}</>
}

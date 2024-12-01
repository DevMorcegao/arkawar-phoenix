'use client'

import { useEffect, useState, useContext } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import React from 'react'
import { logger } from '@/lib/logger'

const publicPaths = ['/login']

// Define o contexto para uso em outros componentes
const RouteGuardContext = React.createContext({
  setAuthenticating: (value: boolean) => {}
})

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useEffect(() => {
    logger.debug('RouteGuard', 'Route state', { 
      user: user?.email,
      loading,
      pathname,
      isPublicPath: publicPaths.includes(pathname),
      isAuthenticating
    })

    // Não redireciona se estiver no processo de autenticação
    if (!loading && !isAuthenticating) {
      if (!user && !publicPaths.includes(pathname)) {
        logger.info('RouteGuard', 'Redirecting to login - protected route')
        router.replace('/login')
      } else if (user && publicPaths.includes(pathname)) {
        logger.info('RouteGuard', 'Redirecting to parties - authenticated user in public route')
        router.replace('/parties')
      }
    }
  }, [user, loading, pathname, router, isAuthenticating])

  // Expõe a função para componentes filhos
  const setAuthenticating = (value: boolean) => {
    setIsAuthenticating(value)
  }

  // Não renderiza nada enquanto verifica a autenticação inicial
  if (loading) {
    logger.debug('RouteGuard', 'Loading initial auth state')
    return null
  }

  return (
    <RouteGuardContext.Provider value={{ setAuthenticating }}>
      <div className="auth-guard" data-authenticating={isAuthenticating}>
        {children}
      </div>
    </RouteGuardContext.Provider>
  )
}

// Exporta o contexto para uso em outros componentes
export const useRouteGuard = () => {
  const context = useContext(RouteGuardContext)
  if (!context) {
    throw new Error('useRouteGuard must be used within RouteGuardProvider')
  }
  return context
}

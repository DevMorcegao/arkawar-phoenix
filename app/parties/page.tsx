'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ArkaWarManager from '@/components/ArkaWarManager'
import { useRouter } from 'next/navigation'
import { ThemeLoadingScreen } from '@/components/ThemeLoadingScreen'

export default function PartiesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  // Mostra a tela de carregamento enquanto verifica a autenticação
  if (loading || !user) {
    return <ThemeLoadingScreen />
  }

  return <ArkaWarManager />
}

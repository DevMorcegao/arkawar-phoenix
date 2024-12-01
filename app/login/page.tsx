'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Auth from '@/components/Auth'
import { ThemeLoadingScreen } from '@/components/ThemeLoadingScreen'

export default function LoginPage() {
  const { user, loading, error } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && user) {
      router.replace('/parties')
    }
  }, [user, loading, router])

  useEffect(() => {
    // Se o loading do auth terminar e não houver erro, espera 2s antes de remover a tela de loading
    if (!loading && !error) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 2000)
      return () => clearTimeout(timer)
    } else if (error) {
      // Se houver erro, remove a tela de loading imediatamente
      setIsLoading(false)
    }
  }, [loading, error])

  if (loading || (isLoading && !error)) {
    return <ThemeLoadingScreen />
  }

  if (user) {
    return null
  }

  return <Auth />
}
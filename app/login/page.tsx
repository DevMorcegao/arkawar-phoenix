'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Auth from '@/components/Auth'
import { ThemeLoadingScreen } from '@/components/ThemeLoadingScreen'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && user) {
      router.replace('/parties')
    }
  }, [user, loading, router])

  useEffect(() => {
    // Se o loading do auth terminar, espera 2s antes de remover a tela de loading
    if (!loading) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [loading])

  if (loading || isLoading) {
    return <ThemeLoadingScreen />
  }

  if (user) {
    return null
  }

  return <Auth />
}
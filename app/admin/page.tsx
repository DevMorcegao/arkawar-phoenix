'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ArkaWarManager from '@/components/ArkaWarManager'

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = '/login'
        return
      }

      if (!isAdmin) {
        window.location.href = '/parties'
        return
      }
    }
  }, [user, isAdmin, loading])

  if (loading || !user || !isAdmin) return null

  return <ArkaWarManager initialSection="admin" />
}

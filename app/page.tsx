'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
// import TestFirestore from "@/components/TestFirestore"

export default function Home() {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      window.location.href = '/parties'
    } else {
      window.location.href = '/login'
    }
  }, [user])

  return null // Redirect page
}
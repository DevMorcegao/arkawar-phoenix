"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-react'
import AdminPanel from '@/components/AdminPanel'
import PartyManager from '@/components/PartyManager'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'

interface ArkaWarManagerProps {
  initialSection?: 'admin' | 'parties'
}

export default function ArkaWarManager({ initialSection = 'parties' }: ArkaWarManagerProps) {
  const { user, logout, isAdmin } = useAuth()
  const [showAdminPanel, setShowAdminPanel] = useState(initialSection === 'admin')
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!isAdmin && initialSection === 'admin') {
      router.push('/parties')
      return
    }
  }, [user, isAdmin, initialSection, router])

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      logger.error('ArkaWarManager', 'Error logging out', { error })
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const toggleSection = () => {
    const newSection = !showAdminPanel
    setShowAdminPanel(newSection)
    router.push(newSection ? '/admin' : '/parties')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-orange-950 dark:via-red-950 dark:to-yellow-950 rounded-lg">
      <header className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 shadow-lg">
        <div className="max-w-8xl mx-auto px-5 sm:px-6 lg:px-10 py-5 flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-500 dark:from-orange-400 dark:via-red-400 dark:to-orange-300 bg-clip-text text-transparent">
            MANAGER GUILD PHOENIX
          </h1>
          <div className="flex items-center space-x-5">
            {isAdmin && (
              <Button
                onClick={toggleSection}
                variant="outline"
                className="text-base px-5 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none hover:text-white"
              >
                {showAdminPanel ? "Gerenciar Parties" : "Painel Admin"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 hover:from-orange-200 hover:to-red-200 dark:hover:from-orange-800/30 dark:hover:to-red-800/30"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="destructive"
              className="text-base px-5 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 dark:from-red-800 dark:to-orange-800 dark:hover:from-red-900 dark:hover:to-orange-900"
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-8xl mx-auto px-5 sm:px-6 lg:px-10 py-8">
      <div className="rounded-lg">
          {showAdminPanel && isAdmin ? (
            <>
              <AdminPanel />
            </>
          ) : (
            <PartyManager />
          )}
        </div>
      </main>

      <footer className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 shadow-lg">
        <div className="max-w-8xl mx-auto px-5 sm:px-6 lg:px-10 py-4 text-center text-orange-800 dark:text-orange-200">
          Guild Phoenix &copy; Since 2023
        </div>
      </footer>
    </div>
  )
}
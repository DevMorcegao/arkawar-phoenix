"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import Auth from "@/components/Auth"
import AdminPanel from "@/components/AdminPanel"
import PartyManager from "@/components/PartyManager"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

export default function ArkaWarManager() {
  const { user, loading, logout, isAdmin } = useAuth()
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const { theme, setTheme } = useTheme()

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-orange-950 dark:via-red-950 dark:to-yellow-950">
      <header className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 shadow-lg">
        <div className="max-w-8xl mx-auto px-5 sm:px-6 lg:px-10 py-5 flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-500 dark:from-orange-400 dark:via-red-400 dark:to-orange-300 bg-clip-text text-transparent">
            ARKA WAR GUILD PHOENIX
          </h1>
          <div className="flex items-center space-x-5">
            {isAdmin && (
              <Button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                variant="outline"
                className="text-base px-5 py-2 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 hover:from-orange-100 hover:to-red-100 dark:hover:from-orange-800/30 dark:hover:to-red-800/30"
              >
                {showAdminPanel ? "Gerenciar Parties" : "Painel Admin"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="h-9 w-9 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 hover:from-orange-100 hover:to-red-100 dark:hover:from-orange-800/30 dark:hover:to-red-800/30"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button 
              onClick={logout} 
              variant="destructive"
              className="text-base px-5 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 dark:from-red-800 dark:to-orange-800 dark:hover:from-red-900 dark:hover:to-orange-900"
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-8xl mx-auto px-5 sm:px-6 lg:px-10 py-8">
        {showAdminPanel && isAdmin ? <AdminPanel /> : <PartyManager />}
      </main>

      <footer className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 shadow-lg">
        <div className="max-w-8xl mx-auto px-5 sm:px-6 lg:px-10 py-4 text-center text-orange-800 dark:text-orange-200">
          Arka War Guild Phoenix &copy; 2024
        </div>
      </footer>
    </div>
  )
}
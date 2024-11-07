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
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-600 dark:text-orange-400">ARKA WAR GUILD PHOENIX</h1>
          <div className="flex items-center space-x-4">
            {isAdmin && (
              <Button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                variant="outline"
              >
                {showAdminPanel ? "Gerenciar Parties" : "Painel Admin"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button onClick={logout} variant="destructive">
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showAdminPanel && isAdmin ? <AdminPanel /> : <PartyManager />}
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow-md mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-gray-600 dark:text-gray-400">
          Arka War Guild Phoenix &copy; 2024
        </div>
      </footer>
    </div>
  )
}
"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import React from "react"
import { logger } from '@/lib/logger'

export default function Auth() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const { login, register, error, clearError, isAuthenticating } = useAuth()
  const { theme, setTheme } = useTheme()

  // Debug effect
  useEffect(() => {
    logger.debug('Auth', 'Auth state changed', { isAuthenticating, error, activeTab })
  }, [isAuthenticating, error, activeTab])

  // Effect para manter a tab correta quando houver erro
  useEffect(() => {
    if (error.message && error.context) {
      setActiveTab(error.context)
    }
  }, [error])

  const handleLogin = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string
      
      logger.info('Auth', 'Login attempt', { email })
      await login(email, password)
      logger.info('Auth', 'Login success', { email })
    } catch (err: any) {
      logger.error('Auth', 'Login error', { error: err.message })
    }
  }, [login])

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const email = formData.get('email') as string
      const password = formData.get('password') as string
      const confirmPassword = formData.get('confirmPassword') as string
      const name = formData.get('name') as string

      logger.info('Auth', 'Starting registration', { email, name })
      await register(email, password, name, confirmPassword)
      logger.info('Auth', 'Registration successful', { email })
    } catch (err: any) {
      logger.error('Auth', 'Registration error', { error: err.message })
    }
  }, [register])

  // Limpar erro ao trocar de tab
  const handleTabChange = useCallback((value: string) => {
    logger.debug('Auth', 'Tab changed', { value })
    clearError()
    setActiveTab(value as 'login' | 'register')
  }, [clearError])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-600 dark:from-orange-900 dark:to-red-900 p-4">
      <Card data-testid="auth-component" className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle data-testid="card-title" className="text-3xl font-bold text-center text-orange-600 dark:text-orange-400">ARKA WAR GUILD PHOENIX</CardTitle>
          <CardDescription className="text-center text-gray-600 dark:text-gray-400">
            Renasça das cinzas e junte-se à batalha!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger data-testid="login-tab" value="login">Login</TabsTrigger>
              <TabsTrigger data-testid="register-tab" value="register">Registro</TabsTrigger>
            </TabsList>
            <TabsContent data-testid="login-form" value="login">
              <div className="space-y-4">
                <form onSubmit={handleLogin}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        data-testid="email-input"
                        id="login-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                        disabled={isAuthenticating}
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        data-testid="password-input"
                        id="login-password"
                        name="password"
                        type="password"
                        required
                        disabled={isAuthenticating}
                        autoComplete="current-password"
                      />
                    </div>
                    {error.message && error.context === 'login' && (
                      <div 
                        className="bg-red-100 border-l-4 border-red-500 p-4 rounded" 
                        role="alert"
                        data-testid="error-message"
                      >
                        <p className="text-sm text-red-700" data-testid="error-text">
                          {error.message}
                        </p>
                      </div>
                    )}
                    <Button
                      type="submit"
                      data-testid="login-button"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      disabled={isAuthenticating}
                    >
                      {isAuthenticating ? (
                        <>
                          <div
                            data-testid="loading-spinner"
                            className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                          ></div>
                          Entrando...
                        </>
                      ) : (
                        'Entrar'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            <TabsContent data-testid="register-form" value="register">
              <div className="space-y-4">
                <form onSubmit={handleRegister}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Nome</Label>
                      <Input
                        data-testid="register-name"
                        id="register-name"
                        name="name"
                        type="text"
                        required
                        disabled={isAuthenticating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        data-testid="register-email"
                        id="register-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                        disabled={isAuthenticating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <Input
                        data-testid="register-password"
                        id="register-password"
                        name="password"
                        type="password"
                        required
                        disabled={isAuthenticating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">Confirmar Senha</Label>
                      <Input
                        data-testid="register-confirm-password"
                        id="register-confirm-password"
                        name="confirmPassword"
                        type="password"
                        required
                        disabled={isAuthenticating}
                      />
                    </div>
                    {error.message && error.context === 'register' && (
                      <div 
                        className="bg-red-100 border-l-4 border-red-500 p-4 rounded" 
                        role="alert"
                        data-testid="error-message"
                      >
                        <p className="text-sm text-red-700" data-testid="error-text">
                          {error.message}
                        </p>
                      </div>
                    )}
                    <Button 
                      type="submit" 
                      data-testid="register-button"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      disabled={isAuthenticating}
                    >
                      {isAuthenticating ? (
                        <>
                          <div
                            data-testid="loading-spinner"
                            className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                          ></div>
                          Registrando...
                        </>
                      ) : (
                        'Registrar'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-full w-8 h-8"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
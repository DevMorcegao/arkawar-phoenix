"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { register, login } = useAuth()
  const { theme, setTheme } = useTheme()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      await login(email, password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError("Falha no login. Verifique suas credenciais.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      await register(email, password, name)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError("Falha no registro. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-600 dark:from-orange-900 dark:to-red-900 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center text-orange-600 dark:text-orange-400">ARKA WAR GUILD PHOENIX</CardTitle>
          <CardDescription className="text-center text-gray-600 dark:text-gray-400">
            Renasça das cinzas e junte-se à batalha!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Registro</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" name="name" placeholder="Seu nome" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isLoading}>
                  {isLoading ? "Registrando..." : "Registrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">Arka War Guild Phoenix &copy; 2024</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
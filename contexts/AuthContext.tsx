'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { auth, db } from '@/lib/firebase'
import { User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  register: (email: string, password: string, name: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAdmin: boolean
  userRole: string | null
  setAuthenticating: (value: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()

  // Função para verificar e validar a autenticação
  const validateAuth = async (firebaseUser: User | null) => {
    try {
      setLoading(true)
      console.log('🔍 Validando autenticação:', { firebaseUser: firebaseUser?.email })
      
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken()
        const storedToken = Cookies.get('auth_token')
        const storedRole = Cookies.get('user_role')
        
        console.log('📝 Tokens:', { 
          newToken: token?.slice(-10),
          storedToken: storedToken?.slice(-10),
          storedRole
        })

        // Buscar dados do usuário primeiro
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        const userData = userDoc.data()
        const role = userData?.role || 'user'
        
        console.log('👤 Dados do usuário:', { role, storedRole })

        // Se não há token ou role nos cookies, configurar
        if (!storedToken || !storedRole) {
          console.log('📝 Configurando tokens iniciais')
          Cookies.set('auth_token', token, { secure: true, sameSite: 'strict' })
          Cookies.set('user_role', role, { secure: true, sameSite: 'strict' })
          setUser(firebaseUser)
          setIsAdmin(role === 'admin')
          setUserRole(role)
          console.log('✅ Tokens configurados com sucesso')
          return
        }

        // Verificar se o token armazenado é diferente do atual
        if (storedToken !== token) {
          console.log('🔄 Atualizando token')
          Cookies.set('auth_token', token, { secure: true, sameSite: 'strict' })
        }

        // Se a role armazenada é diferente da atual, atualizar
        if (storedRole !== role) {
          console.log('🔄 Atualizando role')
          Cookies.set('user_role', role, { secure: true, sameSite: 'strict' })
        }

        setUser(firebaseUser)
        setIsAdmin(role === 'admin')
        setUserRole(role)
        console.log('✅ Autenticação validada com sucesso')
      } else {
        console.log('❌ Usuário não autenticado')
        // Limpar tudo se não há usuário
        Cookies.remove('auth_token')
        Cookies.remove('user_role')
        setUser(null)
        setIsAdmin(false)
        setUserRole(null)
      }
    } catch (error) {
      console.error('❌ Erro validando autenticação:', error)
      // Em caso de erro, apenas limpar os dados sem fazer logout
      Cookies.remove('auth_token')
      Cookies.remove('user_role')
      setUser(null)
      setIsAdmin(false)
      setUserRole(null)
    } finally {
      setLoading(false)
    }
  }

  // Função para decodificar o token JWT e obter o tempo de expiração
  const getTokenExpirationTime = (token: string): number => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''))
      const { exp } = JSON.parse(jsonPayload)
      return exp * 1000 // Converter para milissegundos
    } catch (error) {
      console.error('Erro ao decodificar token:', error)
      return 0
    }
  }

  // Função para agendar a próxima verificação de token
  const scheduleNextTokenCheck = async (currentUser: User) => {
    try {
      const token = await currentUser.getIdToken()
      const expirationTime = getTokenExpirationTime(token)
      const now = Date.now()
      const timeUntilExpiry = expirationTime - now
      const checkBuffer = 5 * 60 * 1000 // 5 minutos antes da expiração

      // Se o token já expirou ou está próximo de expirar, verificar imediatamente
      if (timeUntilExpiry <= checkBuffer) {
        await validateAuth(currentUser)
        return
      }

      // Agendar próxima verificação para 5 minutos antes da expiração
      const nextCheckTime = timeUntilExpiry - checkBuffer
      setTimeout(async () => {
        await validateAuth(currentUser)
      }, nextCheckTime)

      console.log(`Próxima verificação de token agendada para ${new Date(now + nextCheckTime).toLocaleString()}`)
    } catch (error) {
      console.error('Erro ao agendar verificação de token:', error)
    }
  }

  // Efeito para monitorar mudanças na autenticação
  useEffect(() => {
    console.log('🔄 Configurando listener de autenticação')
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔔 Estado de autenticação mudou:', { email: firebaseUser?.email })
      await validateAuth(firebaseUser)
      if (firebaseUser) {
        await scheduleNextTokenCheck(firebaseUser)
      }
    })

    return () => {
      console.log('🔄 Removendo listener de autenticação')
      unsubscribe()
    }
  }, [])

  // Efeito para verificação de backup e cookies
  useEffect(() => {
    // Verificação de backup a cada 15 minutos
    const backupInterval = setInterval(async () => {
      const currentUser = auth.currentUser
      if (currentUser) {
        await scheduleNextTokenCheck(currentUser)
      }
    }, 15 * 60 * 1000)

    // Verificação de cookies
    const cookieCheckInterval = setInterval(() => {
      const token = Cookies.get('auth_token')
      const role = Cookies.get('user_role')
      
      if (user && (!token || !role)) {
        logout()
      }
    }, 10000) // Ocorre a verificação a cada 10 segundos

    return () => {
      clearInterval(backupInterval)
      clearInterval(cookieCheckInterval)
    }
  }, [user])

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true)
      console.log('🔑 Iniciando login:', { email })
      
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('✅ Login bem-sucedido:', { email: result.user.email })
      
      // Validar autenticação imediatamente após o login
      await validateAuth(result.user)
    } catch (error) {
      console.error('❌ Erro no login:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
      setLoading(true)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Criar documento do usuário
      await setDoc(doc(db, 'users', user.uid), {
        email,
        name,
        role: 'user',
        createdAt: new Date().toISOString()
      })

      // Validar autenticação após registro
      await validateAuth(user)
    } catch (error) {
      console.error("Erro durante o registro:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      console.log('🚪 Iniciando logout')
      await signOut(auth)
      Cookies.remove('auth_token')
      Cookies.remove('user_role')
      setUser(null)
      setIsAdmin(false)
      setUserRole(null)
      console.log('✅ Logout realizado com sucesso')
      router.replace('/login')
    } catch (error) {
      console.error('❌ Erro no logout:', error)
      throw error
    }
  }

  // Função para controlar o estado de autenticação em andamento
  const setAuthenticating = (value: boolean) => {
    // Emite um evento customizado para o RouteGuard
    const event = new CustomEvent('authenticating', { detail: value })
    window.dispatchEvent(event)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      register,
      login,
      logout,
      isAdmin,
      userRole,
      setAuthenticating
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

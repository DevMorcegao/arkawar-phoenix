'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { auth, db } from '@/lib/firebase'
import { User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { logger } from '@/lib/logger'

interface AuthError {
  message: string;
  context: 'login' | 'register' | null;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  userRole: string | null;
  loading: boolean;
  isAuthenticating: boolean;
  error: AuthError;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, confirmPassword?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setError: (error: AuthError) => void;
  setAuthenticating: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: { children: ReactNode }) {
  logger.debug('AuthProvider', 'Render')
  
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<AuthError>({ message: '', context: null })
  const authSourceRef = useRef<'login' | 'onAuthStateChanged' | null>(null)
  const router = useRouter()

  // Função para tratar erros de autenticação
  const handleAuthError = (error: any) => {
    logger.error('AuthProvider', 'Erro de autenticação', { error })
    let errorText = 'Falha ao fazer login. Tente novamente.'
    
    if (error?.code === 'auth/invalid-credential' || 
        error?.code === 'auth/wrong-password' || 
        error?.code === 'auth/user-not-found') {
      errorText = 'Email ou senha inválidos.'
    } else if (error?.code === 'auth/invalid-email') {
      errorText = 'Formato de email inválido.'
    } else if (error?.code === 'auth/too-many-requests') {
      errorText = 'Muitas tentativas de login. Tente novamente mais tarde.'
    }
    
    setError({ message: errorText, context: 'login' })
  }

  // Efeito inicial para verificar autenticação
  useEffect(() => {
    logger.info('AuthProvider', 'Verificando autenticação inicial')
    const currentUser = auth.currentUser
    
    if (currentUser) {
      validateAuth(currentUser, 'onAuthStateChanged')
        .catch(error => logger.error('AuthProvider', 'Erro na verificação inicial', { error }))
    } else {
      setLoading(false)
    }
  }, [])

  // Efeito para monitorar mudanças na autenticação
  useEffect(() => {
    logger.info('AuthProvider', 'Configurando auth listener')
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      logger.debug('AuthProvider', 'Auth State Changed', { 
        user: firebaseUser?.email,
        authSource: authSourceRef.current,
        loading
      })

      // Se a autenticação veio do login, ignorar
      if (authSourceRef.current === 'login') {
        logger.debug('AuthProvider', 'Ignorando auth change do login')
        return
      }

      try {
        await validateAuth(firebaseUser, 'onAuthStateChanged')
      } catch (error) {
        logger.error('AuthProvider', 'Erro no auth listener', { error })
      }
    })

    return () => {
      logger.debug('AuthProvider', 'Limpando auth listener')
      unsubscribe()
    }
  }, [])

  // Função para mostrar toast de login
  const showLoginToast = () => {
    const now = Date.now()
    const lastLoginTime = localStorage.getItem('last_login_time')
    
    // Atualiza timestamp do último login
    localStorage.setItem('last_login_time', now.toString())
    
    // Se for primeiro login ou login após 24h, mostra toast
    if (!lastLoginTime || (now - parseInt(lastLoginTime)) > 24 * 60 * 60 * 1000) {
      logger.debug('AuthProvider', 'Mostrando toast de login', {
        lastLoginTime,
        timeSinceLastLogin: lastLoginTime ? now - parseInt(lastLoginTime) : 'primeiro login'
      })
      setTimeout(() => {
        toast.success('Login realizado com sucesso!')
      }, 1500)
    } else {
      logger.debug('AuthProvider', 'Login recente, não mostrar toast', {
        lastLoginTime,
        timeSinceLastLogin: lastLoginTime ? now - parseInt(lastLoginTime) : 'primeiro login'
      })
    }
  }

  const login = async (email: string, password: string) => {
    const loginId = Math.random().toString(36).substr(2, 9)
    logger.debug('AuthProvider', '[LOGIN START]', { id: loginId, email })
    setIsAuthenticating(true)
    clearError()
    authSourceRef.current = 'login'

    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      logger.debug('AuthProvider', '[FIREBASE AUTH]', { id: loginId, email: result.user.email })
      
      await validateAuth(result.user, 'login', true)
      logger.debug('AuthProvider', '[VALIDATION]', { id: loginId })
      
      // Redirecionar antes do toast
      logger.debug('AuthProvider', '[REDIRECT START]', { id: loginId })
      await router.replace('/parties')
      logger.debug('AuthProvider', '[REDIRECT END]', { id: loginId })
      
      // Mostrar toast após redirecionamento
      logger.debug('AuthProvider', '[TOAST SCHEDULED]', { id: loginId, delay: 1500 })
      setTimeout(() => {
        logger.debug('AuthProvider', '[TOAST SHOWING]', { id: loginId })
        toast.success('Login realizado com sucesso!')
      }, 1500)
      
    } catch (error: any) {
      logger.error('AuthProvider', '[LOGIN ERROR]', { id: loginId, error })
      handleAuthError(error)
    } finally {
      logger.debug('AuthProvider', '[LOGIN END]', { id: loginId })
      setIsAuthenticating(false)
      authSourceRef.current = null
    }
  }

  const register = async (email: string, password: string, name: string, confirmPassword?: string): Promise<void> => {
    const registerId = Math.random().toString(36).substr(2, 9)
    logger.debug('AuthProvider', '[REGISTER START]', { id: registerId, email, name })
    
    try {
      setIsAuthenticating(true)
      setError({ message: '', context: null })
      authSourceRef.current = 'login'

      // Validações locais
      if (!name?.trim()) {
        setError({ message: 'Nome é obrigatório.', context: 'register' })
        throw new Error('Nome é obrigatório.')
      }

      if (password.length < 6) {
        setError({ message: 'A senha deve ter pelo menos 6 caracteres.', context: 'register' })
        throw new Error('A senha deve ter pelo menos 6 caracteres.')
      }

      if (confirmPassword && password !== confirmPassword) {
        setError({ message: 'As senhas não coincidem.', context: 'register' })
        throw new Error('As senhas não coincidem.')
      }
      
      const result = await createUserWithEmailAndPassword(auth, email, password)
      logger.debug('AuthProvider', '[FIREBASE AUTH]', { id: registerId, email: result.user.email })
      
      await setDoc(doc(db, 'users', result.user.uid), {
        email,
        name,
        role: 'user',
        createdAt: new Date().toISOString()
      })
      logger.debug('AuthProvider', '[USER DOC CREATED]', { id: registerId })
      
      await validateAuth(result.user, 'login', true)
      logger.debug('AuthProvider', '[VALIDATION]', { id: registerId })
      
      // Redirecionar antes do toast
      logger.debug('AuthProvider', '[REDIRECT START]', { id: registerId })
      await router.replace('/parties')
      logger.debug('AuthProvider', '[REDIRECT END]', { id: registerId })
      
      // Mostrar toast após redirecionamento
      logger.debug('AuthProvider', '[TOAST SCHEDULED]', { id: registerId, delay: 1500 })
      setTimeout(() => {
        logger.debug('AuthProvider', '[TOAST SHOWING]', { id: registerId })
        toast.success('Registro realizado com sucesso!')
      }, 1500)
      
    } catch (error: any) {
      logger.error('AuthProvider', '[REGISTER ERROR]', { id: registerId, error })
      let errorText = 'Erro ao registrar. Tente novamente.'
      
      if (error?.code === 'auth/email-already-in-use') {
        errorText = 'Este email já está em uso.'
      } else if (error?.code === 'auth/invalid-email') {
        errorText = 'Email inválido.'
      } else if (error?.message?.includes('A senha deve ter pelo menos 6 caracteres.')) {
        errorText = error.message
      } else if (error?.message?.includes('As senhas não coincidem.')) {
        errorText = error.message
      } else if (error?.message?.includes('Nome é obrigatório.')) {
        errorText = error.message
      }
      
      setError({ message: errorText, context: 'register' })
      throw new Error(errorText)
    } finally {
      logger.debug('AuthProvider', '[REGISTER END]', { id: registerId })
      setIsAuthenticating(false)
      authSourceRef.current = null
    }
  }

  const logout = async () => {
    try {
      logger.debug('AuthProvider', 'Iniciando logout')
      await signOut(auth)
      Cookies.remove('auth_token')
      Cookies.remove('user_role')
      setUser(null)
      setIsAdmin(false)
      setUserRole(null)
      logger.debug('AuthProvider', 'Logout realizado com sucesso')
      router.replace('/login')
    } catch (error) {
      logger.error('AuthProvider', 'Erro no logout', { error })
      throw error
    }
  }

  // Validação de autenticação
  const validateAuth = async (firebaseUser: User | null, authSource: 'login' | 'onAuthStateChanged', showToast = false) => {
    const validateId = Math.random().toString(36).substr(2, 9)
    logger.info('AuthProvider', 'Iniciando validação', { 
      id: validateId,
      email: firebaseUser?.email, 
      source: authSource,
      loading,
      showToast
    })
    
    try {
      if (!firebaseUser) {
        logger.warn('AuthProvider', 'Sem usuário para validar', { id: validateId })
        setUser(null)
        setIsAdmin(false)
        setUserRole(null)
        setLoading(false)
        return false
      }

      const newToken = await firebaseUser.getIdToken()
      logger.debug('AuthProvider', 'Token obtido', { id: validateId })

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
      const userData = userDoc.data()
      const role = userData?.role || 'user'

      logger.info('AuthProvider', 'Dados do usuário obtidos', { 
        id: validateId,
        email: firebaseUser.email,
        role,
        authSource
      })

      // Atualizar cookies e estado
      Cookies.set('auth_token', newToken)
      Cookies.set('user_role', role)
      setUser(firebaseUser)
      setIsAdmin(role === 'admin')
      setUserRole(role)
      setLoading(false)

      logger.debug('AuthProvider', 'Validação concluída', { id: validateId })
      return true
    } catch (error) {
      logger.error('AuthProvider', 'Erro na validação', { id: validateId, error })
      setUser(null)
      setIsAdmin(false)
      setUserRole(null)
      setLoading(false)
      throw error
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
      logger.error('AuthProvider', 'Erro ao decodificar token', { error })
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
        await validateAuth(currentUser, 'onAuthStateChanged')
        return
      }

      // Agendar próxima verificação para 5 minutos antes da expiração
      const nextCheckTime = timeUntilExpiry - checkBuffer
      setTimeout(async () => {
        await validateAuth(currentUser, 'onAuthStateChanged')
      }, nextCheckTime)

      logger.debug('AuthProvider', 'Próxima verificação de token agendada para', { nextCheckTime })
    } catch (error) {
      logger.error('AuthProvider', 'Erro ao agendar verificação de token', { error })
    }
  }

  const clearError = useCallback(() => {
    setError({ message: '', context: null })
  }, [])

  // Função para redirecionar após autenticação bem-sucedida
  const redirectAfterAuth = useCallback(async () => {
    try {
      logger.debug('AuthProvider', 'Redirecionando após autenticação...')
      await router.push('/parties')
      logger.debug('AuthProvider', 'Redirecionamento bem-sucedido')
    } catch (error) {
      logger.error('AuthProvider', 'Erro ao redirecionar', { error })
    }
  }, [router])

  // Função para controlar o estado de autenticação em andamento
  const setAuthenticating = (value: boolean) => {
    // Emite um evento customizado para o RouteGuard
    const event = new CustomEvent('authenticating', { detail: value })
    window.dispatchEvent(event)
  }

  const value = {
    user,
    isAdmin,
    userRole,
    loading,
    isAuthenticating,
    error,
    login,
    register,
    logout,
    clearError,
    setError,
    setAuthenticating: setIsAuthenticating
  }

  return (
    <AuthContext.Provider value={value}>
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

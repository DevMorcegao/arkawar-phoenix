'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { auth, db } from '@/lib/firebase'
import { User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'

interface AuthContextType {
  user: User | null
  loading: boolean
  register: (email: string, password: string, name: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setIsAdmin(userDoc.data()?.role === 'admin');
          } else {
            console.error("Documento do usuário não encontrado no Firestore");
          }
        } catch (error) {
          console.error("Erro ao buscar documento do usuário:", error);
        }
      }
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);

  const register = async (email: string, password: string, name: string) => {
    console.log("Iniciando registro para:", email);
    try {
      // Passo 1: Registra o usuário no Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Usuário criado com sucesso, UID:", userCredential.user.uid);
      
      // Passo 2: Cria o documento do usuário no Firestore
      const userData = {
        id: userCredential.user.uid,       // Adiciona o campo 'id' com o UID do usuário
        name: name,
        email: email,
        role: 'user',                      // Define 'role' como 'user' (ou 'admin' se necessário)
        status: 'approved',                
        createdAt: new Date(),
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      console.log("Documento do usuário criado no Firestore");
      
      // Verificar se o documento foi realmente criado
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        console.log("Documento do usuário confirmado no Firestore");
      } else {
        console.error("Falha ao criar o documento do usuário no Firestore");
      }
    } catch (error) {
      console.error("Erro durante o registro:", error);
      throw error;
    }
  }

  const login = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = () => {
    return signOut(auth)
  }

  const value: AuthContextType = {
    user,
    loading,
    register,
    login,
    logout,
    isAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

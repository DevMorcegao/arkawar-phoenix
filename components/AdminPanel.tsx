"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/firebase"
import { collection, query, updateDoc, doc, deleteDoc, onSnapshot, getDoc, serverTimestamp, where } from "firebase/firestore"
import { UserInfo } from "firebase/auth"
import { Shield, Trash2, UserPlus, ChevronDown, ChevronUp } from 'lucide-react'
import BossTracker from "./BossTracker"
import BossList from "./BossList"
import { Boss } from "@/app/types/boss"
import { toast } from "react-hot-toast"
import { useAuth } from "@/contexts/AuthContext"

interface FirebaseUser extends UserInfo {
  role?: string
}

export default function AdminPanel() {
  const [users, setUsers] = useState<FirebaseUser[]>([])
  const [allBosses, setAllBosses] = useState<Boss[]>([])
  const [showUsers, setShowUsers] = useState(false)
  const [showBossTracker, setShowBossTracker] = useState(false)
  const [showAllBosses, setShowAllBosses] = useState(false)
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    const unsubscribeUsers = subscribeToUsers()
    const unsubscribeBosses = subscribeToAllBosses()
    return () => {
      unsubscribeUsers()
      unsubscribeBosses()
    }
  }, [])

  const subscribeToUsers = () => {
    const usersQuery = query(collection(db, "users"))
    return onSnapshot(usersQuery, (snapshot) => {
      const updatedUsers = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      } as FirebaseUser))
      setUsers(updatedUsers)
    })
  }

  const subscribeToAllBosses = () => {
    const bossesQuery = query(
      collection(db, 'bossSpawns'),
      where('status', '!=', 'deleted')
    )
    return onSnapshot(bossesQuery, (snapshot) => {
      const updatedBosses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Boss))
      setAllBosses(updatedBosses)
    })
  }

  const toggleUserRole = async (userId: string, currentRole: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para realizar esta ação.')
      return
    }

    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole
      })
      toast.success(`Papel do usuário atualizado para: ${newRole}`)
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Erro ao atualizar o papel do usuário. Tente novamente.')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para realizar esta ação.')
      return
    }

    try {
      await deleteDoc(doc(db, "users", userId))
      toast.success('Usuário removido com sucesso.')
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Erro ao remover o usuário. Tente novamente.')
    }
  }

  const handleSort = () => {
    const sortedBosses = [...allBosses].sort((a, b) => {
      return new Date(a.spawnTime).getTime() - new Date(b.spawnTime).getTime()
    })
    setAllBosses(sortedBosses)
    toast.success('Bosses ordenados por tempo de spawn.')
  }

  const handleUpdateStatus = async (id: string, status: 'killed' | 'noshow') => {
    if (!user) {
      toast.error('Você precisa estar logado para realizar esta ação.')
      return
    }

    try {
      const bossRef = doc(db, 'bossSpawns', id)
      const bossDoc = await getDoc(bossRef)
      
      if (!bossDoc.exists()) {
        toast.error('Boss não encontrado.')
        return
      }

      // Verificar se o usuário tem permissão para atualizar
      const bossData = bossDoc.data()
      if (!isAdmin && bossData.userId !== user.uid) {
        toast.error('Você não tem permissão para atualizar este boss.')
        return
      }

      await updateDoc(bossRef, {
        status,
        lastUpdated: serverTimestamp()
      })

      // Update local state immediately
      setAllBosses(prevBosses => 
        prevBosses.map(boss => 
          boss.id === id ? { ...boss, status, lastUpdated: new Date() } : boss
        )
      )

      toast.success(`Status do boss atualizado para: ${status}`)
    } catch (error) {
      console.error('Error updating boss status:', error)
      toast.error('Erro ao atualizar o status do boss.')
    }
  }

  const handleRemove = async (id: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para realizar esta ação.')
      return
    }

    try {
      const bossRef = doc(db, 'bossSpawns', id)
      const bossDoc = await getDoc(bossRef)
      
      if (!bossDoc.exists()) {
        toast.error('Boss não encontrado.')
        return
      }

      // Verificar se o usuário tem permissão para remover
      const bossData = bossDoc.data()
      if (!isAdmin && bossData.userId !== user.uid) {
        toast.error('Você não tem permissão para remover este boss.')
        return
      }

      await updateDoc(bossRef, {
        status: 'deleted',
        lastUpdated: serverTimestamp()
      })

      // Update local state immediately
      setAllBosses(prevBosses => prevBosses.filter(boss => boss.id !== id))
      
      toast.success('Boss removido com sucesso.')
    } catch (error) {
      console.error('Error removing boss:', error)
      toast.error('Erro ao remover o boss.')
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Painel Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 mb-4">
          <Button
            onClick={() => setShowUsers(!showUsers)}
            className="flex items-center"
          >
            Usuários
            {showUsers ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
          <Button
            onClick={() => setShowBossTracker(!showBossTracker)}
            className="flex items-center"
          >
            Boss Tracker
            {showBossTracker ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
          <Button
            onClick={() => setShowAllBosses(!showAllBosses)}
            className="flex items-center"
          >
            Todos os Bosses
            {showAllBosses ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
        </div>

        {showUsers && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Usuários</h2>
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.uid} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                  <div className="flex items-center space-x-2">
                    <span>{user.displayName || user.email}</span>
                    {user.role === 'admin' && <Shield className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserRole(user.uid, user.role || 'user')}
                    >
                      {user.role === 'admin' ? <UserPlus className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteUser(user.uid)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showBossTracker && (
          <div className="mt-4">
            <BossTracker />
          </div>
        )}

        {showAllBosses && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-4">Todos os Bosses</h3>
            <BossList
              bosses={allBosses}
              onSort={handleSort}
              onRemove={handleRemove}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
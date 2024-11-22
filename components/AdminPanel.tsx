"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { db } from "@/lib/firebase"
import { collection, query, updateDoc, doc, deleteDoc, onSnapshot, getDoc, serverTimestamp, where, setDoc, getDocs } from "firebase/firestore"
import { UserInfo } from "firebase/auth"
import { 
  ChevronDown,
  ChevronUp,
  Shield,
  Users,
  Swords,
  Timer,
  ListChecks,
  Trash2, 
  UserPlus 
} from 'lucide-react'
import BossTracker from "./BossTracker"
import BossCard from "./BossCard"
import BossDrops from "./BossDrops"
import BossStatus from "./BossStatus"
import { Boss } from "@/app/types/boss"
import { toast } from "react-hot-toast"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

interface FirebaseUser extends UserInfo {
  role?: string
}

export default function AdminPanel() {
  const [users, setUsers] = useState<FirebaseUser[]>([])
  const [allBosses, setAllBosses] = useState<Boss[]>([])
  const [showUsers, setShowUsers] = useState(false)
  const [showBossTracker, setShowBossTracker] = useState(false)
  const [showAllBosses, setShowAllBosses] = useState(false)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [sortBy, setSortBy] = useState<'time' | 'name' | 'channel'>('time')
  const [openChangeRole, setOpenChangeRole] = useState(false)
  const [openRemoveUser, setOpenRemoveUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState<FirebaseUser | null>(null)
  const { user, isAdmin } = useAuth()

  const handleAddUser = async () => {
    const email = prompt('Digite o email do usuário:')
    if (!email) return

    try {
      // Verificar se o usuário já existe
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        toast.error('Usuário já existe.')
        return
      }

      // Criar novo usuário
      const newUser = {
        email,
        role: 'user',
        createdAt: serverTimestamp()
      }

      await setDoc(doc(usersRef), newUser)
      toast.success('Usuário adicionado com sucesso!')
    } catch (error) {
      console.error('Error adding user:', error)
      toast.error('Erro ao adicionar usuário.')
    }
  }

  useEffect(() => {
    if (!user) return

    const unsubscribeUsers = subscribeToUsers()
    const unsubscribeBosses = onSnapshot(
      query(
        collection(db, 'bossSpawns'),
        where('status', '==', 'pending')
      ),
      (snapshot) => {
        const updatedBosses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          lastUpdated: doc.data().lastUpdated?.toDate() || null,
          createdAt: doc.data().createdAt?.toDate() || null
        } as Boss))

        // Ordenar bosses
        const sortedBosses = [...updatedBosses].sort((a, b) => {
          if (sortBy === 'time') {
            const timeA = new Date(a.spawnTime).getTime()
            const timeB = new Date(b.spawnTime).getTime()
            return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
          } else if (sortBy === 'name') {
            return sortOrder === 'asc' 
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name)
          } else { // channel
            const channelA = parseInt((a.channel || 'Channel 0').replace(/\D/g, '')) || 0
            const channelB = parseInt((b.channel || 'Channel 0').replace(/\D/g, '')) || 0
            return sortOrder === 'asc' ? channelA - channelB : channelB - channelA
          }
        })

        setAllBosses(sortedBosses)
      }
    )

    return () => {
      unsubscribeUsers()
      unsubscribeBosses()
    }
  }, [user, sortOrder, sortBy])

  const handleSort = (newSortBy: 'time' | 'name' | 'channel') => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('asc')
    }
  }

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
      const bossData = bossDoc.data() as Boss
      if (!isAdmin && bossData.userId !== user.uid) {
        toast.error('Você não tem permissão para atualizar este boss.')
        return
      }

      // Se estiver marcando como morto ou não apareceu, verificar se já passou do horário de spawn
      if (status === 'killed' || status === 'noshow') {
        const spawnTime = new Date(bossData.spawnTime)
        const now = new Date()
        
        if (now < spawnTime) {
          const diffInMinutes = Math.round((spawnTime.getTime() - now.getTime()) / (1000 * 60))
          const hours = Math.floor(diffInMinutes / 60)
          const minutes = diffInMinutes % 60
          const action = status === 'killed' ? 'morto' : 'como não aparecido'
          toast.error(`Não é possível marcar o boss como ${action} antes do horário de spawn. Faltam ${hours}h ${minutes}m para o nascimento.`)
          return
        }
      }

      await updateDoc(bossRef, {
        status,
        appearanceStatus: status,
        lastUpdated: serverTimestamp()
      })

      // Não precisamos atualizar o estado local pois o onSnapshot já vai cuidar disso
      toast.success(status === 'killed' ? 'Boss marcado como morto!' : 'Boss marcado como não aparecido!')
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

      // Não precisamos atualizar o estado local pois o onSnapshot já cuida disso
      toast.success('Boss removido com sucesso.')
    } catch (error) {
      console.error('Error removing boss:', error)
      toast.error('Erro ao remover o boss.')
    }
  }

  const checkDuplicateBoss = async (bossName: string, channel: string): Promise<boolean> => {
    try {
      const q = query(
        collection(db, 'bossSpawns'),
        where('name', '==', bossName),
        where('channel', '==', channel),
        where('status', '==', 'pending')
      )

      const snapshot = await getDocs(q)
      return !snapshot.empty
    } catch (error) {
      console.error('Error checking duplicate boss:', error)
      return false // Em caso de erro, permite adicionar
    }
  }

  const handleEditBoss = async (updatedBoss: Boss) => {
    if (!user) {
      toast.error('Você precisa estar logado para editar um boss.')
      return
    }

    if (!updatedBoss.name || !updatedBoss.channel) {
      toast.error('Nome do boss e canal são obrigatórios.')
      return
    }

    try {
      const bossRef = doc(db, 'bossSpawns', updatedBoss.id)
      const bossDoc = await getDoc(bossRef)
      
      if (!bossDoc.exists()) {
        toast.error('Boss não encontrado.')
        return
      }

      // Verificar se o usuário tem permissão para editar
      const bossData = bossDoc.data() as Boss
      if (!isAdmin && bossData.userId !== user.uid) {
        toast.error('Você não tem permissão para editar este boss.')
        return
      }

      // Verificar duplicatas (exceto o próprio boss)
      const isDuplicate = await checkDuplicateBoss(updatedBoss.name, updatedBoss.channel)
      if (isDuplicate && bossData.channel !== updatedBoss.channel) {
        toast.error(`Já existe um boss card pendente para ${updatedBoss.name} no ${updatedBoss.channel}.`)
        return
      }

      // Se chegou aqui, não há duplicata ou o canal não foi alterado
      const updateData = {
        ...updatedBoss,
        lastUpdated: serverTimestamp(),
        lastModifiedBy: user.uid
      }

      await setDoc(bossRef, updateData, { merge: true })
      toast.success('Boss atualizado com sucesso!')
    } catch (error) {
      console.error('Error editing boss:', error)
      toast.error('Erro ao atualizar o boss. Tente novamente.')
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Painel Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-6">
          <Button
            onClick={() => setShowUsers(!showUsers)}
            className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
          >
            <Users className="h-4 w-4" />
            Usuários
            {showUsers ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
          <Button
            onClick={() => setShowBossTracker(!showBossTracker)}
            className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
          >
            <Timer className="h-4 w-4" />
            Boss Tracker
            {showBossTracker ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
          <Button
            onClick={() => setShowAllBosses(!showAllBosses)}
            className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
          >
            <ListChecks className="h-4 w-4" />
            Todos os Bosses
            {showAllBosses ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
          <Button
            className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).openBossDropsModal) {
                (window as any).openBossDropsModal()
              }
            }}
          >
            <Swords className="h-4 w-4" />
            Drops dos Bosses
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
          <Button
            className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).openBossStatusModal) {
                (window as any).openBossStatusModal()
              }
            }}
          >
            <Shield className="h-4 w-4" />
            Status dos Bosses
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Conteúdo */}
        {showUsers && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Usuários</h3>
            </div>
            {users.map((userItem) => (
              <div key={userItem.uid} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <p className="font-medium">{userItem.email}</p>
                  <p className="text-sm text-muted-foreground">Cargo: {userItem.role || 'user'}</p>
                </div>
                <div className="flex gap-2">
                  <Dialog 
                    open={openChangeRole && selectedUser?.uid === userItem.uid} 
                    onOpenChange={(open) => {
                      setOpenChangeRole(open)
                      if (!open) setSelectedUser(null)
                    }}
                  >
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
                              onClick={() => setSelectedUser(userItem)}
                            >
                              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </Button>
                          </DialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Alterar cargo do usuário</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Alterar cargo do usuário</DialogTitle>
                        <DialogDescription>
                          Tem certeza que deseja alterar o cargo de <span className="font-medium text-primary">{userItem.email}</span> de {userItem.role || 'user'} para {userItem.role === 'admin' ? 'user' : 'admin'}?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setOpenChangeRole(false)
                          setSelectedUser(null)
                        }}>
                          Cancelar
                        </Button>
                        <Button onClick={() => {
                          toggleUserRole(userItem.uid, userItem.role || 'user')
                          setOpenChangeRole(false)
                          setSelectedUser(null)
                        }}>
                          Confirmar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog 
                    open={openRemoveUser && selectedUser?.uid === userItem.uid}
                    onOpenChange={(open) => {
                      setOpenRemoveUser(open)
                      if (!open) setSelectedUser(null)
                    }}
                  >
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-red-100 dark:hover:bg-red-900/30"
                              onClick={() => setSelectedUser(userItem)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </DialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Remover usuário</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Remover usuário</DialogTitle>
                        <DialogDescription>
                          Tem certeza que deseja remover o usuário <span className="font-medium text-primary">{userItem.email}</span>?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setOpenRemoveUser(false)
                          setSelectedUser(null)
                        }}>
                          Cancelar
                        </Button>
                        <Button variant="destructive" onClick={() => {
                          deleteUser(userItem.uid)
                          setOpenRemoveUser(false)
                          setSelectedUser(null)
                        }}>
                          Remover
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {showBossTracker && (
          <div className="mt-4">
            <BossTracker />
          </div>
        )}

        {showAllBosses && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Bosses Detectados</h3>
                <p className="text-sm text-muted-foreground">{allBosses.length} {allBosses.length === 1 ? 'boss encontrado' : 'bosses encontrados'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Ordenar por:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSort('time')}
                  className={cn(
                    "flex items-center gap-1",
                    sortBy === 'time' && "bg-orange-500/10 hover:bg-orange-500/20 text-orange-500"
                  )}
                >
                  Tempo
                  {sortBy === 'time' && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className={cn(
                    "flex items-center gap-1",
                    sortBy === 'name' && "bg-orange-500/10 hover:bg-orange-500/20 text-orange-500"
                  )}
                >
                  Nome
                  {sortBy === 'name' && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSort('channel')}
                  className={cn(
                    "flex items-center gap-1",
                    sortBy === 'channel' && "bg-orange-500/10 hover:bg-orange-500/20 text-orange-500"
                  )}
                >
                  Canal
                  {sortBy === 'channel' && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {allBosses.map((boss) => (
                <BossCard
                  key={boss.id}
                  boss={boss}
                  onUpdateStatus={handleUpdateStatus}
                  onRemove={handleRemove}
                  onEdit={handleEditBoss}
                />
              ))}
            </div>
          </div>
        )}

        <BossDrops />
        <BossStatus />
      </CardContent>
    </Card>
  )
}
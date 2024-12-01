"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { collection, setDoc, doc, onSnapshot, updateDoc, query, where, getDoc, serverTimestamp, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { Boss } from '@/app/types/boss' 
import { findBossByText, extractTimeFromText, extractChannelFromText } from '@/app/utils/textProcessing'
import { bossData } from '@/app/data/bossData' 
import { bossRespawnData } from '@/app/data/bossRespawnData'
import ImageDropzone from './ImageDropzone'
import BossCard from './BossCard'
import BossConfirmation from './BossConfirmation'
import { addHours, addMinutes, subMinutes } from 'date-fns'
import { differenceInHours, differenceInMinutes } from 'date-fns'
import { initializeOCRWorker, processImage } from '@/app/utils/ocrProcessor'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

const BossTracker: React.FC = () => {
  const [bosses, setBosses] = useState<Boss[]>([])
  const [pendingBoss, setPendingBoss] = useState<Boss | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [sortBy, setSortBy] = useState<'time' | 'name' | 'channel'>('time')
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // Query para todos os bosses exceto os deletados, killed e noshow
    const q = query(
      collection(db, 'bossSpawns'),
      where('status', '==', 'pending')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
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

      setBosses(sortedBosses)
    })

    return () => unsubscribe()
  }, [user, sortOrder, sortBy])

  const handleSort = (newSortBy: 'time' | 'name' | 'channel') => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('asc')
    }
  }

  const calculateSpawnTime = (hours: number, minutes: number): Date => {
    const now = new Date()
    let spawnTime = addHours(now, hours)
    spawnTime = addMinutes(spawnTime, minutes)
    return subMinutes(spawnTime, 5)
  }

  const processBossInfo = async (text: string, image?: any): Promise<Boss | null> => {
    logger.debug('BossTracker', 'Processing text', { text })
    
    const bossInfo = await findBossByText(text, image, bossData)
    if (!bossInfo) {
      logger.warn('BossTracker', 'No boss found in text')
      return null
    }

    const timeInfo = extractTimeFromText(text)
    if (!timeInfo) {
      logger.warn('BossTracker', 'No time information found')
      return null
    }

    const channel = extractChannelFromText(text)
    logger.debug('BossTracker', 'Channel found', { channel })

    const spawnTime = calculateSpawnTime(timeInfo.hours, timeInfo.minutes)
    logger.debug('BossTracker', 'Calculated spawn time', { spawnTime })

    return {
      id: `boss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: bossInfo.name,
      spawnMap: bossInfo.spawnMap,
      channel: channel ? `Channel ${channel}` : 'Unknown',
      appearanceStatus: 'pending',
      capturedTime: `${timeInfo.hours}h ${timeInfo.minutes}m`,
      spawnTime: spawnTime.toISOString(), // Convert to ISO string for Firestore
      status: 'pending'
    }
  }

  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast.error('Você precisa estar logado para adicionar um boss.')
      return
    }

    setIsProcessing(true)
    try {
      const worker = await initializeOCRWorker()
      logger.info('BossTracker', 'Tesseract worker initialized')

      for (const file of acceptedFiles) {
        try {
          logger.debug('BossTracker', 'Processing file', { fileName: file.name })
          const text = await processImage(file, worker)
          logger.debug('BossTracker', 'OCR result', { text })
          
          const bossInfo = await processBossInfo(text, file)
          if (bossInfo) {
            logger.debug('BossTracker', 'Boss info extracted', { bossInfo })
            setPendingBoss(bossInfo)
          } else {
            logger.warn('BossTracker', 'No boss info found in image', { fileName: file.name })
            toast.error(`Nenhuma informação de boss encontrada na imagem ${file.name}`)
          }
        } catch (error) {
          logger.error('BossTracker', 'Error processing image', { error, fileName: file.name })
          toast.error(`Erro ao processar imagem ${file.name}. Tente novamente.`)
        }
      }

      await worker.terminate()
      logger.info('BossTracker', 'Tesseract worker terminated')
    } catch (error) {
      logger.error('BossTracker', 'Error creating Tesseract worker', { error })
      toast.error('Erro ao iniciar o processamento de imagens. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }, [processBossInfo, user])

  const checkBossRespawnTime = async (bossName: string, channel: string): Promise<{ canSpawn: boolean; message?: string }> => {
    try {
      const respawnInfo = bossRespawnData[bossName]
      if (!respawnInfo) return { canSpawn: true } // Se o boss não está na lista de respawn, permite adicionar

      // Primeiro, buscar todos os registros do mesmo boss no mesmo canal que foram mortos
      const q = query(
        collection(db, 'bossSpawns'),
        where('name', '==', bossName),
        where('channel', '==', channel),
        where('status', '==', 'killed')
      )

      const snapshot = await getDocs(q)
      if (snapshot.empty) return { canSpawn: true }

      // Encontrar o registro mais recente localmente
      const sortedDocs = snapshot.docs
        .map(doc => ({

          ...doc.data(),
          spawnTime: doc.data().spawnTime,
        }))
        .sort((a, b) => new Date(b.spawnTime).getTime() - new Date(a.spawnTime).getTime())

      if (sortedDocs.length === 0) return { canSpawn: true }

      // Usar o horário de spawn + 5 minutos como referência
      const lastSpawnTime = new Date(sortedDocs[0].spawnTime)
      const lastKillTime = addMinutes(lastSpawnTime, 5) // Adiciona 5 minutos ao horário de spawn
      const now = new Date()
      const hoursSinceKill = differenceInHours(now, lastKillTime)
      const minutesSinceKill = differenceInMinutes(now, lastKillTime) % 60

      // Calcula o tempo até poder adicionar (6 horas antes do tempo mínimo)
      const earlyAddHours = respawnInfo.minHours - 6
      const hoursUntilEarlyAdd = earlyAddHours - hoursSinceKill

      if (hoursSinceKill < earlyAddHours) {
        return {
          canSpawn: true, // Permite adicionar mesmo que falte tempo
          message: `Este boss foi morto há ${hoursSinceKill}h ${minutesSinceKill}m. Tempo mínimo de respawn: ${respawnInfo.minHours}h. Faltam ${hoursUntilEarlyAdd}h para o tempo mínimo.`
        }
      }

      if (hoursSinceKill < respawnInfo.maxHours) {
        return {
          canSpawn: true,
          message: `Atenção: Este boss foi morto há ${hoursSinceKill}h ${minutesSinceKill}m. Tempo de respawn: ${respawnInfo.minHours}h ~ ${respawnInfo.maxHours}h.`
        }
      }

      return { canSpawn: true }
    } catch (error) {
      logger.error('BossTracker', 'Error checking boss respawn time', { error })
      return { canSpawn: true } // Em caso de erro, permite adicionar
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
      logger.error('BossTracker', 'Error checking duplicate boss', { error })
      return false // Em caso de erro, permite adicionar
    }
  }

  const confirmBoss = async (updatedBoss: Boss) => {
    if (!user) {
      toast.error('Você precisa estar logado para adicionar um boss.')
      return
    }

    if (updatedBoss && updatedBoss.name && updatedBoss.channel) {
      try {
        // Verificar duplicatas
        const isDuplicate = await checkDuplicateBoss(updatedBoss.name, updatedBoss.channel)
        if (isDuplicate) {
          toast.error(`Já existe um boss card pendente para ${updatedBoss.name} no ${updatedBoss.channel}.`)
          return
        }

        // Verificar tempo de respawn
        const respawnCheck = await checkBossRespawnTime(updatedBoss.name, updatedBoss.channel)
        if (!respawnCheck.canSpawn) {
          if (respawnCheck.message) {
            toast.error(respawnCheck.message)
          } else {
            toast.error('Não é possível adicionar o boss neste momento.')
          }
          return
        }

        if (respawnCheck.message) {
          toast(respawnCheck.message, {
            icon: '⚠️',
            duration: 6000
          })
        }

        const newBoss = {
          ...updatedBoss,
          userId: user.uid,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        }

        // Usar setDoc com o ID gerado localmente
        const bossRef = doc(db, 'bossSpawns', updatedBoss.id)
        await setDoc(bossRef, newBoss)
        
        setPendingBoss(null)
        toast.success(`Boss ${updatedBoss.name} adicionado à lista.`)
      } catch (error) {
        logger.error('BossTracker', 'Error saving boss data', { error })
        toast.error('Erro ao salvar dados do boss. Tente novamente.')
      }
    } else {
      toast.error('Dados do boss inválidos ou incompletos.')
    }
  }

  const rejectBoss = () => {
    setPendingBoss(null);
    toast('Boss rejeitado.', {
      icon: '🚫',
      duration: 5000      
    });
  };

  const handleUpdateStatus = async (id: string, status: 'killed' | 'noshow') => {
    logger.debug('BossTracker', 'handleUpdateStatus called', { id, status })
    
    if (!user) {
      logger.warn('BossTracker', 'No user found')
      toast.error('Você precisa estar logado para realizar esta ação.')
      return
    }

    try {
      const bossRef = doc(db, 'bossSpawns', id)
      const bossDoc = await getDoc(bossRef)
      
      if (!bossDoc.exists()) {
        logger.warn('BossTracker', 'Boss not found')
        toast.error('Boss não encontrado.')
        return
      }

      // Verificar se o usuário tem permissão para atualizar
      const bossData = bossDoc.data()
      if (bossData.userId !== user.uid) {
        logger.warn('BossTracker', 'User does not have permission', { userId: user.uid, bossUserId: bossData.userId })
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
          const action = status === 'killed' ? 'morto' : 'como não apareceu'
          toast.error(`Não é possível marcar o boss como ${action} antes do horário de spawn. Faltam ${hours}h ${minutes}m para o nascimento.`)
          return
        }
      }

      logger.debug('BossTracker', 'Updating boss status', { id, status })
      await updateDoc(bossRef, {
        status,
        appearanceStatus: status,
        lastUpdated: serverTimestamp()
      })

      logger.info('BossTracker', 'Boss status updated successfully')
      toast.success(status === 'killed' ? 'Boss marcado como morto!' : 'Boss marcado como não aparecido!')
    } catch (error) {
      logger.error('BossTracker', 'Error updating boss status', { error })
      toast.error('Erro ao atualizar o status do boss.')
    }
  }

  const handleRemoveBoss = async (id: string) => {
    logger.debug('BossTracker', 'handleRemoveBoss called', { id })
    
    if (!user) {
      logger.warn('BossTracker', 'No user found')
      toast.error('Você precisa estar logado para realizar esta ação.')
      return
    }

    try {
      const bossRef = doc(db, 'bossSpawns', id)
      const bossDoc = await getDoc(bossRef)
      
      if (!bossDoc.exists()) {
        logger.warn('BossTracker', 'Boss not found')
        toast.error('Boss não encontrado.')
        return
      }

      // Verificar se o usuário tem permissão para remover
      const bossData = bossDoc.data()
      if (bossData.userId !== user.uid) {
        logger.warn('BossTracker', 'User does not have permission', { userId: user.uid, bossUserId: bossData.userId })
        toast.error('Você não tem permissão para remover este boss.')
        return
      }

      logger.debug('BossTracker', 'Marking boss as deleted', { id })
      await updateDoc(bossRef, {
        status: 'deleted',
        appearanceStatus: 'deleted',
        lastUpdated: serverTimestamp()
      })

      logger.info('BossTracker', 'Boss marked as deleted successfully')
      toast.success('Boss removido com sucesso.')
    } catch (error) {
      logger.error('BossTracker', 'Error removing boss', { error })
      toast.error('Erro ao remover o boss.')
    }
  }

  const handleEditBoss = async (updatedBoss: Boss) => {
    logger.debug('BossTracker', 'handleEditBoss called', { updatedBoss })
    if (!user) {
      toast.error('Você precisa estar logado para editar um boss.')
      return
    }

    if (!updatedBoss.name || !updatedBoss.channel) {
      toast.error('Nome do boss e canal são obrigatórios.')
      return
    }

    try {
      // Verificar se o boss existe
      const bossRef = doc(db, 'bossSpawns', updatedBoss.id)
      const bossDoc = await getDoc(bossRef)
      
      if (!bossDoc.exists()) {
        toast.error('Boss não encontrado.')
        return
      }

      const currentBoss = bossDoc.data() as Boss

      // Verificar duplicatas (exceto o próprio boss)
      const isDuplicate = await checkDuplicateBoss(updatedBoss.name, updatedBoss.channel)
      if (isDuplicate && currentBoss.channel !== updatedBoss.channel) {
        toast.error(`Já existe um boss card pendente para ${updatedBoss.name} no ${updatedBoss.channel}.`)
        return
      }

      const updateData = {
        ...updatedBoss,
        lastUpdated: serverTimestamp(),
        lastModifiedBy: user.uid,
        status: updatedBoss.status || 'pending'
      }

      logger.debug('BossTracker', 'Updating boss', { updateData })
      await setDoc(bossRef, updateData, { merge: true })
      logger.info('BossTracker', 'Boss updated successfully')
      toast.success('Boss atualizado com sucesso!')
    } catch (error) {
      logger.error('BossTracker', 'Error updating boss', { error })
      toast.error('Erro ao atualizar o boss. Tente novamente.')
    }
  }

  const pasteImage = React.useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (items) {
      for (let i = 0; i <items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile()
          if (blob) {
            logger.debug('BossTracker', 'Image pasted, processing...')
            onDrop([blob])
          }
        }
      }
    }
  }, [onDrop])

  useEffect(() => {
    document.addEventListener('paste', pasteImage)
    return () => {
      document.removeEventListener('paste', pasteImage)
    }
  }, [pasteImage])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Boss Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Adicionar um Novo Boss</h3>
              <p className="text-sm text-muted-foreground mb-4">Arraste uma screenshot ou cole uma imagem (Ctrl+V)</p>
              
              <ImageDropzone
                onDrop={onDrop}
                isProcessing={isProcessing}
              />
            </div>

            {pendingBoss && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Confirmar Informações do Boss</h3>
                  <p className="text-sm text-muted-foreground">Verifique as informações do boss antes de confirmar</p>
                </div>
                <BossConfirmation
                  boss={pendingBoss}
                  onConfirm={confirmBoss}
                  onReject={rejectBoss}
                />
              </div>
            )}

            {bosses.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Bosses Detectados</h3>
                    <p className="text-sm text-muted-foreground">{bosses.length} {bosses.length === 1 ? 'boss encontrado' : 'bosses encontrados'}</p>
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
                  {bosses.map((boss) => (
                    <BossCard
                      key={boss.id}
                      boss={boss}
                      onRemove={handleRemoveBoss}
                      onUpdateStatus={handleUpdateStatus}
                      onEdit={handleEditBoss}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BossTracker
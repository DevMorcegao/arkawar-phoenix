"use client"

import React, { useState, useEffect } from 'react'
import { collection, setDoc, doc, onSnapshot, updateDoc, query, where, getDoc, serverTimestamp, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { Boss } from '@/app/types/boss' 
import { findBossByText, extractTimeFromText, extractChannelFromText } from '@/app/utils/textProcessing'
import { bossData } from '@/app/data/bossData' 
import { bossRespawnData } from '@/app/data/bossRespawnData'
import ImageDropzone from './ImageDropzone'
import BossList from './BossList'
import BossConfirmation from './BossConfirmation'
import { addHours, addMinutes, subMinutes } from 'date-fns'
import { differenceInHours, differenceInMinutes } from 'date-fns'
import { initializeOCRWorker, processImage } from '@/app/utils/ocrProcessor'
import { SectionHeader } from '@/components/ui/section-header'

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
          const nameA = a.name.toLowerCase()
          const nameB = b.name.toLowerCase()
          return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
        } else { // channel
          const channelA = a.channel ? parseInt(a.channel) : 0
          const channelB = b.channel ? parseInt(b.channel) : 0
          return sortOrder === 'asc' ? channelA - channelB : channelB - channelA
        }
      })

      setBosses(sortedBosses)
    })

    return () => unsubscribe()
  }, [user, sortOrder, sortBy])

  const calculateSpawnTime = (hours: number, minutes: number): Date => {
    const now = new Date()
    let spawnTime = addHours(now, hours)
    spawnTime = addMinutes(spawnTime, minutes)
    return subMinutes(spawnTime, 5)
  }

  const processBossInfo = async (text: string, image?: any): Promise<Boss | null> => {
    console.log('Processing text:', text)
    
    const bossInfo = await findBossByText(text, image, bossData)
    if (!bossInfo) {
      console.log('No boss found in text')
      return null
    }
  
    const timeInfo = extractTimeFromText(text)
    if (!timeInfo) {
      console.log('No time information found')
      return null
    }
  
    const channel = extractChannelFromText(text)
    console.log('Channel found:', channel)
  
    const spawnTime = calculateSpawnTime(timeInfo.hours, timeInfo.minutes)
    console.log('Calculated spawn time:', spawnTime)
  
    return {
      id: `boss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: bossInfo.name,
      spawnMap: bossInfo.spawnMap,
      channel: channel ? `Channel ${channel}` : 'Unknown',
      appearanceStatus: `${timeInfo.hours}h ${timeInfo.minutes}m`,
      spawnTime: spawnTime.toISOString(), // Convert to ISO string for Firestore
      status: 'pending'
    }
  }

  const handleSort = (newSortBy: 'time' | 'name' | 'channel') => {
    if (newSortBy === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('asc')
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
      console.log('Tesseract worker initialized')

      for (const file of acceptedFiles) {
        try {
          console.log(`Processing file: ${file.name}`)
          const text = await processImage(file, worker)
          console.log('OCR result:', text)
          
          const bossInfo = await processBossInfo(text, file)
          if (bossInfo) {
            console.log('Boss info extracted:', bossInfo)
            setPendingBoss(bossInfo)
          } else {
            console.log('No boss info found in the image')
            toast.error(`Nenhuma informação de boss encontrada na imagem ${file.name}`)
          }
        } catch (error) {
          console.error('Error processing image:', error)
          toast.error(`Erro ao processar imagem ${file.name}. Tente novamente.`)
        }
      }

      await worker.terminate()
      console.log('Tesseract worker terminated')
    } catch (error) {
      console.error('Error creating Tesseract worker:', error)
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

      if (hoursSinceKill < respawnInfo.minHours) {
        const hoursRemaining = respawnInfo.minHours - hoursSinceKill - 1
        const minutesRemaining = 60 - minutesSinceKill
        
        return {
          canSpawn: false,
          message: `Este boss foi morto há ${hoursSinceKill}h ${minutesSinceKill}m. Tempo mínimo de respawn: ${respawnInfo.minHours}h. Faltam ${hoursRemaining}h ${minutesRemaining}m para poder adicionar.`
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
      console.error('Error checking boss respawn time:', error)
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
      console.error('Error checking duplicate boss:', error)
      return false // Em caso de erro, permite adicionar
    }
  }

  const confirmBoss = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para adicionar um boss.')
      return
    }

    if (pendingBoss && pendingBoss.name && pendingBoss.channel) {
      try {
        // Verificar duplicatas
        const isDuplicate = await checkDuplicateBoss(pendingBoss.name, pendingBoss.channel)
        if (isDuplicate) {
          toast.error(`Já existe um boss card pendente para ${pendingBoss.name} no ${pendingBoss.channel}.`)
          return
        }

        // Verificar tempo de respawn
        const respawnCheck = await checkBossRespawnTime(pendingBoss.name, pendingBoss.channel)
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
          ...pendingBoss,
          userId: user.uid,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        }

        // Usar setDoc com o ID gerado localmente
        const bossRef = doc(db, 'bossSpawns', pendingBoss.id)
        await setDoc(bossRef, newBoss)
        
        setPendingBoss(null)
        toast.success(`Boss ${pendingBoss.name} adicionado à lista.`)
      } catch (error) {
        console.error('Error saving boss data:', error)
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
    console.log('BossTracker: handleUpdateStatus called', { id, status })
    
    if (!user) {
      console.log('BossTracker: No user found')
      toast.error('Você precisa estar logado para realizar esta ação.')
      return
    }

    try {
      const bossRef = doc(db, 'bossSpawns', id)
      const bossDoc = await getDoc(bossRef)
      
      if (!bossDoc.exists()) {
        console.log('BossTracker: Boss not found')
        toast.error('Boss não encontrado.')
        return
      }

      // Verificar se o usuário tem permissão para atualizar
      const bossData = bossDoc.data()
      if (bossData.userId !== user.uid) {
        console.log('BossTracker: User does not have permission', { userId: user.uid, bossUserId: bossData.userId })
        toast.error('Você não tem permissão para atualizar este boss.')
        return
      }

      console.log('BossTracker: Updating boss status', { id, status })
      await updateDoc(bossRef, {
        status,
        lastUpdated: serverTimestamp()
      })

      // Atualizar o estado local imediatamente
      setBosses(prevBosses => prevBosses.filter(boss => boss.id !== id))

      console.log('BossTracker: Boss status updated successfully')
      // Removido o toast daqui pois já é mostrado no BossCard
    } catch (error) {
      console.error('BossTracker: Error updating boss status:', error)
      toast.error('Erro ao atualizar o status do boss.')
    }
  }

  const handleRemoveBoss = async (id: string) => {
    console.log('BossTracker: handleRemoveBoss called', { id })
    
    if (!user) {
      console.log('BossTracker: No user found')
      toast.error('Você precisa estar logado para realizar esta ação.')
      return
    }

    try {
      const bossRef = doc(db, 'bossSpawns', id)
      const bossDoc = await getDoc(bossRef)
      
      if (!bossDoc.exists()) {
        console.log('BossTracker: Boss not found')
        toast.error('Boss não encontrado.')
        return
      }

      // Verificar se o usuário tem permissão para remover
      const bossData = bossDoc.data()
      if (bossData.userId !== user.uid) {
        console.log('BossTracker: User does not have permission', { userId: user.uid, bossUserId: bossData.userId })
        toast.error('Você não tem permissão para remover este boss.')
        return
      }

      console.log('BossTracker: Marking boss as deleted', { id })
      await updateDoc(bossRef, {
        status: 'deleted',
        lastUpdated: serverTimestamp()
      })

      // Atualizar o estado local imediatamente
      setBosses(prevBosses => prevBosses.filter(boss => boss.id !== id))

      console.log('BossTracker: Boss marked as deleted successfully')
      toast.success('Boss removido com sucesso.')
    } catch (error) {
      console.error('BossTracker: Error removing boss:', error)
      toast.error('Erro ao remover o boss.')
    }
  }

  const pasteImage = React.useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile()
          if (blob) {
            console.log('Image pasted, processing...')
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
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Boss Tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <SectionHeader
              title="Adicionar um Novo Boss"
              description="Arraste uma screenshot ou cole uma imagem (Ctrl+V)"
              variant="default"
            />
            <ImageDropzone onDrop={onDrop} isProcessing={isProcessing} />
          </div>

          {pendingBoss && (
            <div>
              <SectionHeader
                title="Confirmar Informações do Boss"
                description="Verifique as informações do boss antes de confirmar"
                variant="default"
              />
              <BossConfirmation
                boss={pendingBoss}
                onConfirm={confirmBoss}
                onReject={rejectBoss}
              />
            </div>
          )}

          <BossList
            bosses={bosses}
            onSort={handleSort}
            onRemove={handleRemoveBoss}
            onUpdateStatus={handleUpdateStatus}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default BossTracker
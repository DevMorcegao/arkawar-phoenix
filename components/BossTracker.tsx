/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
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
import AddBossButton from './AddBossButton'
import { addHours, addMinutes, subMinutes, differenceInMinutes } from 'date-fns'
import { initializeOCRWorker, processImage } from '@/app/utils/ocrProcessor'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { logBossAction } from '@/lib/logActions'
import { monitoringService } from '../lib/services/monitoringService'

const BossTracker: React.FC = () => {
  const [bosses, setBosses] = useState<Boss[]>([])
  const [pendingBoss, setPendingBoss] = useState<Boss | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [sortBy, setSortBy] = useState<'time' | 'name' | 'channel'>('time')
  const { user } = useAuth()

  // Cache local de bosses pendentes
  const [pendingBossesCache, setPendingBossesCache] = useState<{[key: string]: boolean}>({});

  // Função para ordenar os bosses
  const sortBosses = useCallback((bossesToSort: Boss[]) => {
    return [...bossesToSort].sort((a, b) => {
      if (sortBy === 'time') {
        const timeA = new Date(a.spawnTime).getTime();
        const timeB = new Date(b.spawnTime).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      } else if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        const channelA = parseInt((a.channel || 'Channel 0').replace(/\D/g, '')) || 0;
        const channelB = parseInt((b.channel || 'Channel 0').replace(/\D/g, '')) || 0;
        return sortOrder === 'asc' ? channelA - channelB : channelB - channelA;
      }
    });
  }, [sortBy, sortOrder]);

  useEffect(() => {
    if (!user) return;

    logger.info('BossTracker', '🎧 Iniciando listener principal de bosses pendentes');

    // Calcular timestamp de 48 horas atrás
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    // Query para todos os bosses das últimas 48 horas
    const q = query(
      collection(db, 'bossSpawns'),
      where('lastUpdated', '>=', fortyEightHoursAgo),
      orderBy('lastUpdated', 'desc')
    );
    
    let lastUpdate = Date.now();
    const THROTTLE_TIME = 100;

    // Carregar dados iniciais
    getDocs(q).then((snapshot) => {
      const initialBosses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || null,
        createdAt: doc.data().createdAt?.toDate() || null
      } as Boss));

      // Filtrar apenas os bosses pendentes para o estado
      const pendingBosses = initialBosses.filter(boss => boss.status === 'pending');
      setBosses(sortBosses(pendingBosses));
      
      // Atualizar cache local
      const newCache: {[key: string]: boolean} = {};
      pendingBosses.forEach(boss => {
        newCache[`${boss.name}-${boss.channel}`] = true;
      });
      setPendingBossesCache(newCache);
    });

    // Configurar listener para atualizações
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      if (now - lastUpdate < THROTTLE_TIME) {
        return;
      }
      lastUpdate = now;

      monitoringService.trackListenerUpdate('BossTracker');
      logger.info('BossTracker', '📥 Dados recebidos do listener principal', {
        totalDocs: snapshot.docs.length,
        changes: snapshot.docChanges().map(change => ({
          type: change.type,
          docId: change.doc.id
        }))
      });

      const updatedBosses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || null,
        createdAt: doc.data().createdAt?.toDate() || null
      } as Boss));

      // Atualizar cache local e estado em uma única operação
      const newCache: {[key: string]: boolean} = {};
      const pendingBosses = updatedBosses.filter(boss => boss.status === 'pending');
      pendingBosses.forEach(boss => {
        newCache[`${boss.name}-${boss.channel}`] = true;
      });

      setPendingBossesCache(newCache);
      setBosses(sortBosses(pendingBosses));
    }, (error) => {
      logger.error('BossTracker', '❌ Erro no listener principal', { error });
    });

    return () => {
      logger.info('BossTracker', '🛑 Desativando listener principal');
      unsubscribe();
    };
  }, [user, sortBosses]);

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
      spawnTime: spawnTime.toISOString(), // Converte para string ISO para o Firestore
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

  const checkDuplicateBoss = async (bossName: string, channel: string): Promise<boolean> => {
    logger.info('BossTracker', '🔍 Verificando duplicata no cache e no Firestore', {
      boss: bossName,
      channel: channel
    });

    // Primeiro, verificar no cache local
    const cacheKey = `${bossName}-${channel}`;
    if (pendingBossesCache[cacheKey]) {
      logger.debug('BossTracker', 'Duplicata encontrada no cache local', {
        boss: bossName,
        channel: channel
      });
      return true;
    }

    // Se não encontrou no cache, verificar no Firestore
    const q = query(
      collection(db, 'bossSpawns'),
      where('name', '==', bossName),
      where('channel', '==', channel),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    const isDuplicate = !snapshot.empty;

    if (isDuplicate) {
      logger.debug('BossTracker', 'Duplicata encontrada no Firestore', {
        boss: bossName,
        channel: channel,
        count: snapshot.size
      });
      
      // Atualizar o cache local se encontrou no Firestore
      setPendingBossesCache(prev => ({
        ...prev,
        [cacheKey]: true
      }));
    }

    return isDuplicate;
  };

  const checkBossRespawnTime = async (bossName: string, channel: string): Promise<{ canSpawn: boolean; message?: string }> => {
    try {
      const respawnInfo = bossRespawnData[bossName]
      if (!respawnInfo) {
        logger.debug('BossTracker', 'Boss não encontrado na lista de respawn', { bossName });
        return { canSpawn: true }
      }

      logger.info('BossTracker', '🔍 Buscando último kill do boss', {
        boss: bossName,
        channel: channel
      });

      // Buscar apenas o boss mais recente no mesmo canal que foi morto
      const q = query(
        collection(db, 'bossSpawns'),
        where('name', '==', bossName),
        where('channel', '==', channel),
        where('status', '==', 'killed'),
        orderBy('spawnTime', 'desc'),
        limit(1)
      )

      let snapshot;
      try {
        snapshot = await getDocs(q);
        monitoringService.trackQuery('BossTracker');
        logger.info('BossTracker', '📊 Resultado da busca de último kill', {
          boss: bossName,
          channel: channel,
          encontrado: !snapshot.empty
        });
      } catch (queryError: any) {
        const errorDetails = {
          code: queryError?.code,
          message: queryError?.message || 'Erro desconhecido',
          bossName,
          channel
        };
        logger.error('BossTracker', 'Erro ao consultar o Firestore', errorDetails);
        return { canSpawn: true };
      }

      if (snapshot.empty) {
        logger.debug('BossTracker', 'Nenhum registro anterior encontrado', { bossName, channel });
        return { canSpawn: true }
      }

      const killedBoss = snapshot.docs[0].data()
      if (!killedBoss.spawnTime) {
        logger.warn('BossTracker', 'Boss encontrado sem spawnTime', { killedBoss });
        return { canSpawn: true }
      }

      const lastSpawnTime = new Date(killedBoss.spawnTime)
      // Usar o spawnTime diretamente como lastKillTime
      const lastKillTime = lastSpawnTime
      const now = new Date()

      // Se o lastKillTime estiver no futuro, considerar como se fosse agora
      const effectiveKillTime = lastKillTime > now ? now : lastKillTime
      const minutesSinceKill = differenceInMinutes(now, effectiveKillTime)
      const hoursSinceKill = minutesSinceKill / 60

      logger.debug('BossTracker', 'Verificação de tempo de respawn', {
        bossName,
        channel,
        lastKillTime: lastKillTime.toISOString(),
        effectiveKillTime: effectiveKillTime.toISOString(),
        minutesSinceKill,
        hoursSinceKill,
        minHours: respawnInfo.minHours
      });

      // Apenas informar quanto tempo falta, mas permitir a adição
      if (hoursSinceKill < respawnInfo.minHours) {
        const remainingHours = respawnInfo.minHours - hoursSinceKill
        const remainingMinutes = Math.ceil(remainingHours * 60)
        return {
          canSpawn: true,
          message: `Atenção: O tempo normal de respawn do ${bossName} é ${respawnInfo.minHours}h. Ainda faltam ${Math.floor(remainingHours)}h ${remainingMinutes % 60}m.`
        }
      }

      return { canSpawn: true }
    } catch (error) {
      logger.error('BossTracker', 'Erro ao verificar tempo de respawn', { error, bossName, channel });
      return { canSpawn: true }
    }
  }

  const confirmBoss = async (updatedBoss: Boss) => {
    if (!user) {
      toast.error('Você precisa estar logado para adicionar um boss.')
      return
    }

    if (updatedBoss && updatedBoss.name && updatedBoss.channel) {
      try {
        logger.info('BossTracker', '🔍 Iniciando verificação de duplicata', {
          boss: updatedBoss.name,
          channel: updatedBoss.channel
        });

        // Verificar duplicatas usando o cache primeiro
        const cacheKey = `${updatedBoss.name}-${updatedBoss.channel}`;
        if (pendingBossesCache[cacheKey]) {
          toast.error(`Já existe um boss card pendente para ${updatedBoss.name} no ${updatedBoss.channel}.`)
          return
        }

        logger.info('BossTracker', '🔍 Iniciando verificação de respawn', {
          boss: updatedBoss.name,
          channel: updatedBoss.channel
        });

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

        logger.info('BossTracker', '💾 Salvando novo boss', {
          boss: updatedBoss.name,
          channel: updatedBoss.channel,
          id: updatedBoss.id
        });

        const newBoss = {
          ...updatedBoss,
          userId: user.uid,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        }

        // Atualizar o cache local antes de salvar
        setPendingBossesCache(prev => ({
          ...prev,
          [cacheKey]: true
        }));

        // Atualizar a lista de bosses imediatamente
        setBosses(prevBosses => {
          const updatedBoss = {
            ...newBoss,
            lastUpdated: new Date(),
            createdAt: new Date()
          };
          return sortBosses([...prevBosses, updatedBoss]);
        });

        // Salvar no Firestore
        const bossRef = doc(db, 'bossSpawns', updatedBoss.id)
        await setDoc(bossRef, newBoss)

        setPendingBoss(null)
        toast.success(`Boss ${updatedBoss.name} adicionado à lista.`)

        logger.info('BossTracker', ' Boss registrado com sucesso', {
          boss: updatedBoss.name,
          channel: updatedBoss.channel,
          id: updatedBoss.id
        });

        // Adiciona o log da ação
        await logBossAction(
          user.uid,
          user.displayName || user.email || 'Unknown User',
          'added',
          {
            id: updatedBoss.id,
            name: updatedBoss.name,
            channel: updatedBoss.channel
          }
        )

      } catch (error: any) {
        const errorDetails = {
          code: error?.code,
          message: error?.message || 'Erro desconhecido',
          stack: error?.stack,
          bossInfo: {
            name: updatedBoss.name,
            channel: updatedBoss.channel,
            id: updatedBoss.id
          }
        };
        logger.error('BossTracker', 'Erro ao salvar dados do boss', errorDetails);
        toast.error('Erro ao salvar dados do boss. Tente novamente.')
        throw error;
      }
    } else {
      toast.error('Dados do boss inválidos ou incompletos.')
      throw new Error('Dados do boss inválidos ou incompletos');
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
      monitoringService.trackRead('BossTracker');
      
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

      // Adiciona o log da ação
      await logBossAction(
        user.uid,
        user.displayName || user.email || 'Unknown User',
        status === 'killed' ? 'killed' : 'noshow',
        {
          id: id,
          name: bossData.name,
          channel: bossData.channel
        }
      )

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
      monitoringService.trackRead('BossTracker');
      
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

      // Adiciona o log da ação
      await logBossAction(
        user.uid,
        user.displayName || user.email || 'Unknown User',
        'deleted',
        {
          id: id,
          name: bossData.name,
          channel: bossData.channel
        }
      )

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
      monitoringService.trackRead('BossTracker');
      
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

      // Adiciona o log da ação
      const getChangedFields = (oldBoss: Boss, newBoss: Boss) => {
        const changes: {
          field: string;
          oldValue: string;
          newValue: string;
        }[] = [];

        if (oldBoss.name !== newBoss.name) {
          changes.push({
            field: 'name',
            oldValue: oldBoss.name,
            newValue: newBoss.name
          });
        }

        if (oldBoss.channel !== newBoss.channel) {
          changes.push({
            field: 'channel',
            oldValue: oldBoss.channel || '',
            newValue: newBoss.channel || ''
          });
        }

        if (oldBoss.capturedTime !== newBoss.capturedTime) {
          changes.push({
            field: 'capturedTime',
            oldValue: oldBoss.capturedTime || '',
            newValue: newBoss.capturedTime || ''
          });
        }

        return changes;
      };

      const changes = getChangedFields(currentBoss, updatedBoss);

      // Criar um único log com todas as alterações
      await logBossAction(
        user.uid,
        user.displayName || user.email || 'Unknown User',
        'edited',
        {
          id: updatedBoss.id,
          name: updatedBoss.name,
          channel: updatedBoss.channel
        },
        {
          changes // Passamos o array completo de mudanças
        }
      );

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
              
              <div className="space-y-6">
                <ImageDropzone
                  onDrop={onDrop}
                  isProcessing={isProcessing}
                />

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-4 text-muted-foreground font-medium">
                      ou adicione manualmente
                    </span>
                  </div>
                </div>

                <AddBossButton
                  onConfirm={confirmBoss}
                  onReject={rejectBoss}
                />
              </div>
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
                <div className="flex justify-between items-center mb-4 mt-8">
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
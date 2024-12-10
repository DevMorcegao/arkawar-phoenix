"use client"

import React, { useState } from 'react'
import { Plus, X, Check, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import BossConfirmation from './BossConfirmation'
import { Boss } from '@/app/types/boss'
import { bossData } from '@/app/data/bossData'
import { addMinutes } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import toast from 'react-hot-toast'

interface AddBossButtonProps {
  onConfirm: (boss: Boss) => void
  onReject: () => void
}

export default function AddBossButton({ onConfirm, onReject }: AddBossButtonProps) {
  const [pendingBosses, setPendingBosses] = useState<Boss[]>([])
  const [showSummary, setShowSummary] = useState(false)

  const createEmptyBoss = (): Boss => {
    const now = new Date()
    const spawnTime = addMinutes(now, 5)
    
    return {
      id: `boss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: bossData[0].name,
      spawnMap: bossData[0].spawnMap,
      channel: '',
      appearanceStatus: 'pending',
      capturedTime: '0h 0m',
      spawnTime: spawnTime.toISOString(),
      status: 'pending'
    }
  }

  const handleAddClick = () => {
    // Verificar se já existe um boss idêntico na lista
    const newBoss = createEmptyBoss()
    const hasDuplicate = pendingBosses.some(boss => 
      boss.name === newBoss.name && 
      (!boss.channel && !newBoss.channel)
    )

    if (hasDuplicate) {
      toast.error(`Já existe um boss ${newBoss.name} sem canal definido.`)
      return
    }

    setPendingBosses(prev => [...prev, newBoss])
  }

  const handleConfirmSingle = (boss: Boss) => {
    // Verificar se já existe um boss idêntico na lista de pendentes
    const hasDuplicateInPending = pendingBosses.some(b => 
      b.id !== boss.id && 
      b.name === boss.name && 
      (!b.channel && !boss.channel || b.channel === boss.channel)
    )

    if (hasDuplicateInPending) {
      toast.error(`Já existe um boss ${boss.name}${boss.channel ? ` no ${boss.channel}` : ' sem canal definido'}.`)
      return
    }

    // Atualizar o boss na lista de pendentes com o tempo capturado
    setPendingBosses(prev => prev.map(b => b.id === boss.id ? {
      ...boss,
      capturedTime: boss.capturedTime || '0h 0m'
    } : b))
  }

  const handleConfirmAndAdd = (boss: Boss) => {
    // Verificar se o canal é válido
    if (!boss.channel) {
      toast.error('Por favor, insira um canal válido antes de confirmar.')
      return
    }

    onConfirm(boss)
    setPendingBosses(prev => prev.filter(b => b.id !== boss.id))
  }

  const handleRejectSingle = (bossId: string) => {
    setPendingBosses(prev => prev.filter(b => b.id !== bossId))
    if (pendingBosses.length === 1) {
      onReject()
    }
  }

  const handleConfirmAll = () => {
    // Primeiro, verificar duplicatas
    const duplicateGroups = pendingBosses.reduce((acc, boss) => {
      const key = `${boss.name}-${boss.channel || 'sem-canal'}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(boss)
      return acc
    }, {} as Record<string, Boss[]>)

    const duplicates = Object.entries(duplicateGroups)
      .filter(([_, bosses]) => bosses.length > 1)
      .map(([key]) => {
        const [name, channel] = key.split('-')
        return channel === 'sem-canal' 
          ? `${name} (sem canal definido)`
          : `${name} no ${channel}`
      })

    if (duplicates.length > 0) {
      toast.error(`Existem bosses duplicados: ${duplicates.join(', ')}. Por favor, remova as duplicatas antes de confirmar.`)
      return
    }

    // Depois, verificar canais inválidos
    const invalidBosses = pendingBosses.filter(boss => !boss.channel)
    if (invalidBosses.length > 0) {
      const invalidNames = invalidBosses.map(b => b.name).join(', ')
      toast.error(`Os seguintes bosses não têm canal definido: ${invalidNames}`)
      return
    }

    // Se passou nas validações, confirmar todos
    pendingBosses.forEach(boss => {
      // Garantir que o tempo capturado seja mantido
      onConfirm({
        ...boss,
        capturedTime: boss.capturedTime || '0h 0m' // Manter o tempo capturado original
      })
    })
    setPendingBosses([])
    setShowSummary(false)
  }

  const handleRejectAll = () => {
    setPendingBosses([])
    onReject()
  }

  const handleChannelChange = (bossId: string, channel: string | undefined) => {
    // Verificar se já existe um boss com mesmo nome e canal
    const currentBoss = pendingBosses.find(b => b.id === bossId)
    if (currentBoss && channel) {
      const hasDuplicate = pendingBosses.some(b => 
        b.id !== bossId && 
        b.name === currentBoss.name && 
        b.channel === channel
      )

      if (hasDuplicate) {
        toast.error(`Já existe um boss ${currentBoss.name} no ${channel}.`)
        return false
      }
    }
    return true
  }

  const handleBossNameChange = (bossId: string, newName: string) => {
    const currentBoss = pendingBosses.find(b => b.id === bossId)
    const otherBosses = pendingBosses.filter(b => b.id !== bossId)
    
    // Verificar duplicatas apenas se os bosses estiverem no mesmo canal ou ambos sem canal
    const hasDuplicate = otherBosses.some(b => 
      b.name === newName && (
        // Se o boss atual não tem canal, verificar outros sem canal
        (!currentBoss?.channel && !b.channel) ||
        // Se o boss atual tem canal, verificar outros com mesmo canal
        (currentBoss?.channel && b.channel === currentBoss.channel)
      )
    )

    if (hasDuplicate) {
      const duplicateMessage = currentBoss?.channel 
        ? `Já existe um boss ${newName} no ${currentBoss.channel}.`
        : `Já existe um boss ${newName} sem canal definido.`
      toast.error(duplicateMessage)
      return false
    }
    return true
  }

  if (pendingBosses.length > 0) {
    return (
      // "space-y-8" Adiciona um espaço extra entre os botões de "Confirmar Todos" e "Cancelar Todos" em relação a linha de separação
      <div className="space-y-8">
        <div className="flex flex-wrap gap-4">
          {pendingBosses.map(boss => (
            <div key={boss.id} className="flex-1 min-w-[300px] max-w-md">
              <Card className="bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-orange-900/40 dark:via-gray-900 dark:to-red-900/40 shadow-[0_0_15px_rgba(251,146,60,0.2)] dark:shadow-[0_0_15px_rgba(251,146,60,0.1)] border-2 border-orange-200/50 dark:border-orange-800/30 backdrop-blur-sm">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => handleRejectSingle(boss.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <BossConfirmation
                    boss={boss}
                    onConfirm={handleConfirmSingle}
                    onConfirmAndAdd={handleConfirmAndAdd}
                    onReject={() => handleRejectSingle(boss.id)}
                    isManualAdd={true}
                    onChannelChange={handleChannelChange}
                    onBossNameChange={handleBossNameChange}
                  />
                </div>
              </Card>
            </div>
          ))}
          <div className="flex-1 min-w-[300px] max-w-md">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-[100px] border-dashed border-2 hover:border-orange-500 hover:bg-orange-500/5 transition-colors"
              onClick={handleAddClick}
            >
              <Plus className="mr-2 h-5 w-5" />
              Adicionar Outro Boss
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant="default"
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleConfirmAll}
            >
              <Check className="mr-2 h-4 w-4" />
              Confirmar Todos os Bosses
            </Button>
            <Button
              variant="outline"
              onClick={handleRejectAll}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar Todos
            </Button>
          </div>

          <Dialog open={showSummary} onOpenChange={setShowSummary}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <List className="mr-2 h-4 w-4" />
                Ver Resumo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Resumo dos Bosses a Serem Adicionados</DialogTitle>
                <DialogDescription>
                  Verifique se todos os bosses estão corretos antes de confirmar
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="space-y-4">
                  {pendingBosses.map(boss => (
                    <div key={boss.id} className="flex justify-between items-center p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                      <div>
                        <p className="font-medium">{boss.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {boss.channel || 'Canal não definido'} • {boss.spawnMap} • Tempo Capturado: {boss.capturedTime}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRejectSingle(boss.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        <div className="w-full border-t"></div>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full max-w-md h-[100px] border-dashed border-2 hover:border-orange-500 hover:bg-orange-500/5 transition-colors"
      onClick={handleAddClick}
    >
      <Plus className="mr-2 h-5 w-5" />
      Adicionar Boss Manualmente
    </Button>
  )
}

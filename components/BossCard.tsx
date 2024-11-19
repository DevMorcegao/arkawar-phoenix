'use client'

import React, { useState } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Boss } from '@/app/types/boss'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'react-hot-toast'
import { ConfirmationDialog } from './ConfirmationDialog'
import { cn } from '@/lib/utils'

interface BossCardProps {
  boss: Boss
  onRemove: (id: string) => Promise<void>
  onUpdateStatus: (id: string, status: 'killed' | 'noshow') => Promise<void>
}

const BossCard: React.FC<BossCardProps> = ({ boss, onRemove, onUpdateStatus }) => {
  const [confirmAction, setConfirmAction] = useState<{
    type: 'kill' | 'noshow' | 'remove' | null;
    isOpen: boolean;
  }>({ type: null, isOpen: false });

  const formatSpawnTime = (spawnTime: string | Date) => {
    if (typeof spawnTime === 'string') {
      const date = parseISO(spawnTime)
      return isValid(date) ? format(date, "dd/MM/yyyy' às 'HH:mm") : 'Data inválida'
    } else if (spawnTime instanceof Date) {
      return isValid(spawnTime) ? format(spawnTime, "dd/MM/yyyy' às 'HH:mm") : 'Data inválida'
    }
    return 'Data inválida'
  }

  const handleStatusUpdate = async (status: 'killed' | 'noshow') => {
    try {
      await onUpdateStatus(boss.id, status)
      toast.success(`Boss ${status === 'killed' ? 'marcado como morto' : 'marcado como não aparecido'} com sucesso!`)
    } catch (error) {
      console.error('BossCard: Error updating boss status:', error)
      toast.error('Erro ao atualizar o status do boss. Tente novamente.')
    }
  }

  const handleRemove = async () => {
    try {
      await onRemove(boss.id)
      toast.success('Boss removido com sucesso!')
    } catch (error) {
      console.error('BossCard: Error removing boss:', error)
      toast.error('Erro ao remover o boss. Tente novamente.')
    }
  }

  const getConfirmationDetails = () => {
    switch (confirmAction.type) {
      case 'kill':
        return {
          title: 'Marcar como Morto',
          description: 'Tem certeza que deseja marcar este boss como morto? O card será removido após a confirmação.',
        }
      case 'noshow':
        return {
          title: 'Marcar como Não Apareceu',
          description: 'Tem certeza que deseja marcar este boss como não aparecido? O card será removido após a confirmação.',
        }
      case 'remove':
        return {
          title: 'Remover Boss',
          description: 'Tem certeza que deseja remover este boss?',
        }
      default:
        return { title: '', description: '' }
    }
  }

  const handleConfirmAction = async () => {
    switch (confirmAction.type) {
      case 'kill':
        await handleStatusUpdate('killed')
        break
      case 'noshow':
        await handleStatusUpdate('noshow')
        break
      case 'remove':
        await handleRemove()
        break
    }
    setConfirmAction({ type: null, isOpen: false })
  }

  return (
    <>
      <div className="p-3 bg-secondary rounded-lg flex justify-between items-center hover:bg-secondary/80 transition-colors">
        <div>
          <strong className="text-primary">{boss.name}</strong>
          <p className="text-sm text-muted-foreground">{boss.spawnMap}</p>
          {boss.channel && <p className="text-sm">{boss.channel}</p>}
          <p className="text-sm">Nascimento: {formatSpawnTime(boss.spawnTime)}</p>
          {boss.status && (
            <p className="text-sm font-semibold">
              Status: {boss.status === 'killed' ? 'Morto' : boss.status === 'noshow' ? 'Não apareceu' : 'Pendente'}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmAction({ type: 'kill', isOpen: true })}
                  className={cn(
                    "text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300",
                    "hover:bg-emerald-500/10"
                  )}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Marcar como morto</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmAction({ type: 'noshow', isOpen: true })}
                  className={cn(
                    "text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300",
                    "hover:bg-amber-500/10"
                  )}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Marcar como não apareceu</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmAction({ type: 'remove', isOpen: true })}
                  className={cn(
                    "text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300",
                    "hover:bg-red-500/10"
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remover boss</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction({ type: null, isOpen: false })}
        onConfirm={handleConfirmAction}
        {...getConfirmationDetails()}
      />
    </>
  )
}

export default BossCard
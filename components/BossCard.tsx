'use client'

import React, { useState } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { Trash2, Check, X, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Boss } from '@/app/types/boss'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'react-hot-toast'
import { ConfirmationDialog } from './ConfirmationDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import BossConfirmation from './BossConfirmation'
import { logger } from '@/lib/logger'

interface BossCardProps {
  boss: Boss
  onRemove: (id: string) => Promise<void>
  onUpdateStatus: (id: string, status: 'killed' | 'noshow') => Promise<void>
  onEdit: (boss: Boss) => Promise<void>
}

const BossCard: React.FC<BossCardProps> = ({ boss, onRemove, onUpdateStatus, onEdit }) => {
  const [confirmAction, setConfirmAction] = useState<{
    type: 'kill' | 'noshow' | 'remove' | null;
    isOpen: boolean;
  }>({ type: null, isOpen: false });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const formatSpawnTime = (spawnTime: string | Date) => {
    if (typeof spawnTime === 'string') {
      const date = parseISO(spawnTime)
      return isValid(date) ? format(date, "dd/MM/yyyy' às 'HH:mm") : 'Data inválida'
    } else if (spawnTime instanceof Date) {
      return isValid(spawnTime) ? format(spawnTime, "dd/MM/yyyy' às 'HH:mm") : 'Data inválida'
    }
    return 'Data inválida'
  }

  const handleConfirmAction = async () => {
    try {
      if (!confirmAction.type) return

      switch (confirmAction.type) {
        case 'kill':
          await onUpdateStatus(boss.id, 'killed')
          break
        case 'noshow':
          await onUpdateStatus(boss.id, 'noshow')
          break
        case 'remove':
          await onRemove(boss.id)
          break
      }
    } catch (error) {
      logger.error('BossCard', 'Error handling action', { error })
      toast.error('Erro ao executar ação. Tente novamente.')
    } finally {
      setConfirmAction({ type: null, isOpen: false })
    }
  }

  const handleEditSubmit = async (updatedBoss: Boss) => {
    try {
      logger.debug('BossCard', 'Starting edit process', { boss: updatedBoss })
      if (!onEdit) {
        throw new Error('Edit function not provided')
      }
      await onEdit(updatedBoss)
      setIsEditDialogOpen(false)
    } catch (error) {
      logger.error('BossCard', 'Error in edit process', { error })
      toast.error('Erro ao atualizar o boss. Tente novamente.')
    }
  }

  const getConfirmationDetails = () => {
    switch (confirmAction.type) {
      case 'kill':
        return {
          title: 'Confirmar Morte do Boss',
          description: 'Tem certeza que deseja marcar este boss como morto?'
        }
      case 'noshow':
        return {
          title: 'Confirmar No-Show do Boss',
          description: 'Tem certeza que deseja marcar este boss como não aparecido?'
        }
      case 'remove':
        return {
          title: 'Remover Boss',
          description: 'Tem certeza que deseja remover este boss?'
        }
      default:
        return {
          title: '',
          description: ''
        }
    }
  }

  return (
    <>
      <div className="p-4 bg-secondary rounded-lg flex justify-between items-start hover:bg-secondary/80 transition-colors mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-orange-500 text-lg">{boss.name}</h3>
            <span className="text-sm text-muted-foreground">({boss.spawnMap})</span>
          </div>
          <div className="text-sm space-y-1">
            <p className="font-bold">Canal: <span className="font-normal">{boss.channel}</span></p>
            {boss.capturedTime && (
              <p className="font-bold">Tempo Capturado: <span className="font-normal">{boss.capturedTime}</span></p>
            )}
            <p className="font-bold">Nascimento: <span className="font-normal">{formatSpawnTime(boss.spawnTime)}</span></p>
            <p className="font-bold">Status: <span className="font-normal">{boss.status === 'pending' ? 'Pendente' : boss.status}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-green-100 dark:hover:bg-green-900/30"
                  onClick={() => setConfirmAction({ type: 'kill', isOpen: true })}
                >
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Marcar como Morto</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                  onClick={() => setConfirmAction({ type: 'noshow', isOpen: true })}
                >
                  <X className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Marcar como Não Apareceu</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar Boss</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-red-100 dark:hover:bg-red-900/30"
                  onClick={() => setConfirmAction({ type: 'remove', isOpen: true })}
                >
                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remover Boss</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {isEditDialogOpen && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Boss</DialogTitle>
            </DialogHeader>
            <BossConfirmation
              boss={boss}
              onConfirm={handleEditSubmit}
              onReject={() => setIsEditDialogOpen(false)}
              isEdit={true}
            />
          </DialogContent>
        </Dialog>
      )}

      <ConfirmationDialog
        open={confirmAction.isOpen}
        onOpenChange={(open: boolean) => setConfirmAction({ ...confirmAction, isOpen: open })}
        title={getConfirmationDetails().title}
        description={getConfirmationDetails().description}
        onConfirm={handleConfirmAction}
      />
    </>
  )
}

export default BossCard
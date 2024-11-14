import React from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Boss } from '@/app/types/boss'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'react-hot-toast'

interface BossCardProps {
  boss: Boss
  onRemove: (id: string) => Promise<void>
  onUpdateStatus: (id: string, status: 'killed' | 'noshow') => Promise<void>
}

const BossCard: React.FC<BossCardProps> = ({ boss, onRemove, onUpdateStatus }) => {
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
      console.log('BossCard: Trying to update status', { bossId: boss.id, status })
      await onUpdateStatus(boss.id, status)
      console.log('BossCard: Status updated successfully')
    } catch (error) {
      console.error('BossCard: Error updating boss status:', error)
      toast.error('Erro ao atualizar o status do boss. Tente novamente.')
    }
  }

  const handleRemove = async () => {
    try {
      console.log('BossCard: Trying to remove boss', { bossId: boss.id })
      await onRemove(boss.id)
      console.log('BossCard: Boss removed successfully')
    } catch (error) {
      console.error('BossCard: Error removing boss:', error)
      toast.error('Erro ao remover o boss. Tente novamente.')
    }
  }

  return (
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
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  console.log('BossCard: Killed button clicked')
                  handleStatusUpdate('killed')
                }}
                className="text-green-500 hover:text-green-600"
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
                onClick={() => {
                  console.log('BossCard: No-show button clicked')
                  handleStatusUpdate('noshow')
                }}
                className="text-yellow-500 hover:text-yellow-600"
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
                onClick={() => {
                  console.log('BossCard: Remove button clicked')
                  handleRemove()
                }}
                className="text-destructive hover:text-destructive/90"
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
  )
}

export default BossCard
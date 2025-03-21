import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Boss } from '@/app/types/boss'
import { Input } from '@/components/ui/input'
import { calculateSpawnTime } from '@/app/utils/timeCalculations'
import { logger } from '@/lib/logger'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { bossData } from '@/app/data/bossData'
import toast from 'react-hot-toast'

interface BossConfirmationProps {
  boss: Boss
  onConfirm: (updatedBoss: Boss) => void
  onConfirmAndAdd?: (updatedBoss: Boss) => void
  onReject: () => void
  isEdit?: boolean
  isManualAdd?: boolean
  onChannelChange?: (id: string, newChannel: string) => boolean
  onBossNameChange?: (id: string, newName: string) => boolean
}

const BossConfirmation: React.FC<BossConfirmationProps> = ({ boss, onConfirm, onConfirmAndAdd, onReject, isEdit = false, isManualAdd = false, onChannelChange, onBossNameChange }) => {
  const now = new Date()
  const [channel, setChannel] = useState(boss.channel?.replace('Channel ', '') || '')
  const [channelError, setChannelError] = useState<string | null>(null)
  const [appearanceTime, setAppearanceTime] = useState(boss.capturedTime || '')
  const [spawnTime, setSpawnTime] = useState<Date>(new Date(boss.spawnTime))
  const [editedBoss, setEditedBoss] = useState<Boss>({
    ...boss,
    channel: boss.channel || '',
    status: boss.status || 'pending',
    appearanceStatus: boss.appearanceStatus || 'pending'
  })

  useEffect(() => {
    // Atualizar o estado quando o boss prop mudar
    setEditedBoss({
      ...boss,
      channel: boss.channel || '',
      status: boss.status || 'pending',
      appearanceStatus: boss.appearanceStatus || 'pending'
    })
  }, [boss])

  const validChannels = [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13]

  // Função para validar o canal
  const validateChannel = (value: string): boolean => {
    if (!value) {
      setChannelError('Canal é obrigatório')
      return false
    }

    const numericValue = parseInt(value, 10)

    if (!validChannels.includes(numericValue)) {
      setChannelError('Canal inválido. Use: 1-6, 9 ou 10-13')
      return false
    }

    setChannelError(null)
    return true
  }

  // Atualizar o boss sempre que houver mudanças
  const handleChange = (changes: Partial<Boss>) => {
    const updatedBoss = {
      ...editedBoss,
      ...changes
    }
    setEditedBoss(updatedBoss)
    if (isManualAdd) {
      // No modo de adição manual, notificar as mudanças imediatamente
      onConfirm(updatedBoss)
    }
  }

  const handleChannelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir apenas números
    const newValue = e.target.value.replace(/\D/g, '')
    setChannel(newValue)
    setChannelError(null)

    // Validar o canal
    if (validateChannel(newValue)) {
      const newChannel = `Channel ${newValue}`
      
      // Se o componente pai permitir a mudança de canal (não há duplicata)
      if (!onChannelChange || onChannelChange(editedBoss.id, newChannel)) {
        handleChange({ channel: newChannel })
      } else {
        // Se houver duplicata, limpar o canal
        setChannel('')
        handleChange({ channel: undefined })
      }
    } else {
      // Se o canal for inválido, limpar o canal do boss
      handleChange({ channel: undefined })
    }
  }

  const handleSpawnTimeChange = (date: Date | undefined) => {
    if (date) {
      setSpawnTime(date)
      handleChange({ spawnTime: date.toISOString() })
    }
  }

  // Função para extrair horas e minutos do formato "Xh Ym"
  const parseAppearanceTime = (time: string): { hours: number; minutes: number } | null => {
    const match = time.match(/(\d+)h\s*(\d+)m/)
    if (match) {
      return {
        hours: parseInt(match[1], 10),
        minutes: parseInt(match[2], 10)
      }
    }
    return null
  }

  // Atualiza o horário de spawn quando o tempo capturado muda
  useEffect(() => {
    const timeInfo = parseAppearanceTime(appearanceTime)
    if (timeInfo) {
      const newSpawnTime = calculateSpawnTime(timeInfo.hours, timeInfo.minutes)
      handleSpawnTimeChange(newSpawnTime)
    }
  }, [appearanceTime])

  // Handler para mudança no nome do boss
  const handleBossNameChange = (value: string) => {
    const selectedBoss = bossData.find(b => b.name === value)
    if (selectedBoss) {
      // Se o componente pai permitir a mudança de nome (não há duplicata)
      if (!onBossNameChange || onBossNameChange(editedBoss.id, selectedBoss.name)) {
        handleChange({
          name: selectedBoss.name,
          spawnMap: selectedBoss.spawnMap
        })
      }
    }
  }

  const handleConfirm = () => {
    if (!validateChannel(channel)) {
      toast.error('Canal inválido. Use: 1-6, 9 ou 10-13')
      return
    }
    
    const updatedBoss: Boss = {
      ...editedBoss,
      id: editedBoss.id || `boss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: editedBoss.name,
      spawnMap: editedBoss.spawnMap,
      channel: channel ? `Channel ${channel}` : undefined,
      appearanceStatus: editedBoss.status,
      capturedTime: appearanceTime,
      spawnTime: spawnTime.toISOString(),
      status: editedBoss.status || 'pending',
      userId: editedBoss.userId,
      createdAt: editedBoss.createdAt
    }

    logger.debug('BossConfirmation', 'Confirming boss update', { updatedBoss })
    if (onConfirmAndAdd && isManualAdd) {
      onConfirmAndAdd(updatedBoss)
    } else {
      onConfirm(updatedBoss)
    }
  }

  const handleAppearanceTimeChange = (value: string) => {
    // Formata automaticamente para o padrão "Xh Ym"
    const cleanValue = value.replace(/[^0-9hm\s]/g, '')
    const match = cleanValue.match(/^(\d{0,2})(h)?(\s*)?(\d{0,2})?(m)?$/)
    
    if (match) {
      let formatted = cleanValue
      if (match[1] && !match[2]) formatted = `${match[1]}h${match[3] || ' '}${match[4] || '0'}m`
      if (match[4] && !match[5]) formatted = `${match[1] || '0'}h ${match[4]}m`
      setAppearanceTime(formatted)
      // Atualizar o estado do boss com o novo tempo capturado
      handleChange({ capturedTime: formatted })
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-orange-900/40 dark:via-gray-900 dark:to-red-900/40 shadow-[0_0_15px_rgba(251,146,60,0.2)] dark:shadow-[0_0_15px_rgba(251,146,60,0.1)] border-2 border-orange-200/50 dark:border-orange-800/30 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-500 dark:from-orange-400 dark:via-red-400 dark:to-orange-300 bg-clip-text text-transparent">
          {isEdit ? 'Alterar Boss Detectado' : 'Confirmar Boss Detectado'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="space-y-2">
            <strong className="text-orange-700 dark:text-orange-300">Nome do Boss</strong>
            {isManualAdd || isEdit ? (
              <Select
                value={editedBoss.name}
                onValueChange={handleBossNameChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o boss" />
                </SelectTrigger>
                <SelectContent>
                  {bossData.map((boss) => (
                    <SelectItem key={boss.name} value={boss.name}>
                      {boss.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={editedBoss.name}
                onChange={(e) => handleChange({ name: e.target.value })}
                readOnly={!isEdit}
              />
            )}
          </div>
          <p className="flex justify-between items-center">
            <strong className="text-orange-700 dark:text-orange-300">Mapa:</strong>
            <span className="text-gray-800 dark:text-gray-200">{editedBoss.spawnMap}</span>
          </p>
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between items-center">
              <strong className="text-orange-700 dark:text-orange-300">Canal:</strong>
              <div className="flex flex-col items-end">
                <Input
                  value={channel}
                  onChange={handleChannelChange}
                  className="w-24 text-right"
                  placeholder="Ex: 1"
                />
                {channelError && <span className="text-xs text-red-500 mt-1">{channelError}</span>}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <strong className="text-orange-700 dark:text-orange-300">Tempo Capturado:</strong>
            <Input
              value={appearanceTime}
              onChange={(e) => handleAppearanceTimeChange(e.target.value)}
              className="w-24 text-right"
              placeholder="Ex: 7h 50m"
            />
          </div>
          <p className="flex justify-between items-center">
            <strong className="text-orange-700 dark:text-orange-300">Horário Atual:</strong>
            <span className="text-gray-800 dark:text-gray-200">{format(now, "dd/MM/yyyy' às 'HH:mm:ss")}</span>
          </p>
          <p className="flex justify-between items-center">
            <strong className="text-orange-700 dark:text-orange-300">Horário de Spawn Calculado:</strong>
            <span className="text-gray-800 dark:text-gray-200">{format(spawnTime, "dd/MM/yyyy' às 'HH:mm")}</span>
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={onReject}
          className="bg-white hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900/30 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700"
        >
          Rejeitar
        </Button>
        <Button 
          onClick={handleConfirm}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 dark:from-orange-600 dark:to-red-600 dark:hover:from-orange-700 dark:hover:to-red-700"
        >
          Confirmar
        </Button>
      </CardFooter>
    </Card>
  )
}

export default BossConfirmation
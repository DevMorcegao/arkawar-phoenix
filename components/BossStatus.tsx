'use client'

import { useEffect, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock, CheckCircle2, AlertCircle, Filter} from 'lucide-react'
import { BossStatusInfo, formatTimeRemaining } from '@/lib/bossUtils'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { logger } from '@/lib/logger'
import { useBossStore } from '@/lib/stores/bossStore'

// Estender a interface Window
declare global {
  interface Window {
    openBossStatusModal: () => void
    closeBossStatusModal: () => void
  }
}

export default function BossStatus() {
  const [isOpen, setIsOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [selectedBosses, setSelectedBosses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const { initialize, cleanup, bossStatuses, updateBossStatuses } = useBossStore()

  // Lista de canais disponíveis
  const channels = ['Channel 1', 'Channel 2', 'Channel 3', 'Channel 4', 'Channel 5', 
                   'Channel 6', 'Channel 9', 'Channel 10', 'Channel 11', 'Channel 12', 'Channel 13']

  // Lista única de nomes de bosses
  const uniqueBossNames = Array.from(new Set(bossStatuses.map(boss => boss.name))).sort()

  // Função para filtrar os bosses baseado nas seleções
  const filterBosses = (bosses: BossStatusInfo[]) => {
    return bosses.filter(boss => {
      const channelMatch = selectedChannels.length === 0 || selectedChannels.includes(boss.channel || '')
      const bossMatch = selectedBosses.length === 0 || selectedBosses.includes(boss.name)
      return channelMatch && bossMatch
    })
  }

  // Criar funções estáveis com useCallback
  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    // Registra as funções de abrir e fechar no objeto window
    window.openBossStatusModal = openModal
    window.closeBossStatusModal = closeModal

    // Limpa as funções quando o componente é desmontado
    return () => {
      window.openBossStatusModal = () => {}
      window.closeBossStatusModal = () => {}
    }
  }, [openModal, closeModal])

  useEffect(() => {
    if (!isOpen) {
      cleanup()
      return
    }

    logger.info('BossStatus', '🎧 Iniciando listener de status dos bosses')
    initialize()
    setLoading(false)

    return () => {
      logger.info('BossStatus', '🛑 Desativando listener de status')
      cleanup()
    }
  }, [isOpen, initialize, cleanup])

  // Atualização da UI com intervalo maior
  useEffect(() => {
    if (!isOpen) return

    logger.info('BossStatus', '⏰ Iniciando timer de atualização de UI')
    
    const timer = setInterval(() => {
      updateBossStatuses()
    }, 30000) // Reduzido para 30s para manter sincronizado com as notificações

    return () => {
      logger.info('BossStatus', '🛑 Desativando timer de UI')
      clearInterval(timer)
    }
  }, [isOpen, updateBossStatuses])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'soon':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'waiting':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
      default:
        return ''
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle2 className="h-4 w-4" />
      case 'soon':
        return <AlertCircle className="h-4 w-4" />
      case 'waiting':
        return <Clock className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[800px] max-h-[80vh]">
        <div className="flex items-center justify-between mb-4">
          <DialogTitle>Status dos Bosses</DialogTitle>
          <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 mr-8">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Filtros</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Canais</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {channels.map((channel) => (
                      <div key={channel} className="flex items-center space-x-2">
                        <Checkbox
                          id={`channel-${channel}`}
                          checked={selectedChannels.includes(channel)}
                          onCheckedChange={(checked) => {
                            setSelectedChannels(prev =>
                              checked
                                ? [...prev, channel]
                                : prev.filter(ch => ch !== channel)
                            )
                          }}
                        />
                        <Label
                          htmlFor={`channel-${channel}`}
                          className="text-sm text-foreground"
                        >
                          {channel}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-border" />

                <div>
                  <h4 className="font-medium mb-2">Bosses</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {uniqueBossNames.map((bossName) => (
                      <div key={bossName} className="flex items-center space-x-2">
                        <Checkbox
                          id={`boss-${bossName}`}
                          checked={selectedBosses.includes(bossName)}
                          onCheckedChange={(checked) => {
                            setSelectedBosses(prev =>
                              checked
                                ? [...prev, bossName]
                                : prev.filter(name => name !== bossName)
                            )
                          }}
                        />
                        <Label
                          htmlFor={`boss-${bossName}`}
                          className="text-sm text-foreground"
                        >
                          {bossName}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          {/* Lista de Bosses */}
          <ScrollArea className="h-[calc(80vh-180px)] pr-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <span>Carregando...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Bosses Disponíveis */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Bosses Disponíveis para serem adicionados
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filterBosses(bossStatuses.filter(boss => boss.status === 'available'))
                      .map((boss, index) => (
                        <Card
                          key={`${boss.name}-${boss.channel}-${index}`}
                          className={cn(
                            'p-3 border flex items-center justify-between',
                            getStatusColor(boss.status)
                          )}
                        >
                          <div>
                            <span className="font-medium">{boss.name}</span>
                            <span className="text-sm ml-2">{boss.channel}</span>
                          </div>
                          {getStatusIcon(boss.status)}
                        </Card>
                      ))}
                  </div>
                </div>

                {/* Bosses Em Breve */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    Próximos a Nascer
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filterBosses(bossStatuses.filter(boss => boss.status === 'soon'))
                      .map((boss, index) => (
                        <Card
                          key={`${boss.name}-${boss.channel}-${index}`}
                          className={cn(
                            'p-3 border flex items-center justify-between',
                            getStatusColor(boss.status)
                          )}
                        >
                          <div>
                            <span className="font-medium">{boss.name}</span>
                            <span className="text-sm ml-2">{boss.channel}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {formatTimeRemaining(boss.timeRemaining || 0)}
                            </span>
                            {getStatusIcon(boss.status)}
                          </div>
                        </Card>
                      ))}
                  </div>
                </div>

                {/* Bosses em Espera */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    Em Espera para serem adicionados
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filterBosses(bossStatuses.filter(boss => boss.status === 'waiting'))
                      .map((boss, index) => (
                        <Card
                          key={`${boss.name}-${boss.channel}-${index}`}
                          className={cn(
                            'p-3 border flex items-center justify-between',
                            getStatusColor(boss.status)
                          )}
                        >
                          <div>
                            <span className="font-medium">{boss.name}</span>
                            <span className="text-sm ml-2">{boss.channel}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {formatTimeRemaining(boss.timeRemaining || 0)}
                            </span>
                            {getStatusIcon(boss.status)}
                          </div>
                        </Card>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

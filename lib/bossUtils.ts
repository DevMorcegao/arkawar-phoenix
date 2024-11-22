import { differenceInHours, differenceInMinutes, parseISO, addHours, addMinutes } from 'date-fns'
import { Boss } from '@/app/types/boss'
import { bossRespawnData } from '@/app/data/bossRespawnData'

export interface BossStatusInfo {
  name: string
  channel?: string
  status: 'available' | 'soon' | 'waiting' | 'deleted'
  timeRemaining?: number // em minutos
  lastKillTime?: Date
}

export async function calculateBossStatuses(bosses: Boss[]): Promise<BossStatusInfo[]> {
  const bossStatuses: BossStatusInfo[] = []
  const now = new Date()
  const processedBosses = new Set<string>() // Para evitar duplicações

  const killedBosses = bosses
    .filter(b => b.status === 'killed')
    // Ignora bosses mortos há mais de 48 horas
    .filter(b => {
      const killTime = parseISO(b.spawnTime)
      const hoursSinceKill = differenceInHours(now, killTime)
      return hoursSinceKill <= 48
    })
    // Ordena por spawnTime mais recente
    .sort((a, b) => parseISO(b.spawnTime).getTime() - parseISO(a.spawnTime).getTime())
    // Pega apenas o kill mais recente para cada boss+canal
    .filter((boss, index, self) => 
      index === self.findIndex(b => b.name === boss.name && b.channel === boss.channel)
    )

  // Primeiro, processa todos os bosses killed
  for (const killedBoss of killedBosses) {
    const bossKey = `${killedBoss.name}-${killedBoss.channel}`
    if (processedBosses.has(bossKey)) continue // Pula se já processou este boss+canal

    // Verifica se existe um boss pendente para este boss/canal
    const isPending = bosses.some(
      b => b.name === killedBoss.name && 
      b.channel === killedBoss.channel && 
      b.status === 'pending'
    )

    // Se já existe um boss pendente, pula este boss
    if (isPending) {
      processedBosses.add(bossKey)
      continue
    }

    const lastKillTimeUTC = parseISO(killedBoss.spawnTime)
    const lastKillTime = addMinutes(lastKillTimeUTC, 5) // Adiciona 5 minutos ao tempo UTC
    const respawnInfo = bossRespawnData[killedBoss.name]
    const minRespawnHours = respawnInfo?.minHours || 24 // Default para 24h se não encontrar
    const maxRespawnHours = respawnInfo?.maxHours || 32 // Default para 32h se não encontrar
    const earlyAddHours = 6 // Permite adicionar 6 horas antes do tempo mínimo

    // Calcula a diferença de tempo
    const minRespawnTimeUTC = addHours(lastKillTime, minRespawnHours)
    const maxRespawnTimeUTC = addHours(lastKillTime, maxRespawnHours)
    const earlyAddTimeUTC = addHours(lastKillTime, minRespawnHours - earlyAddHours)
    const minutesUntilMinRespawn = differenceInMinutes(minRespawnTimeUTC, now)
    const minutesUntilMaxRespawn = differenceInMinutes(maxRespawnTimeUTC, now)
    const minutesUntilEarlyAdd = differenceInMinutes(earlyAddTimeUTC, now)

    // Determina o status baseado no tempo até early add E tempo até respawn mínimo
    let status: 'available' | 'soon' | 'waiting';
    let timeRemaining: number;

    if (minutesUntilMinRespawn <= 0) {
      // Se já passou do tempo mínimo de respawn, está disponível
      status = 'available';
      timeRemaining = 0;
    } else if (minutesUntilEarlyAdd <= 0) {
      // Se passou do early add mas não do respawn mínimo, está "soon"
      status = 'soon';
      timeRemaining = minutesUntilMinRespawn;
    } else if (minutesUntilEarlyAdd <= 360) {
      // Se está dentro da janela de 6 horas do early add
      status = 'soon';
      timeRemaining = minutesUntilEarlyAdd;
    } else {
      // Se está além das 6 horas do early add
      status = 'waiting';
      timeRemaining = minutesUntilEarlyAdd;
    }

    // Adiciona o status à lista
    bossStatuses.push({
      name: killedBoss.name,
      channel: killedBoss.channel,
      status,
      timeRemaining: status !== 'available' ? timeRemaining : undefined,
      lastKillTime
    })
    processedBosses.add(bossKey)
  }

  // Depois, adiciona status 'available' para canais sem boss killed ou pending
  const channels = ['Channel 1', 'Channel 2', 'Channel 3', 'Channel 4', 'Channel 5', 
                   'Channel 10', 'Channel 11', 'Channel 12', 'Channel 13']

  for (const bossName of Object.keys(bossRespawnData)) {
    for (const channel of channels) {
      const bossKey = `${bossName}-${channel}`
      if (processedBosses.has(bossKey)) continue // Pula se já processou este boss+canal

      // Verifica se existe um boss pending
      const pendingBoss = bosses.find(
        b => b.name === bossName && 
        b.channel === channel && 
        b.status === 'pending'
      )

      // Se não existe status e não existe pending, marca como available
      if (!pendingBoss) {
        bossStatuses.push({
          name: bossName,
          channel,
          status: 'available'
        })
        processedBosses.add(bossKey)
      }
    }
  }

  // Ordena por status (available -> soon -> waiting) e depois por nome
  return bossStatuses.sort((a, b) => {
    const statusOrder: Record<BossStatusInfo['status'], number> = { 
      available: 0, 
      soon: 1, 
      waiting: 2,
      deleted: 3 
    }
    
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status]
    }
    
    // Comparação por nome
    if (a.name !== b.name) {
      return a.name.localeCompare(b.name)
    }
    
    // Comparação por canal, com verificação de undefined
    const channelA = a.channel || ''
    const channelB = b.channel || ''
    return channelA.localeCompare(channelB)
  })
}

export function formatTimeRemaining(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  if (hours === 0) {
    return `${mins}m`
  }
  return `${hours}h${mins}m`
}
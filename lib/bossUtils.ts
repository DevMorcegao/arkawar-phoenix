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

  // Debug: Listar todos os bosses mortos
  console.log('=== Todos os bosses killed ===')
  const killedBosses = bosses.filter(b => b.status === 'killed')
  killedBosses.forEach(b => {
    console.log(`${b.name} - ${b.channel} - ${b.spawnTime}`)
  })

  // Primeiro, processa todos os bosses killed
  for (const killedBoss of killedBosses) {
    // Verifica se existe um boss pendente para este boss/canal
    const isPending = bosses.some(
      b => b.name === killedBoss.name && 
      b.channel === killedBoss.channel && 
      b.status === 'pending'
    )

    // Se já existe um boss pendente, pula este boss
    if (isPending) continue;

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

    // Debug log
    console.log({
      boss: killedBoss.name,
      channel: killedBoss.channel,
      lastKillTimeUTC: lastKillTimeUTC.toISOString(),
      lastKillTimeWithOffset: lastKillTime.toISOString(),
      minRespawnTimeUTC: minRespawnTimeUTC.toISOString(),
      maxRespawnTimeUTC: maxRespawnTimeUTC.toISOString(),
      earlyAddTimeUTC: earlyAddTimeUTC.toISOString(),
      nowUTC: now.toISOString(),
      minRespawnHours,
      maxRespawnHours,
      minutesUntilMinRespawn,
      minutesUntilMaxRespawn,
      minutesUntilEarlyAdd,
      hoursUntilMinRespawn: minutesUntilMinRespawn / 60,
      hoursUntilMaxRespawn: minutesUntilMaxRespawn / 60,
      hoursUntilEarlyAdd: minutesUntilEarlyAdd / 60,
      status: minutesUntilEarlyAdd <= 0 ? 'available' : 'waiting'
    })

    if (minutesUntilEarlyAdd <= 0) {
      // Boss pode ser adicionado (6 horas antes do tempo mínimo ou depois)
      bossStatuses.push({
        name: killedBoss.name,
        channel: killedBoss.channel,
        status: 'available',
        lastKillTime
      })
    } else if (minutesUntilEarlyAdd <= 360) { // 6 horas (360 minutos) para poder adicionar
      // Boss estará disponível em breve
      bossStatuses.push({
        name: killedBoss.name,
        channel: killedBoss.channel,
        status: 'soon',
        timeRemaining: minutesUntilEarlyAdd,
        lastKillTime
      })
    } else {
      // Boss ainda está em cooldown
      bossStatuses.push({
        name: killedBoss.name,
        channel: killedBoss.channel,
        status: 'waiting',
        timeRemaining: minutesUntilEarlyAdd,
        lastKillTime
      })
    }
  }

  // Depois, adiciona status 'available' para canais sem boss killed ou pending
  const channels = ['Channel 1', 'Channel 2', 'Channel 3', 'Channel 4', 'Channel 5', 
                   'Channel 10', 'Channel 11', 'Channel 12', 'Channel 13']

  for (const bossName of Object.keys(bossRespawnData)) {
    for (const channel of channels) {
      // Verifica se já existe um status para este boss/canal
      const existingStatus = bossStatuses.find(
        s => s.name === bossName && s.channel === channel
      )

      // Verifica se existe um boss pending
      const pendingBoss = bosses.find(
        b => b.name === bossName && 
        b.channel === channel && 
        b.status === 'pending'
      )

      // Se não existe status e não existe pending, marca como available
      if (!existingStatus && !pendingBoss) {
        bossStatuses.push({
          name: bossName,
          channel,
          status: 'available'
        })
      }
    }
  }

  // Remove os status 'available' para bosses que já estão pendentes
  const filteredStatuses = bossStatuses.filter(status => {
    const isPending = bosses.some(
      b => b.name === status.name && 
      b.channel === status.channel && 
      b.status === 'pending'
    )
    return !isPending || status.status !== 'available'
  })

  // Debug: Mostrar todos os status calculados
  console.log('=== Todos os status calculados ===')
  filteredStatuses.forEach(status => {
    console.log(`${status.name} - ${status.channel} - ${status.status} - ${status.timeRemaining}min`)
  })

  // Ordena por status (available -> soon -> waiting -> deleted) e depois por tempo restante
  return filteredStatuses.sort((a, b) => {
    const statusOrder = { available: 0, soon: 1, waiting: 2, deleted: 3 }
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status]
    }
    if (a.timeRemaining && b.timeRemaining) {
      return a.timeRemaining - b.timeRemaining
    }
    if (a.name !== b.name) {
      return a.name.localeCompare(b.name)
    }
    return (a.channel || '').localeCompare(b.channel || '')
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

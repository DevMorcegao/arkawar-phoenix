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
    const lastKillTimeUTC = parseISO(killedBoss.spawnTime)
    const lastKillTime = addMinutes(lastKillTimeUTC, 5) // Adiciona 5 minutos ao tempo UTC
    const minRespawnHours = bossRespawnData[killedBoss.name]?.minHours || 24 // Default para 24h se não encontrar

    // Calcula a diferença de tempo
    const respawnTimeUTC = addHours(lastKillTime, minRespawnHours)
    const minutesUntilRespawn = differenceInMinutes(respawnTimeUTC, now)

    // Debug log
    console.log({
      boss: killedBoss.name,
      channel: killedBoss.channel,
      lastKillTimeUTC: lastKillTimeUTC.toISOString(),
      lastKillTimeWithOffset: lastKillTime.toISOString(),
      respawnTimeUTC: respawnTimeUTC.toISOString(),
      nowUTC: now.toISOString(),
      minRespawnHours,
      minutesUntilRespawn,
      hoursUntilRespawn: minutesUntilRespawn / 60,
      status: minutesUntilRespawn <= 0 ? 'available' : 
              minutesUntilRespawn <= 120 ? 'soon' : 'waiting'
    })

    if (minutesUntilRespawn <= 0) {
      // Boss pode ser adicionado
      bossStatuses.push({
        name: killedBoss.name,
        channel: killedBoss.channel,
        status: 'available',
        lastKillTime
      })
    } else if (minutesUntilRespawn <= 120) { // 2 horas
      // Boss estará disponível em breve
      bossStatuses.push({
        name: killedBoss.name,
        channel: killedBoss.channel,
        status: 'soon',
        timeRemaining: minutesUntilRespawn,
        lastKillTime
      })
    } else {
      // Boss ainda está em cooldown
      bossStatuses.push({
        name: killedBoss.name,
        channel: killedBoss.channel,
        status: 'waiting',
        timeRemaining: minutesUntilRespawn,
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

      // Se não existe status nem pending, marca como available
      if (!existingStatus && !pendingBoss) {
        bossStatuses.push({
          name: bossName,
          channel,
          status: 'available'
        })
      }
    }
  }

  // Debug: Mostrar todos os status calculados
  console.log('=== Todos os status calculados ===')
  bossStatuses.forEach(status => {
    console.log(`${status.name} - ${status.channel} - ${status.status} - ${status.timeRemaining}min`)
  })

  // Ordena por status (available -> soon -> waiting -> deleted) e depois por tempo restante
  return bossStatuses.sort((a, b) => {
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

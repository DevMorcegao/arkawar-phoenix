import { create } from 'zustand'
import { collection, query, where, onSnapshot, QueryDocumentSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Boss } from '@/app/types/boss'
import { logger } from '@/lib/logger'
import { monitoringService } from '@/lib/services/monitoringService'
import { BossStatusInfo, calculateBossStatuses } from '@/lib/bossUtils'

interface BossStore {
  bosses: Boss[]
  bossStatuses: BossStatusInfo[]
  isInitialized: boolean
  unsubscribe: (() => void) | null
  initialize: () => void
  cleanup: () => void
  updateBossStatuses: () => Promise<void>
}

export const useBossStore = create<BossStore>((set, get) => ({
  bosses: [],
  bossStatuses: [],
  isInitialized: false,
  unsubscribe: null,

  updateBossStatuses: async () => {
    const { bosses } = get()
    const statuses = await calculateBossStatuses(bosses)
    set({ bossStatuses: statuses })
  },

  initialize: () => {
    if (get().isInitialized) return

    // Calcular data limite (2 dias atrás)
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    // Query combinada para todos os bosses
    const combinedQuery = query(
      collection(db, 'bossSpawns'),
      where('status', 'in', ['pending', 'killed']),
      where('spawnTime', '>=', twoDaysAgo.toISOString())
    )

    logger.info('BossStore', '🎧 Iniciando listener central de bosses')

    const unsubscribe = onSnapshot(combinedQuery, async (snapshot) => {
      monitoringService.trackListenerUpdate('BossStore')
      logger.info('BossStore', '📥 Dados recebidos do listener central', {
        totalDocs: snapshot.docs.length,
        pendingDocs: snapshot.docs.filter(doc => doc.data().status === 'pending').length,
        killedDocs: snapshot.docs.filter(doc => doc.data().status === 'killed').length
      })

      const updatedBosses = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || null,
        createdAt: doc.data().createdAt?.toDate() || null
      } as Boss))

      set({ bosses: updatedBosses })
      await get().updateBossStatuses()
    }, (error) => {
      logger.error('BossStore', '❌ Erro no listener central', { error })
    })

    set({ unsubscribe, isInitialized: true })
  },

  cleanup: () => {
    const { unsubscribe } = get()
    if (unsubscribe) {
      logger.info('BossStore', '🛑 Desativando listener central')
      unsubscribe()
      set({ unsubscribe: null, isInitialized: false })
    }
  }
})) 
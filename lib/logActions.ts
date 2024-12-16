import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { logger } from './logger'

interface LogDetails {
  changes?: Array<{
    field: string;
    oldValue: string;
    newValue: string;
  }>;
  oldValue?: string;
  newValue?: string;
  field?: string;
}

interface BossInfo {
  id: string
  name: string
  channel?: string
}

export async function logBossAction(
  userId: string,
  userName: string,
  action: 'added' | 'killed' | 'noshow' | 'edited' | 'deleted',
  bossInfo: BossInfo,
  details?: LogDetails
) {
  try {
    const logRef = collection(db, 'bossLogs')
    
    // Criar objeto base do log
    const logData = {
      userId,
      userName,
      action,
      bossId: bossInfo.id,
      bossName: bossInfo.name,
      channel: bossInfo.channel,
      timestamp: serverTimestamp()
    }

    // Adicionar details apenas se existir
    if (details) {
      Object.assign(logData, { details })
    }

    const docRef = await addDoc(logRef, logData)
    
    logger.info('logBossAction', 'Log saved successfully', { logId: docRef.id })
    logger.info('logBossAction', 'Action logged successfully', {
      action,
      bossName: bossInfo.name,
      userId,
      logId: docRef.id
    })
    return docRef.id
  } catch (error) {
    logger.error('logBossAction', 'Error saving log', { error })
    logger.error('logBossAction', 'Error logging action', { error })
  }
}
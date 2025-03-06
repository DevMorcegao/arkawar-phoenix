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
    logger.info('LogActions', '📝 Iniciando registro de log', {
      action,
      boss: bossInfo.name,
      channel: bossInfo.channel
    });

    const logData = {
      userId,
      userName,
      action,
      bossId: bossInfo.id,
      bossName: bossInfo.name,
      bossChannel: bossInfo.channel,
      timestamp: serverTimestamp(),
      details: details || {}
    };

    const docRef = await addDoc(collection(db, 'bossLogs'), logData);

    logger.info('LogActions', '✅ Log registrado com sucesso', {
      action,
      boss: bossInfo.name,
      channel: bossInfo.channel,
      logId: docRef.id
    });

    return docRef;
  } catch (error) {
    logger.error('LogActions', 'Erro ao registrar log', {
      error,
      action,
      boss: bossInfo.name
    });
    throw error;
  }
}
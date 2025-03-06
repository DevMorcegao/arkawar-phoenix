import { useEffect, useRef } from 'react';
import { discordService } from '@/lib/services/discordService';
import { Boss } from '@/app/types/boss';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

interface NotificationRecord {
  thirtyMin: boolean;
  fiveMin: boolean;
  lastThirtyMinNotification?: Timestamp;
  lastFiveMinNotification?: Timestamp;
  lastUpdated: Date;
}

export const useDiscordNotifications = (bosses: Boss[], webhookUrl: string) => {
  const isCheckingRef = useRef(false);

  const checkUpcomingBosses = async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      // Usar GMT-3 (Brasília)
      const currentTime = new Date();
      const brasiliaOffset = -3 * 60;
      const userOffset = currentTime.getTimezoneOffset();
      const offsetDiff = brasiliaOffset - userOffset;
      currentTime.setMinutes(currentTime.getMinutes() + offsetDiff);

      for (const boss of bosses) {
        if (boss.status !== 'pending') continue;

        const spawnTime = new Date(boss.spawnTime);
        spawnTime.setMinutes(spawnTime.getMinutes() + offsetDiff);

        const timeUntilSpawn = Math.floor(
          (spawnTime.getTime() - currentTime.getTime()) / (1000 * 60)
        );

        // Ignorar bosses que já passaram do tempo de spawn
        if (timeUntilSpawn <= 0) continue;

        logger.debug('useDiscordNotifications', 'Verificando boss', { 
          boss: boss.name, 
          timeUntilSpawn: `${timeUntilSpawn} minutos até o spawn` 
        });

        // Verificar/criar registro de notificação no Firebase
        const notificationRef = doc(db, 'bossNotifications', boss.id);
        const notificationDoc = await getDoc(notificationRef);
        const notificationData = notificationDoc.exists() 
          ? notificationDoc.data() as NotificationRecord
          : {
              thirtyMin: false,
              fiveMin: false,
              lastUpdated: new Date(0)
            };

        const now = new Date();
        const COOLDOWN_PERIOD = 5 * 60 * 1000; // 5 minutos em milissegundos

        try {
          // Verifica cada intervalo de tempo com cooldown
          if (timeUntilSpawn <= 30 && timeUntilSpawn >= 29 && !notificationData.thirtyMin) {
            const lastNotification = notificationData.lastThirtyMinNotification?.toDate();
            const canSendNotification = !lastNotification || 
              (now.getTime() - lastNotification.getTime()) > COOLDOWN_PERIOD;

            if (canSendNotification) {
              logger.info('useDiscordNotifications', 'Enviando notificação', { 
                boss: boss.name, 
                tempo: '30 minutos' 
              });
              await sendNotification(boss, 30);
              await setDoc(notificationRef, {
                ...notificationData,
                thirtyMin: true,
                lastThirtyMinNotification: serverTimestamp(),
                lastUpdated: serverTimestamp()
              });
            } else {
              logger.debug('useDiscordNotifications', 'Notificação em cooldown', {
                boss: boss.name,
                tempo: '30 minutos',
                ultimaNotificacao: lastNotification
              });
            }
          }
          else if (timeUntilSpawn <= 5 && timeUntilSpawn >= 4 && !notificationData.fiveMin) {
            const lastNotification = notificationData.lastFiveMinNotification?.toDate();
            const canSendNotification = !lastNotification || 
              (now.getTime() - lastNotification.getTime()) > COOLDOWN_PERIOD;

            if (canSendNotification) {
              logger.info('useDiscordNotifications', 'Enviando notificação', { 
                boss: boss.name, 
                tempo: '5 minutos' 
              });
              await sendNotification(boss, 5);
              await setDoc(notificationRef, {
                ...notificationData,
                fiveMin: true,
                lastFiveMinNotification: serverTimestamp(),
                lastUpdated: serverTimestamp()
              });
            } else {
              logger.debug('useDiscordNotifications', 'Notificação em cooldown', {
                boss: boss.name,
                tempo: '5 minutos',
                ultimaNotificacao: lastNotification
              });
            }
          }

          // Limpar notificações antigas (mais de 1 hora após o spawn)
          if (timeUntilSpawn < -60) {
            await setDoc(notificationRef, {
              thirtyMin: false,
              fiveMin: false,
              lastThirtyMinNotification: null,
              lastFiveMinNotification: null,
              lastUpdated: serverTimestamp()
            });
          }
        } catch (error) {
          logger.error('useDiscordNotifications', 'Erro ao notificar boss', { 
            boss: boss.name, 
            error 
          });
        }
      }
    } finally {
      isCheckingRef.current = false;
    }
  };

  const sendNotification = async (boss: Boss, minutes: number) => {
    logger.debug('useDiscordNotifications', 'Preparando payload', { 
      boss: boss.name,
      minutes 
    });
    const payload = discordService.createBossNotificationPayload(boss, minutes);
    logger.debug('useDiscordNotifications', 'Payload criado', { payload });
    await discordService.sendNotification(webhookUrl, payload);
    logger.info('useDiscordNotifications', 'Notificação enviada com sucesso', { 
      boss: boss.name,
      minutes 
    });
  };

  useEffect(() => {
    // Executa imediatamente ao montar o componente ou quando os bosses mudarem
    checkUpcomingBosses();
    
    // Depois verifica a cada 1 minuto
    const interval = setInterval(checkUpcomingBosses, 60000);
    return () => clearInterval(interval);
  }, [bosses, webhookUrl]);
}; 
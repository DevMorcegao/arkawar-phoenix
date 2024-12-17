import { useEffect, useRef } from 'react';
import { discordService } from '@/lib/services/discordService';
import { Boss } from '@/app/types/boss';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

interface NotificationRecord {
  thirtyMin: boolean;
  twentyMin: boolean;
  tenMin: boolean;
  fiveMin: boolean;
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
              twentyMin: false,
              tenMin: false,
              fiveMin: false,
              lastUpdated: new Date(0)
            };

        try {
          // Verifica cada intervalo de tempo
          if (timeUntilSpawn <= 30 && timeUntilSpawn >= 29 && !notificationData.thirtyMin) {
            logger.info('useDiscordNotifications', 'Enviando notificação', { 
              boss: boss.name, 
              tempo: '30 minutos' 
            });
            await sendNotification(boss, 30);
            await setDoc(notificationRef, {
              ...notificationData,
              thirtyMin: true,
              lastUpdated: serverTimestamp()
            });
          }
          else if (timeUntilSpawn <= 20 && timeUntilSpawn >= 19 && !notificationData.twentyMin) {
            logger.info('useDiscordNotifications', 'Enviando notificação', { 
              boss: boss.name, 
              tempo: '20 minutos' 
            });
            await sendNotification(boss, 20);
            await setDoc(notificationRef, {
              ...notificationData,
              twentyMin: true,
              lastUpdated: serverTimestamp()
            });
          }
          else if (timeUntilSpawn <= 10 && timeUntilSpawn >= 9 && !notificationData.tenMin) {
            logger.info('useDiscordNotifications', 'Enviando notificação', { 
              boss: boss.name, 
              tempo: '10 minutos' 
            });
            await sendNotification(boss, 10);
            await setDoc(notificationRef, {
              ...notificationData,
              tenMin: true,
              lastUpdated: serverTimestamp()
            });
          }
          else if (timeUntilSpawn <= 5 && timeUntilSpawn >= 4 && !notificationData.fiveMin) {
            logger.info('useDiscordNotifications', 'Enviando notificação', { 
              boss: boss.name, 
              tempo: '5 minutos' 
            });
            await sendNotification(boss, 5);
            await setDoc(notificationRef, {
              ...notificationData,
              fiveMin: true,
              lastUpdated: serverTimestamp()
            });
          }

          // Limpar notificações antigas (mais de 1 hora após o spawn)
          if (timeUntilSpawn < -60) {
            await setDoc(notificationRef, {
              thirtyMin: false,
              twentyMin: false,
              tenMin: false,
              fiveMin: false,
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
    
    // Depois verifica a cada 30 segundos
    const interval = setInterval(checkUpcomingBosses, 30000);
    return () => clearInterval(interval);
  }, [bosses, webhookUrl]);
}; 
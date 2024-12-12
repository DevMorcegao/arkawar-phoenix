import { useState, useEffect } from 'react';
import { discordService } from '@/lib/services/discordService';
import { Boss } from '@/app/types/boss';

interface NotificationRecord {
  thirtyMin: boolean;
  twentyMin: boolean;
  tenMin: boolean;
  fiveMin: boolean;
}

export const useDiscordNotifications = (bosses: Boss[], webhookUrl: string) => {
  const [notifiedBosses, setNotifiedBosses] = useState<Record<string, NotificationRecord>>({});

  const checkUpcomingBosses = async () => {
    const currentTime = new Date();

    for (const boss of bosses) {
      if (boss.status !== 'pending') continue;

      const spawnTime = new Date(boss.spawnTime);
      const timeUntilSpawn = Math.floor(
        (spawnTime.getTime() - currentTime.getTime()) / (1000 * 60)
      );

      // Inicializa o registro de notificações para este boss se não existir
      if (!notifiedBosses[boss.id]) {
        setNotifiedBosses(prev => ({
          ...prev,
          [boss.id]: {
            thirtyMin: false,
            twentyMin: false,
            tenMin: false,
            fiveMin: false
          }
        }));
      }

      try {
        // Verifica cada intervalo de tempo
        if (timeUntilSpawn <= 30 && timeUntilSpawn > 29 && !notifiedBosses[boss.id]?.thirtyMin) {
          await sendNotification(boss, 30);
          setNotifiedBosses(prev => ({
            ...prev,
            [boss.id]: { ...prev[boss.id], thirtyMin: true }
          }));
        }
        else if (timeUntilSpawn <= 20 && timeUntilSpawn > 19 && !notifiedBosses[boss.id]?.twentyMin) {
          await sendNotification(boss, 20);
          setNotifiedBosses(prev => ({
            ...prev,
            [boss.id]: { ...prev[boss.id], twentyMin: true }
          }));
        }
        else if (timeUntilSpawn <= 10 && timeUntilSpawn > 9 && !notifiedBosses[boss.id]?.tenMin) {
          await sendNotification(boss, 10);
          setNotifiedBosses(prev => ({
            ...prev,
            [boss.id]: { ...prev[boss.id], tenMin: true }
          }));
        }
        else if (timeUntilSpawn <= 5 && timeUntilSpawn > 4 && !notifiedBosses[boss.id]?.fiveMin) {
          await sendNotification(boss, 5);
          setNotifiedBosses(prev => ({
            ...prev,
            [boss.id]: { ...prev[boss.id], fiveMin: true }
          }));
        }
      } catch (error) {
        console.error(`Erro ao notificar boss ${boss.name}:`, error);
      }
    }
  };

  const sendNotification = async (boss: Boss, minutes: number) => {
    const payload = discordService.createBossNotificationPayload(boss, minutes);
    await discordService.sendNotification(webhookUrl, payload);
  };

  useEffect(() => {
    const interval = setInterval(checkUpcomingBosses, 60000); // Ainda verifica a cada minuto
    return () => clearInterval(interval);
  }, [bosses, webhookUrl]);

  return {
    notifiedBosses,
    resetNotifications: () => setNotifiedBosses({})
  };
};
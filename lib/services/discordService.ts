import axios from 'axios';
import { DiscordWebhookPayload } from '@/app/types/discord';
import { Boss } from '@/app/types/boss';
import { logger } from '@/lib/logger';

export const discordService = {
  async sendNotification(webhookUrl: string, payload: DiscordWebhookPayload) {
    try {
      const response = await axios.post(webhookUrl, payload);
      return response.data;
    } catch (error) {
      logger.error('discordService', 'Erro ao enviar notificação para o Discord', { error });
      throw error;
    }
  },

  createBossNotificationPayload(boss: Boss, minutes: number): DiscordWebhookPayload {
    // Converter o horário para GMT-3 (Brasília)
    const spawnTime = new Date(boss.spawnTime);
    
    // Formatar o horário usando Intl.DateTimeFormat para garantir o formato 24h
    const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Sao_Paulo'
    });

    return {
      content: `@everyone\n🚨 **ALERTA DE BOSS** 🚨\nO boss **${boss.name}** vai nascer em ${minutes} minutos!`,
      embeds: [{
        title: "📋 Informações do Boss",
        fields: [
          {
            name: "🎯 Boss",
            value: boss.name,
            inline: false
          },
          {
            name: "🗺️ Local",
            value: boss.spawnMap,
            inline: false
          },
          {
            name: "📢 Canal",
            value: boss.channel || "Não especificado",
            inline: false
          },
          {
            name: "⏰ Horário de Spawn (GMT-3 BRASIL)",
            value: timeFormatter.format(spawnTime),
            inline: false
          }
        ],
        color: minutes <= 5 ? 15158332 : 15105570 // Vermelho para 5min, laranja para outros
      }]
    };
  }
}; 
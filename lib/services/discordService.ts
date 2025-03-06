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

    // Determinar a cor baseada no tempo restante
    const color = minutes <= 5 ? 0xFF0000 : 0xFFA500; // Vermelho para 5min, laranja para 30min

    // Criar uma mensagem mais chamativa baseada no tempo
    const urgencyPrefix = minutes <= 5 ? '🚨 **ALERTA DE BOSS URGENTE** 🚨' : '📢 **ALERTA DE BOSS** 📢';
    const timeMessage = minutes <= 5 
      ? `⚠️ **ATENÇÃO!** O boss **${boss.name}** nascerá em **${minutes} minutos**!⚠️`
      : `O boss **${boss.name}** nascerá em **${minutes} minutos**!`;

    // Formatar o horário com a cor correspondente
    const formattedTime = minutes <= 5
      ? `**\`${timeFormatter.format(spawnTime)}\`** 🔴`
      : `**\`${timeFormatter.format(spawnTime)}\`** 🟡`;

    return {
      content: `@everyone\n${urgencyPrefix}\n\n${timeMessage}`,
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
            value: boss.spawnMap || "Não especificado",
            inline: false
          },
          {
            name: "📢 Canal",
            value: boss.channel || "Não especificado",
            inline: false
          },
          {
            name: "⏰ Horário de Spawn (GMT-3 BRASIL)",
            value: formattedTime,
            inline: false
          }
        ],
        color: color,
        footer: {
          text: "Guild Phoenix © Since 2023"
        },
        timestamp: new Date().toISOString()
      }]
    };
  }
}; 
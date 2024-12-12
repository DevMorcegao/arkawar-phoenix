export interface DiscordWebhookPayload {
  content?: string;
  embeds?: {
    title: string;
    fields: {
      name: string;
      value: string;
      inline?: boolean;
    }[];
    color?: number;
  }[];
}

export interface BossNotification {
  bossName: string;
  spawnTime: Date;
  notified: boolean;
} 
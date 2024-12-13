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
  bossId: string;
  minutes: number;
  sentAt: Date;
} 
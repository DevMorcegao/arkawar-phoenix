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
    footer?: {
      text: string;
    };
    timestamp?: string;
  }[];
}

export interface BossNotification {
  bossId: string;
  minutes: number;
  sentAt: Date;
} 
import { discordService } from "@/lib/services/discordService";
import { Boss } from '@/app/types/boss';

export const TestNotification = () => {
  const handleTestNotification = async () => {
    const webhookUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL!;
    const testDate = new Date();
    testDate.setMinutes(testDate.getMinutes() + 30);

    // Criando um boss de teste
    const testBoss: Boss = {
      id: 'test-id',
      name: 'Boss Teste',
      spawnMap: 'Mapa Teste',
      channel: 'Canal Teste',
      appearanceStatus: 'detected',
      spawnTime: testDate.toISOString(),
      status: 'pending'
    };

    try {
      const payload = discordService.createBossNotificationPayload(testBoss);
      await discordService.sendNotification(webhookUrl, payload);
      alert("Notificação enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
      alert("Erro ao enviar notificação!");
    }
  };

  return (
    <button 
      onClick={handleTestNotification}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Testar Notificação Discord
    </button>
  );
};
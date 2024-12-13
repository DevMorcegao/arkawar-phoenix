import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import axios from 'axios';

interface ServiceAccount {
  projectId: string | undefined;
  privateKey: string | undefined;
  clientEmail: string | undefined;
}

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

initializeApp({
  credential: cert(serviceAccount as Required<ServiceAccount>),
});

const db = getFirestore();

async function checkBosses() {
  console.log('🔍 Iniciando verificação de bosses...');
  
  const now = new Date();
  console.log(`⏰ Hora atual: ${now.toISOString()}`);
  
  try {
    // Limpar notificações antigas (mais de 1 hora)
    const oldNotifications = await db.collection('bossNotifications')
      .where('sentAt', '<', new Date(now.getTime() - 60 * 60 * 1000))
      .get();
    
    console.log(`🧹 Limpando ${oldNotifications.size} notificações antigas`);
    
    for (const doc of oldNotifications.docs) {
      await doc.ref.delete();
    }

    const bossesSnapshot = await db.collection('bossSpawns')
      .where('status', '==', 'pending')
      .get();

    console.log(`📋 Bosses encontrados: ${bossesSnapshot.size}`);

    const notificationsRef = db.collection('bossNotifications');

    for (const doc of bossesSnapshot.docs) {
      const boss = doc.data();
      console.log('Boss data:', boss);

      const spawnTime = new Date(boss.spawnTime);
      console.log(`Spawn time: ${spawnTime.toISOString()}`);
      
      const timeUntilSpawn = Math.floor(
        (spawnTime.getTime() - now.getTime()) / (1000 * 60)
      );
      
      console.log(`Minutos até o spawn: ${timeUntilSpawn}`);

      const intervals = [30, 20, 10, 5];
      for (const minutes of intervals) {
        if (timeUntilSpawn >= minutes - 1 && timeUntilSpawn <= minutes) {
          const notificationId = `${boss.id}_${minutes}`;
          const notificationDoc = await notificationsRef.doc(notificationId).get();
          
          // Verifica se a notificação existe e se foi enviada há mais de 1 hora
          const shouldNotify = !notificationDoc.exists || 
            (notificationDoc.exists && 
             notificationDoc.data()?.sentAt.toDate().getTime() < now.getTime() - 60 * 60 * 1000);

          if (shouldNotify) {
            console.log(`Enviando nova notificação de ${minutes} minutos...`);
            console.log(`Tentando enviar notificação de ${minutes} minutos para ${boss.name} (Canal ${boss.channel})`);
            
            try {
              const response = await axios.post(process.env.DISCORD_WEBHOOK_URL!, {
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
                      name: "⏰ Horário de Spawn",
                      value: new Date(spawnTime).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Sao_Paulo'
                      }),
                      inline: false
                    }
                  ],
                  color: minutes <= 5 ? 15158332 : 15105570
                }]
              });
              console.log('Resposta do Discord:', response.status);

              await notificationsRef.doc(notificationId).set({
                bossId: boss.id,
                minutes,
                sentAt: new Date()
              });
              console.log('Notificação registrada no Firestore');
            } catch (error) {
              console.error('Erro ao enviar notificação:', error);
              if (axios.isAxiosError(error)) {
                console.error('Detalhes do erro:', error.response?.data);
              }
            }
          } else {
            console.log(`Notificação de ${minutes} minutos já enviada recentemente`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao processar notificações:', error);
    console.error('Detalhes do erro:', error instanceof Error ? error.message : error);
  }
}

checkBosses(); 
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
        if (timeUntilSpawn <= minutes && timeUntilSpawn > minutes - 1) {
          console.log(`Enviando notificação de ${minutes} minutos`);
          
          const notificationId = `${boss.id}_${minutes}`;
          const notificationDoc = await notificationsRef.doc(notificationId).get();

          if (!notificationDoc.exists) {
            await axios.post(process.env.DISCORD_WEBHOOK_URL!, {
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
                    value: spawnTime.toLocaleTimeString('pt-BR', {
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

            await notificationsRef.doc(notificationId).set({
              bossId: boss.id,
              minutes,
              sentAt: new Date()
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao processar notificações:', error);
  }
}

checkBosses(); 
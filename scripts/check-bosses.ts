/**
 * SCRIPT COMENTADO - NÃO ESTÁ EM USO
 * 
 * Este script verifica os bosses no Firestore.
 * Para usar, descomente o código abaixo.




// import { initializeApp, cert } from 'firebase-admin/app';
// import { getFirestore } from 'firebase-admin/firestore';
// import axios from 'axios';
// import { logger } from '../lib/logger';

// interface ServiceAccount {
//   projectId: string | undefined;
//   privateKey: string | undefined;
//   clientEmail: string | undefined;
// }

// const serviceAccount: ServiceAccount = {
//   projectId: process.env.FIREBASE_PROJECT_ID,
//   privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//   clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
// };

// initializeApp({
//   credential: cert(serviceAccount as Required<ServiceAccount>),
// });

// const db = getFirestore();

// async function checkBosses() {
//   logger.info('CheckBosses', 'Starting boss check');
  
//   const now = new Date();
//   logger.info('CheckBosses', 'Current time', { time: now.toISOString() });
  
//   try {
//     // Limpar notificações antigas (mais de 1 hora)
//     const oldNotifications = await db.collection('bossNotifications')
//       .where('sentAt', '<', new Date(now.getTime() - 60 * 60 * 1000))
//       .get();
    
//     logger.info('CheckBosses', 'Cleaning old notifications', { count: oldNotifications.size });
    
//     for (const doc of oldNotifications.docs) {
//       await doc.ref.delete();
//     }

//     // Buscar todos os bosses pendentes em uma única query
//     const bossesSnapshot = await db.collection('bossSpawns')
//       .where('status', '==', 'pending')
//       .get();

//     logger.info('CheckBosses', 'Bosses found', { count: bossesSnapshot.size });

//     const notificationsRef = db.collection('bossNotifications');

//     for (const doc of bossesSnapshot.docs) {
//       const boss = doc.data();
//       const spawnTime = new Date(boss.spawnTime);
//       const timeUntilSpawn = Math.floor(
//         (spawnTime.getTime() - now.getTime()) / (1000 * 60)
//       );
      
//       const intervals = [30, 20, 10, 5];
//       for (const minutes of intervals) {
//         if (timeUntilSpawn >= minutes - 1 && timeUntilSpawn <= minutes) {
//           const notificationId = `${boss.id}_${minutes}`;
//           const notificationDoc = await notificationsRef.doc(notificationId).get();
          
//           const shouldNotify = !notificationDoc.exists || 
//             (notificationDoc.exists && 
//              notificationDoc.data()?.sentAt.toDate().getTime() < now.getTime() - 60 * 60 * 1000);

//           if (shouldNotify) {
//             logger.info('CheckBosses', `Sending ${minutes} minutes notification`, {
//               boss: boss.name,
//               channel: boss.channel
//             });

//             try {
//               // Enviar uma única notificação para o Discord
//               const response = await axios.post(process.env.DISCORD_WEBHOOK_URL!, {
//                 content: `@everyone\n🚨 **ALERTA DE BOSS** 🚨\nO boss **${boss.name}** vai nascer em ${minutes} minutos!`,
//                 embeds: [{
//                   title: "📋 Informações do Boss",
//                   fields: [
//                     {
//                       name: "🎯 Boss",
//                       value: boss.name,
//                       inline: false
//                     },
//                     {
//                       name: "🗺️ Local",
//                       value: boss.spawnMap,
//                       inline: false
//                     },
//                     {
//                       name: "📢 Canal",
//                       value: boss.channel || "Não especificado",
//                       inline: false
//                     },
//                     {
//                       name: "⏰ Horário de Spawn",
//                       value: new Date(spawnTime).toLocaleTimeString('pt-BR', {
//                         hour: '2-digit',
//                         minute: '2-digit',
//                         timeZone: 'America/Sao_Paulo'
//                       }),
//                       inline: false
//                     }
//                   ],
//                   color: minutes <= 5 ? 15158332 : 15105570
//                 }]
//               });

//               logger.debug('CheckBosses', 'Discord response status', { status: response.status });

//               // Registrar a notificação enviada
//               await notificationsRef.doc(notificationId).set({
//                 bossId: boss.id,
//                 minutes,
//                 sentAt: new Date()
//               });
              
//               logger.info('CheckBosses', 'Notification registered in Firestore');
//             } catch (error) {
//               logger.error('CheckBosses', 'Error sending notification', { error });
//               if (axios.isAxiosError(error)) {
//                 logger.error('CheckBosses', 'Error details', { 
//                   details: axios.isAxiosError(error) ? error.response?.data : error 
//                 });
//               }
//             }
//           } else {
//             logger.debug('CheckBosses', `${minutes} minutes notification already sent recently`);
//           }
//         }
//       }
//     }
//   } catch (error) {
//     logger.error('CheckBosses', 'Error processing notifications', { error });
//     console.error('Detalhes do erro:', error instanceof Error ? error.message : error);
//   }
// }

// checkBosses(); 

*/
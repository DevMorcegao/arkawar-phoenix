/**
 * Script para limpeza automática de bosses antigos no Firebase.
 * 
 * IMPORTANTE:
 * 1. Para executar em produção:
 *    - Necessário ter o arquivo service-account.json na raiz do projeto
 *    - Rodar com o comando:
 *      $env:NEXT_PUBLIC_FIREBASE_ENV='production'; npx ts-node scripts/cleanup-bosses.ts
 * 
 * 2. Para executar em desenvolvimento:
 *    - Não precisa do service-account.json
 *    - Usa as credenciais do .env.local
 *    - Rodar com o comando:
 *      npx ts-node scripts/cleanup-bosses.ts
 * 
 * O script limpa:
 * - Bosses killed há mais de 48 horas
 * - Bosses deleted há mais de 48 horas
 * - Bosses noshow há mais de 48 horas


import { initializeApp, cert, ServiceAccount, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const env = process.env.NEXT_PUBLIC_FIREBASE_ENV || 'development';

let app: App;
let db: Firestore;

if (env === 'production') {
  // Em produção, usa o service account
  const serviceAccountPath = path.resolve(process.cwd(), '@service-account.json.bak');
  
  // Verificar se o arquivo existe
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Arquivo de credenciais não encontrado: ${serviceAccountPath}`);
  }

  const serviceAccount: ServiceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, 'utf8')
  );
  app = initializeApp({
    credential: cert(serviceAccount)
  });
  db = getFirestore(app);
} else {
  // Em desenvolvimento, usa as credenciais normais
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_DEV_API_KEY,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_DEV_PROJECT_ID
  };
  app = initializeApp(config);
  db = getFirestore(app);
}

export async function cleanupOldBosses() {
  try {
    console.log('✅ Usando credenciais de serviço');
    
    // Calcular data limite (2 dias atrás)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0); // Zerar horas para pegar todo o dia

    // Calcular data limite em milissegundos (48 horas)
    const now = new Date();
    const msIn48Hours = 48 * 60 * 60 * 1000;

    console.log(`🕒 Data limite: ${twoDaysAgo.toISOString()}`);
    console.log(`⏰ Idade limite: 48 horas (${msIn48Hours}ms)`);

    // Buscar todos os bosses killed, deleted ou noshow
    console.log('🔍 Buscando todos os bosses killed, deleted ou noshow...');
    const bossSpawnsRef = db.collection('bossSpawns');
    const allKilledQuery = bossSpawnsRef.where('status', 'in', ['killed', 'deleted', 'noshow']);

    const allKilledSnapshot = await allKilledQuery.get();
    const allBosses = allKilledSnapshot.docs;
    console.log(`📊 Total de bosses encontrados: ${allBosses.length}`);

    let deletedCount = 0;
    for (const doc of allBosses) {
      const data = doc.data();
      const endTime = data.killedAt?.toDate() || data.deletedAt?.toDate() || data.noShowAt?.toDate();
      
      if (endTime && (now.getTime() - endTime.getTime() > msIn48Hours)) {
        await doc.ref.delete();
        deletedCount++;
        console.log(`🗑️ Deletado boss ${doc.id} (${data.status} em ${endTime.toISOString()})`);
      }
    }

    console.log(`✨ Limpeza concluída! ${deletedCount} bosses removidos.`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Erro ao limpar bosses antigos:', error);
    throw error;
  }
}

// Executar a limpeza se chamado diretamente
if (require.main === module) {
  cleanupOldBosses()
    .then((total) => {
      console.log(`Limpeza concluída. ${total} bosses deletados.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro:', error);
      process.exit(1);
    });
} 
 */
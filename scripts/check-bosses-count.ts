/**
 * SCRIPT COMENTADO - NÃO ESTÁ EM USO
 * 
 * Este script verifica a contagem de bosses no Firestore.
 * Para usar, descomente o código abaixo.
 */

/*
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

async function checkBossCounts() {
  try {
    // Calcular timestamp de 48 horas atrás
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    // 1. Total de bosses nas últimas 48 horas (todos os status)
    const recentBossesQuery = query(
      collection(db, 'bossSpawns'),
      where('lastUpdated', '>=', fortyEightHoursAgo),
      orderBy('lastUpdated', 'desc')
    );
    const recentBossesSnapshot = await getDocs(recentBossesQuery);
    const totalRecentBosses = recentBossesSnapshot.size;

    // 2. Total por status nas últimas 48 horas
    const statusQueries = ['pending', 'killed', 'noshow', 'deleted'].map(status => {
      return query(
        collection(db, 'bossSpawns'),
        where('status', '==', status),
        where('lastUpdated', '>=', fortyEightHoursAgo),
        orderBy('lastUpdated', 'desc')
      );
    });

    const statusSnapshots = await Promise.all(statusQueries.map(q => getDocs(q)));
    const [pendingSnapshot, killedSnapshot, noshowSnapshot, deletedSnapshot] = statusSnapshots;

    // Exibir resultados
    console.log('\nEstatísticas da Collection bossSpawns (últimas 48h):');
    console.log('=====================================');
    console.log(`Total de bosses nas últimas 48h: ${totalRecentBosses}`);
    console.log(`Total de bosses pendentes: ${pendingSnapshot.size}`);
    console.log(`Total de bosses killed: ${killedSnapshot.size}`);
    console.log(`Total de bosses noshow: ${noshowSnapshot.size}`);
    console.log(`Total de bosses deleted: ${deletedSnapshot.size}`);
    
    console.log('\nDetalhes dos bosses pendentes nas últimas 48h:');
    console.log('----------------------------------------');
    pendingSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.name} (${data.channel})`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Última atualização: ${data.lastUpdated?.toDate().toLocaleString()}`);
      console.log('----------------------------------------');
    });

  } catch (error) {
    console.error('Erro ao verificar contagens:', error);
  }
}

// Executar a verificação
checkBossCounts();
*/ 
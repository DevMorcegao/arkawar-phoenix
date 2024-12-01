/* eslint-disable @typescript-eslint/no-explicit-any */
import { BossData } from '../types/boss';
import { ImageProcessor } from './imageProcessing';
import { logger } from '@/lib/logger';

export const findBossByText = async (text: string, image: any, bossData: BossData[]): Promise<BossData | null> => {
  // Primeiro tenta o método tradicional
  const normalizedText = text.toLowerCase();
  let boss: BossData | null = null;
  
  // Tenta encontrar por título exato
  const titleMatch = text.match(/^([^]+?)\nThis is a Boss/m);
  if (titleMatch) {
    const title = titleMatch[1].trim();
    const foundBoss = bossData.find(b => 
      b.name.toLowerCase() === title.toLowerCase() ||
      b.searchTerms.some((term: string) => title.toLowerCase().includes(term))
    );
    if (foundBoss) {
      boss = foundBoss;
      return boss;
    }
  }

  // Se não encontrou por título, procura no texto todo
  for (const b of bossData) {
    if (b.searchTerms.some((term: string) => normalizedText.includes(term))) {
      boss = b;
      break;
    }
  }

  // Se encontrou um boss, usa o processamento com referência para confirmar
  if (boss && image) {
    try {
      const imageProcessor = new ImageProcessor({
        name: boss.name,
        spawnMap: boss.spawnMap,
        searchTerms: boss.searchTerms,
        regions: {
          bossName: { x: 0, y: 0, width: 0, height: 0 }, // Valores padrão
          channel: { x: 0, y: 0, width: 0, height: 0 },
          time: { x: 0, y: 0, width: 0, height: 0 }
        }
      });
      const results = await imageProcessor.processImageWithReference(image);
      
      // Verifica se o resultado do processamento com referência confirma o boss
      if (results.bossName && results.bossName.confidence > 0.7) {
        return boss;
      }
    } catch (error) {
      logger.error('TextProcessing', 'Error processing image with reference', { error });
    }
  }
  
  return boss; // Agora boss é explicitamente tipado como BossData | null
};

export const extractTimeFromText = (text: string): { hours: number; minutes: number } | null => {
  // Padrões para capturar horas e minutos, ou apenas minutos
  const patterns = [
    /(\d+)\s*hours?\s*and\s*(\d+)\s*(?:min(?:u(?:t(?:es?)?)?)?)/i,   // Ex: 2 hours and 18 min/mins/minu/minut/minute/minutes
    /(\d+)\s*hrs?\s*(?:and)?\s*(\d+)\s*(?:min(?:u(?:t(?:es?)?)?)?)/i,  // Ex: 2hr(s) 18min
    /(\d+)\s*h\s*(?:and)?\s*(\d+)\s*(?:min(?:u(?:t(?:es?)?)?)?)/i,     // Ex: 2h 18min
    /(\d+):(\d+)/,                                                       // Ex: 2:18
    /(\d+)\s*(?:min(?:u(?:t(?:es?)?)?)?)/i,                            // Ex: 18 min/mins/minu/minut/minute/minutes
  ]

  // Tenta cada padrão
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      // Se o padrão tem dois grupos (horas e minutos)
      if (match[2]) {
        const hours = parseInt(match[1])
        const minutes = parseInt(match[2])
        if (!isNaN(hours) && !isNaN(minutes)) {
          return { hours, minutes }
        }
      }
      // Se o padrão tem apenas um grupo (apenas minutos)
      else {
        const minutes = parseInt(match[1])
        if (!isNaN(minutes)) {
          return { hours: 0, minutes }
        }
      }
    }
  }

  return null
};

export const extractChannelFromText = (text: string): string | null => {
  // Substituir variações comuns do OCR para "Channel"
  const normalizedText = text
    .replace(/Come\s*(\d+)/gi, 'Channel $1')
    .replace(/channe1/gi, 'Channel')
    .replace(/Cromei/gi, 'Channel')
    .replace(/Cronei/gi, 'Channel')
    .replace(/Choone/gi, 'Channel')
    .replace(/Ghannel/gi, 'Channel')
    .replace(/Ghamnel/gi, 'Channel');

  // Procurar por "Channel X" onde X é um número
  const channelMatch = normalizedText.match(/Channel\s*(\d+)/i);
  if (channelMatch) {
    const channelNum = parseInt(channelMatch[1], 10);
    if (channelNum >= 1 && channelNum <= 13) {
      return channelNum.toString();
    }
  }

  // Procurar por números isolados que podem ser canais
  const numberMatch = normalizedText.match(/\b(\d+)\b/);
  if (numberMatch) {
    const channelNum = parseInt(numberMatch[1], 10);
    if (channelNum >= 1 && channelNum <= 13) {
      return channelNum.toString();
    }
  }

  return null;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const findBossByText = (text: string, bossData: any[]): { name: string; spawnMap: string } | null => {
  const normalizedText = text.toLowerCase()
  
  // First try to find by exact title match
  const titleMatch = text.match(/^([^]+?)\nThis is a Boss/m)
  if (titleMatch) {
    const title = titleMatch[1].trim()
    const boss = bossData.find(b => 
      b.name.toLowerCase() === title.toLowerCase() ||
      b.searchTerms.some((term: string) => title.toLowerCase().includes(term))
    )
    if (boss) return boss
  }

  // If no title match, try searching through the entire text
  for (const boss of bossData) {
    if (boss.searchTerms.some((term: string) => normalizedText.includes(term))) {
      return boss
    }
  }
  
  return null
}

export const extractTimeFromText = (text: string): { hours: number; minutes: number } | null => {
  // Padrões para capturar horas e minutos, ou apenas minutos
  const patterns = [
    /(\d+)\s*hours?\s*and\s*(\d+)\s*minutes?/i,   // Ex: 2 hours and 18 minutes
    /move\s*after\s*(\d+)\s*hours?\s*and\s*(\d+)\s*minutes?/i,
    /(\d+)h\s*(\d+)m/i,
    /(\d+)\s*minutes?/i                           // Ex: Closed in 36 minutes
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        hours: match[2] ? parseInt(match[1], 10) : 0,
        minutes: match[2] ? parseInt(match[2], 10) : parseInt(match[1], 10)
      };
    }
  }
  return null;
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

  const patterns = [
    /Channel\s*(\d+)\s*-\s*Not\s*Appeared/i,
    /Channel\s*(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
};

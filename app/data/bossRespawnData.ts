interface BossRespawnInfo {
  minHours: number;
  maxHours: number;
}

interface BossRespawnData {
  [key: string]: BossRespawnInfo;
}

export const bossRespawnData: BossRespawnData = {
  'Illusion of Kundun': {
    minHours: 12,
    maxHours: 24
  },
  'Nightmare': {
    minHours: 36,
    maxHours: 36
  },
  'Selupan': {
    minHours: 24,
    maxHours: 32
  },
  'Lord Silvester': {
    minHours: 24,
    maxHours: 32
  },
  'Core Magriffy': {
    minHours: 24,
    maxHours: 32
  },
  'Lord of Ferea': {
    minHours: 24,
    maxHours: 32
  },
  'Nix': {
    minHours: 48,
    maxHours: 60
  },
  'God of Darkness': {
    minHours: 48,
    maxHours: 60
  }
}

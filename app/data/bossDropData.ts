interface BossDrop {
  quantity: number;
  item: string;
}

interface BossDropInfo {
  mainDrops: BossDrop[];
  bonusDrops?: BossDrop[];
  bonusChance?: number;
}

interface BossDropData {
  [key: string]: BossDropInfo;
}

export const bossDropData: BossDropData = {
  'Illusion of Kundun': {
    mainDrops: [
      { quantity: 50, item: 'Goblin Points' },
      { quantity: 3, item: 'Mastery Box (Greater)' },
      { quantity: 15, item: 'Jewel of Bless' },
      { quantity: 15, item: 'Jewel of Soul' },
      { quantity: 4, item: 'Ancient Item' },
      { quantity: 1, item: 'Rage Earring (L/R)' },
      { quantity: 2, item: 'Ability Crystal [B]' },
      { quantity: 1, item: 'Boss Emblem (I)' }
    ],
    bonusDrops: [
      { quantity: 1, item: '(Hero) Bloodangel Spirit' },
      { quantity: 1, item: 'Talisman of Chaos Assembly' }
    ],
    bonusChance: 50
  },
  'Nightmare': {
    mainDrops: [
      { quantity: 50, item: 'Goblin Points' },
      { quantity: 5, item: 'Elemental Talisman of Chaos' },
      { quantity: 15, item: 'Jewel of Creation' },
      { quantity: 15, item: 'Lapidary Stone' },
      { quantity: 1, item: 'Rage Earring (L/R)' },
      { quantity: 2, item: 'Ability Crystal [B]' },
      { quantity: 1, item: 'Boss Emblem (II)' }
    ],
    bonusDrops: [
      { quantity: 1, item: '(Hero) Bloodangel Spirit' },
      { quantity: 1, item: 'Talisman of Chaos Assembly' }
    ],
    bonusChance: 50
  },
  'Maya Hands': {
    mainDrops: [
      { quantity: 2, item: 'Elemental Talisman of Luck' }
    ]
  },
  'Selupan': {
    mainDrops: [
      { quantity: 50, item: 'Goblin Points' },
      { quantity: 3, item: 'Mastery Box (Greater)' },
      { quantity: 4, item: 'Socket Sets 380' },
      { quantity: 4, item: 'Socket Weapons 380' },
      { quantity: 4, item: 'Ancient Item' },
      { quantity: 3, item: 'Excellent Weapon' },
      { quantity: 15, item: 'Jewel of Creation' },
      { quantity: 15, item: 'Lapidary Stone' },
      { quantity: 2, item: 'Ability Crystal [B]' },
      { quantity: 1, item: 'Boss Emblem (I)' }
    ],
    bonusDrops: [
      { quantity: 1, item: '(Hero) Bloodangel Spirit' },
      { quantity: 1, item: 'Talisman of Chaos Assembly' }
    ],
    bonusChance: 50
  },
  'Lord Silvester': {
    mainDrops: [
      { quantity: 100, item: 'Goblin Points' },
      { quantity: 3, item: 'Mastery Box (Greater)' },
      { quantity: 5, item: 'Socket Sets 400' },
      { quantity: 3, item: 'Socket Weapons 400' },
      { quantity: 15, item: 'Jewel of Soul' },
      { quantity: 15, item: 'Lapidary Stone' },
      { quantity: 1, item: 'Pentagram Lv. 300' },
      { quantity: 2, item: 'Ability Crystal [B]' },
      { quantity: 1, item: 'Boss Emblem (II)' }
    ],
    bonusDrops: [
      { quantity: 1, item: '(Hero) Bloodangel Spirit' },
      { quantity: 1, item: 'Talisman of Chaos Assembly' },
      { quantity: 1, item: 'Elemental Talisman of Chaos' }
    ],
    bonusChance: 50
  },
  'Core Magriffy': {
    mainDrops: [
      { quantity: 100, item: 'Goblin Points' },
      { quantity: 3, item: 'Mastery Box (Greater)' },
      { quantity: 15, item: 'Jewel of Bless' },
      { quantity: 15, item: 'Lapidary Stone' },
      { quantity: 1, item: 'Pentagram Lv. 300' },
      { quantity: 1, item: 'Mount (Evolved)' },
      { quantity: 2, item: 'Ability Crystal [B]' },
      { quantity: 1, item: 'Boss Emblem (II)' }
    ],
    bonusDrops: [
      { quantity: 1, item: '(Hero) Bloodangel Spirit' },
      { quantity: 1, item: 'Talisman of Chaos Assembly' },
      { quantity: 1, item: 'Elemental Talisman of Chaos' }
    ],
    bonusChance: 50
  },
  'Lord of Ferea': {
    mainDrops: [
      { quantity: 150, item: 'Goblin Points' },
      { quantity: 3, item: 'Mastery Box (Greater)' },
      { quantity: 1, item: 'Pentagram Lv. 300' },
      { quantity: 15, item: 'Jewel of Bless' },
      { quantity: 15, item: 'Jewel of Soul' },
      { quantity: 4, item: 'Sealed Bloodangel' },
      { quantity: 2, item: 'Ability Crystal [B]' },
      { quantity: 1, item: 'Boss Emblem (II)' }
    ],
    bonusDrops: [
      { quantity: 1, item: '(Hero) Bloodangel Spirit' },
      { quantity: 1, item: 'Talisman of Chaos Assembly' },
      { quantity: 1, item: 'Elemental Talisman of Chaos' }
    ],
    bonusChance: 50
  },
  'Nix': {
    mainDrops: [
      { quantity: 2000, item: 'Goblin Points' },
      { quantity: 3, item: 'Seed Sphere (Step: 2~5)' },
      { quantity: 20, item: 'Jewel of Bless' },
      { quantity: 20, item: 'Jewel of Soul' },
      { quantity: 2, item: 'Pentagram Lv. 300' },
      { quantity: 3, item: 'Mysterious Stone' },
      { quantity: 10, item: 'Golden Sentence' },
      { quantity: 2, item: 'Ability Crystal [B]' },
      { quantity: 1, item: 'Boss Emblem (II)' }
    ]
  },
  'God of Darkness': {
    mainDrops: [
      { quantity: 2000, item: 'Goblin Points' },
      { quantity: 3, item: 'Mysterious Stone' },
      { quantity: 2, item: 'Pentagram Lv. 300' },
      { quantity: 20, item: 'Jewel of Creation' },
      { quantity: 20, item: 'Lapidary Stone' },
      { quantity: 5, item: 'Uriel\'s Feather' },
      { quantity: 2, item: 'Ability Crystal [B]' },
      { quantity: 3, item: 'Boss Emblem (III)' }
    ]
  }
}

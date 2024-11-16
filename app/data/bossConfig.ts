export interface BossReferenceConfig {
  name: string;
  searchTerms: string[];
  spawnMap: string;
  referenceImage: string;
  regions: {
    time?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    channel?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    bossName?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

export const bossConfigs: BossReferenceConfig[] = [
  {
    name: "Illusion of Kundun",
    searchTerms: ['illusion', 'kundun', 'kundi', 'kalima'],
    spawnMap: "Kalima 7",
    referenceImage: "/data/reference-images/illusion_of_kundun_reference.png",
    regions: {
      time: {
        x: 671,
        y: 494,
        width: 171,
        height: 20
      },
      channel: {
        x: 628,
        y: 462,
        width: 189,
        height: 19
      },
      bossName: {
        x: 242,
        y: 84,
        width: 53,
        height: 21
      }
    }
  },
  {
    name: "Core Magriffy",
    searchTerms: ['core', 'magriffy', 'nars', 'magrify', 'magryf'],
    spawnMap: "Nars",
    referenceImage: "/data/reference-images/core_magriffy_reference.png",
    regions: {
      time: {
        x: 673,
        y: 487,
        width: 165,
        height: 25
      },
      channel: {
        x: 625,
        y: 459,
        width: 188,
        height: 20
      },
      bossName: {
        x: 240,
        y: 84,
        width: 40,
        height: 16
      }
    }
  },
  {
    name: "God of Darkness",
    searchTerms: ['darkness', 'swamp', 'arknes', 'ness'],
    spawnMap: "Swamp of Darkness",
    referenceImage: "/data/reference-images/god_of_darkness_reference.png",
    regions: {
      time: {
        x: 687,
        y: 491,
        width: 154,
        height: 21
      },
      channel: {
        x: 628,
        y: 460,
        width: 192,
        height: 19
      },
      bossName: {
        x: 318,
        y: 83,
        width: 69,
        height: 25
      }
    }
  },
  {
    name: "Lord of Ferea",
    searchTerms: ['ferea', 'lord of ferea', 'erea', 'fere'],
    spawnMap: "Ferea",
    referenceImage: "/data/reference-images/lord_of_ferea_reference.png",
    regions: {
      time: {
        x: 679,
        y: 490,
        width: 162,
        height: 20
      },
      channel: {
        x: 625,
        y: 455,
        width: 192,
        height: 20
      },
      bossName: {
        x: 245,
        y: 81,
        width: 46,
        height: 22
      }
    }
  },
  {
    name: "Lord Silvester",
    searchTerms: ['silvester', 'uruk', 'Mountain', 'ountain'],
    spawnMap: "Uruk Mountain",
    referenceImage: "/data/reference-images/lord_silvester_reference.png",
    regions: {
      time: {
        x: 671,
        y: 491,
        width: 164,
        height: 23
      },
      channel: {
        x: 621,
        y: 459,
        width: 190,
        height: 21
      },
      bossName: {
        x: 236,
        y: 83,
        width: 109,
        height: 24
      }
    }
  },
  {
    name: "Nix",
    searchTerms: ['nix', 'nixies', 'Nixes', 'nixes', 'lake'],
    spawnMap: "Nixies Lake",
    referenceImage: "/data/reference-images/nix_reference.png",
    regions: {
      time: {
        x: 682,
        y: 491,
        width: 156,
        height: 20
      },
      channel: {
        x: 624,
        y: 456,
        width: 191,
        height: 22
      },
      bossName: {
        x: 241,
        y: 84,
        width: 88,
        height: 20
      }
    }
  },
  {
    name: "Selupan",
    searchTerms: ['selupan', 'raklion', 'rakion', 'Rakiion', 'rakiion'],
    spawnMap: "Raklion",
    referenceImage: "/data/reference-images/selupan_reference.png",
    regions: {
      time: {
        x: 663,
        y: 492,
        width: 175,
        height: 18
      },
      channel: {
        x: 623,
        y: 457,
        width: 192,
        height: 20
      },
      bossName: {
        x: 240,
        y: 82,
        width: 60,
        height: 21
      }
    }
  }
];

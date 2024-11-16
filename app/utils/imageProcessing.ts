import { BossData } from '../types/boss';

interface OCRResult {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface BossProcessingConfig extends BossData {
  regions: {
    bossName?: { x: number; y: number; width: number; height: number };
    channel?: { x: number; y: number; width: number; height: number };
    time?: { x: number; y: number; width: number; height: number };
  };
}

export class ImageProcessor {
  constructor(private bossConfig: BossProcessingConfig) {}

  // Processa a imagem usando as regiões de referência
  async processImageWithReference(image: any): Promise<{
    bossName: OCRResult | null;
    channel: OCRResult | null;
    time: OCRResult | null;
  }> {
    const results = {
      bossName: null as OCRResult | null,
      channel: null as OCRResult | null,
      time: null as OCRResult | null
    };

    try {
      // Processa cada região definida na configuração
      if (this.bossConfig.regions.bossName) {
        results.bossName = await this.processRegion(image, 'bossName');
      }

      if (this.bossConfig.regions.channel) {
        results.channel = await this.processRegion(image, 'channel');
      }

      if (this.bossConfig.regions.time) {
        results.time = await this.processRegion(image, 'time');
      }
    } catch (error) {
      console.error('Error processing image regions:', error);
    }

    return results;
  }

  // Processa uma região específica da imagem
  private async processRegion(image: any, regionType: 'bossName' | 'channel' | 'time'): Promise<OCRResult | null> {
    const region = this.bossConfig.regions[regionType];
    if (!region) return null;

    try {
      // Aqui você implementaria:
      // 1. Recortar a região específica da imagem
      // 2. Pré-processar a imagem (ajuste de contraste, etc)
      // 3. Executar OCR na região
      // 4. Aplicar correções específicas baseadas no tipo de região

      const text = await this.simulateOCR(image, region);
      const correctedText = this.correctOCRErrors(text, regionType);

      if (this.validateResult(correctedText, regionType)) {
        return {
          text: correctedText,
          confidence: 0.8,
          boundingBox: region
        };
      }
    } catch (error) {
      console.error(`Error processing ${regionType} region:`, error);
    }

    return null;
  }

  // Simula o processamento OCR (substitua por sua implementação real)
  private async simulateOCR(image: any, region: { x: number; y: number; width: number; height: number }): Promise<string> {
    // Aqui você implementaria a lógica real de OCR
    return '';
  }

  // Corrige erros comuns de OCR baseado no contexto
  private correctOCRErrors(text: string, regionType: 'bossName' | 'channel' | 'time'): string {
    let corrected = text;

    // Correções específicas para números
    const numberCorrections: { [key: string]: string[] } = {
      '0': ['O', 'o', 'Q', 'D'],
      '1': ['l', 'I', 'i'],
      '6': ['b', 'G'],
      '9': ['g', 'q']
    };

    // Aplica correções baseadas no tipo de região
    switch (regionType) {
      case 'channel':
        corrected = corrected
          .replace(/Come\s*(\d+)/gi, 'Channel $1')
          .replace(/channe1/gi, 'Channel')
          .replace(/Cromei/gi, 'Channel')
          .replace(/Cronei/gi, 'Channel')
          .replace(/Choone/gi, 'Channel')
          .replace(/Ghannel/gi, 'Channel')
          .replace(/Ghamnel/gi, 'Channel');
        break;

      case 'time':
        corrected = corrected
          .replace(/[oO]/g, '0')
          .replace(/[lIi]/g, '1');
        break;
    }

    // Aplica correções de números para todas as regiões
    for (const [correct, mistakes] of Object.entries(numberCorrections)) {
      for (const mistake of mistakes) {
        const regex = new RegExp(mistake, 'g');
        corrected = corrected.replace(regex, correct);
      }
    }

    return corrected;
  }

  // Valida o resultado do OCR baseado no tipo de região
  private validateResult(text: string, regionType: 'bossName' | 'channel' | 'time'): boolean {
    if (!text) return false;
    
    switch (regionType) {
      case 'bossName':
        return this.bossConfig.searchTerms.some(term => 
          text.toLowerCase().includes(term.toLowerCase())
        );

      case 'channel':
        const channelNum = parseInt(text.replace(/\D/g, ''));
        return channelNum >= 1 && channelNum <= 13;

      case 'time':
        return /^\d+h\s*\d+m$|^\d+m$/.test(text);

      default:
        return false;
    }
  }
}

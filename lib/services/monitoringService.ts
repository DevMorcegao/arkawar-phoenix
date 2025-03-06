import { logger } from '../logger';

interface OperationCount {
  reads: number;
  queries: number;
  listenerUpdates: number;
  timestamp: Date;
  component: string;
  details: {
    [key: string]: {
      count: number;
      lastTimestamp: Date;
      operationDetails: string[];
    }
  }
}

class MonitoringService {
  private operations: Map<string, OperationCount>;
  private static instance: MonitoringService;

  private constructor() {
    this.operations = new Map();
    this.startPeriodicReport();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private getOrCreateOperation(component: string): OperationCount {
    if (!this.operations.has(component)) {
      this.operations.set(component, {
        reads: 0,
        queries: 0,
        listenerUpdates: 0,
        timestamp: new Date(),
        component,
        details: {
          reads: { count: 0, lastTimestamp: new Date(), operationDetails: [] },
          queries: { count: 0, lastTimestamp: new Date(), operationDetails: [] },
          listenerUpdates: { count: 0, lastTimestamp: new Date(), operationDetails: [] }
        }
      });
    }
    return this.operations.get(component)!;
  }

  public trackRead(component: string, detail: string = '') {
    const operation = this.getOrCreateOperation(component);
    operation.reads++;
    operation.details.reads.count++;
    operation.details.reads.lastTimestamp = new Date();
    if (detail) {
      operation.details.reads.operationDetails.push(
        `[${new Date().toLocaleTimeString()}] ${detail}`
      );
    }
    this.logOperation('read', component, detail);
  }

  public trackQuery(component: string, detail: string = '') {
    const operation = this.getOrCreateOperation(component);
    operation.queries++;
    operation.details.queries.count++;
    operation.details.queries.lastTimestamp = new Date();
    if (detail) {
      operation.details.queries.operationDetails.push(
        `[${new Date().toLocaleTimeString()}] ${detail}`
      );
    }
    this.logOperation('query', component, detail);
  }

  public trackListenerUpdate(component: string, detail: string = '') {
    const operation = this.getOrCreateOperation(component);
    operation.listenerUpdates++;
    operation.details.listenerUpdates.count++;
    operation.details.listenerUpdates.lastTimestamp = new Date();
    if (detail) {
      operation.details.listenerUpdates.operationDetails.push(
        `[${new Date().toLocaleTimeString()}] ${detail}`
      );
    }
    this.logOperation('listener', component, detail);
  }

  private logOperation(type: string, component: string, detail: string = '') {
    const operation = this.operations.get(component)!;
    logger.debug('MonitoringService', `📊 Nova operação ${type}`, {
      component,
      type,
      detail,
      timestamp: new Date().toLocaleTimeString(),
      currentCounts: {
        reads: operation.reads,
        queries: operation.queries,
        listenerUpdates: operation.listenerUpdates
      }
    });
  }

  public getStats(): { [key: string]: OperationCount } {
    const stats: { [key: string]: OperationCount } = {};
    this.operations.forEach((value, key) => {
      stats[key] = { ...value };
    });
    return stats;
  }

  private startPeriodicReport() {
    setInterval(() => {
      const stats = this.getStats();
      const total = {
        reads: 0,
        queries: 0,
        listenerUpdates: 0
      };

      const detailedReport: any = {};

      Object.entries(stats).forEach(([component, stat]) => {
        total.reads += stat.reads;
        total.queries += stat.queries;
        total.listenerUpdates += stat.listenerUpdates;

        detailedReport[component] = {
          reads: {
            count: stat.details.reads.count,
            lastOperation: stat.details.reads.lastTimestamp,
            details: stat.details.reads.operationDetails.slice(-5) // últimos 5 detalhes
          },
          queries: {
            count: stat.details.queries.count,
            lastOperation: stat.details.queries.lastTimestamp,
            details: stat.details.queries.operationDetails.slice(-5)
          },
          listenerUpdates: {
            count: stat.details.listenerUpdates.count,
            lastOperation: stat.details.listenerUpdates.lastTimestamp,
            details: stat.details.listenerUpdates.operationDetails.slice(-5)
          }
        };
      });

      logger.info('MonitoringService', '📈 Relatório de Operações (últimos 5 minutos)', {
        timestamp: new Date().toLocaleTimeString(),
        total,
        detalhesComponentes: detailedReport
      });

      // Resetar contadores
      this.operations.clear();
    }, 5 * 60 * 1000); // A cada 5 minutos
  }
}

export const monitoringService = MonitoringService.getInstance(); 
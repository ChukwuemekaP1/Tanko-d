import { oracleService, OraclePriceRecord } from './oracle.service.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class OracleCronService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  start(): void {
    if (!config.oracle.workerEnabled) {
      logger.info('Oracle cron service is disabled');
      return;
    }

    if (this.isRunning) {
      logger.warn('Oracle cron service is already running');
      return;
    }

    this.timer = setInterval(() => {
      this.updatePrices().catch((error) => {
        logger.error('Oracle cron: price update failed', error);
      });
    }, config.oracle.workerIntervalMs);

    this.isRunning = true;
    logger.info(`Oracle cron service started (interval: ${config.oracle.workerIntervalMs}ms)`);

    this.updatePrices().catch((error) => {
      logger.error('Oracle cron: initial price update failed', error);
    });
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.isRunning = false;
      logger.info('Oracle cron service stopped');
    }
  }

  private async updatePrices(): Promise<void> {
    const start = Date.now();
    try {
      const prices = await oracleService.refreshPrices();
      logger.info(`Oracle cron: updated ${prices.length} prices in ${Date.now() - start}ms`);
    } catch (error) {
      logger.error(`Oracle cron: failed after ${Date.now() - start}ms`, error);
    }
  }

  async updatePricesManually(): Promise<OraclePriceRecord[]> {
    return oracleService.refreshPrices();
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

export const oracleCronService = new OracleCronService();

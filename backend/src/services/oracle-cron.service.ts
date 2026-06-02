import cron from 'node-cron';
import { oracleService, SignedPrice } from './oracle.service.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * OracleCronService - Manages scheduled price updates
 *
 * Responsibilities:
 * - Schedule periodic price fetching using cron
 * - Sign price payloads
 * - Store prices in database
 * - Handle errors gracefully
 * - Prevent blocking of user traffic
 */
export class OracleCronService {
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning = false;

  /**
   * Initializes and starts the price update cron job
   * Should be called during application startup
   */
  start(): void {
    if (!config.oracle.enabled) {
      logger.info('Oracle cron service is disabled');
      return;
    }

    if (this.isRunning) {
      logger.warn('Oracle cron service is already running');
      return;
    }

    try {
      // Schedule the price fetch and sign job
      this.cronJob = cron.schedule(config.oracle.cronExpression, async () => {
        await this.updatePrices();
      });

      this.isRunning = true;
      logger.info(`Oracle cron service started with expression: ${config.oracle.cronExpression}`);

      // Optionally run immediately on startup
      this.updatePrices().catch((error) => {
        logger.error('Failed to run initial price update:', error);
      });
    } catch (error) {
      logger.error('Failed to start Oracle cron service:', error);
      throw error;
    }
  }

  /**
   * Stops the cron job
   * Should be called during application shutdown
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.isRunning = false;
      logger.info('Oracle cron service stopped');
    }
  }

  /**
   * Fetches, signs, and stores current fuel prices
   * This runs in the background and should not block user requests
   */
  private async updatePrices(): Promise<void> {
    const startTime = Date.now();

    try {
      logger.debug('Oracle cron: Fetching and signing fuel prices');

      // Fetch and sign prices
      const signedPrices = await oracleService.getSignedPrices();

      // TODO: Store prices in database (needs FuelPriceFeed table or similar)
      // For v1, we just log them
      logger.info(`Oracle cron: Successfully fetched and signed ${signedPrices.length} prices`, {
        prices: signedPrices.map((p) => ({
          fuelType: p.payload.fuelType,
          price: p.payload.pricePerLiter,
          timestamp: p.payload.timestamp,
        })),
      });

      // TODO: Optionally submit prices to Soroban contract
      // This would require invoking the contract's update_price function
      // For v1, the frontend will read prices via API endpoint

      const duration = Date.now() - startTime;
      logger.debug(`Oracle cron: Price update completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Oracle cron: Failed to update prices after ${duration}ms`, error);
      // Don't throw - we want cron to continue running even if one update fails
    }
  }

  /**
   * Manually trigger a price update (for testing or admin actions)
   */
  async updatePricesManually(): Promise<SignedPrice[]> {
    return oracleService.getSignedPrices();
  }

  /**
   * Check if the cron service is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
export const oracleCronService = new OracleCronService();

import { Request, Response } from 'express';
import { oracleService } from '../services/oracle.service.js';
import { oracleCronService } from '../services/oracle-cron.service.js';
import { logger } from '../utils/logger.js';

/**
 * OracleController - Handles API endpoints for the Fuel Price Oracle
 *
 * Endpoints:
 * - GET /oracle/prices - Get current signed fuel prices
 * - POST /oracle/verify - Verify a signed price payload
 */
export class OracleController {
  /**
   * GET /oracle/prices
   * Returns the current signed fuel prices
   * These can be consumed by smart contracts or frontend applications
   */
  async getPrices(req: Request, res: Response): Promise<void> {
    try {
      const signedPrices = await oracleService.getSignedPrices();

      res.json({
        success: true,
        data: {
          prices: signedPrices,
          oraclePublicKey: oracleService.getPublicKey(),
          fetchedAt: new Date().toISOString(),
          maxPriceAge: oracleService.getMaxPriceAge(),
        },
      });
    } catch (error) {
      logger.error('Failed to get prices', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        error: 'Failed to fetch prices',
      });
    }
  }

  /**
   * GET /oracle/prices/:fuelType
   * Returns the current signed price for a specific fuel type
   */
  async getPriceByType(req: Request, res: Response): Promise<void> {
    try {
      const { fuelType } = req.params;

      const signedPrices = await oracleService.getSignedPrices();
      const price = signedPrices.find((p) => p.payload.fuelType === fuelType);

      if (!price) {
        res.status(404).json({
          success: false,
          error: `No price found for fuel type: ${fuelType}`,
        });
        return;
      }

      res.json({
        success: true,
        data: {
          price,
          oraclePublicKey: oracleService.getPublicKey(),
          fetchedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Failed to get price by type', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        error: 'Failed to fetch price',
      });
    }
  }

  /**
   * POST /oracle/verify
   * Verifies a signed price payload
   * Request body: { price: SignedPrice }
   */
  async verifyPrice(req: Request, res: Response): Promise<void> {
    try {
      const { price } = req.body;

      if (!price || !price.payload || !price.signature || !price.oraclePublicKey) {
        res.status(400).json({
          success: false,
          error: 'Invalid price payload structure',
        });
        return;
      }

      const isValid = oracleService.verifySignedPrice(price);

      res.json({
        success: true,
        data: {
          isValid,
          price,
          message: isValid ? 'Signature is valid' : 'Signature is invalid',
        },
      });
    } catch (error) {
      logger.error('Failed to verify price', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        error: 'Failed to verify price',
      });
    }
  }

  /**
   * POST /oracle/update (admin only)
   * Manually trigger a price update
   */
  async updatePrices(req: Request, res: Response): Promise<void> {
    try {
      const signedPrices = await oracleCronService.updatePricesManually();

      res.json({
        success: true,
        data: {
          prices: signedPrices,
          message: `Updated ${signedPrices.length} prices`,
          fetchedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Failed to update prices', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        error: 'Failed to update prices',
      });
    }
  }

  /**
   * GET /oracle/status
   * Get the status of the Oracle service
   */
  getStatus(req: Request, res: Response): void {
    res.json({
      success: true,
      data: {
        enabled: oracleCronService.isActive(),
        oraclePublicKey: oracleService.getPublicKey(),
        maxPriceAge: oracleService.getMaxPriceAge(),
      },
    });
  }
}

export const oracleController = new OracleController();

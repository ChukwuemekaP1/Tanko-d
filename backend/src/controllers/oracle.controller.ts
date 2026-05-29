import { Request, Response } from 'express';
import { oracleService, FuelType } from '../services/oracle.service.js';
import { fxService } from '../services/fx.service.js';

const FUEL_TYPES: FuelType[] = ['MAGNA', 'PREMIUM', 'DIESEL'];

export class OracleController {
  async getPrices(_req: Request, res: Response) {
    const prices = oracleService.getPrices();
    const fxRate = await fxService.refreshRate();

    res.json({
      success: true,
      data: {
        prices,
        fx: fxRate,
        oraclePublicKey: oracleService.getOraclePublicKey(),
        updatedAt: new Date().toISOString(),
      },
    });
  }

  async calculateReserve(req: Request, res: Response) {
    const liters = Number(req.query.liters);
    const fuelType = req.query.fuelType as FuelType;

    if (!Number.isFinite(liters) || liters <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid liters' });
    }

    if (!FUEL_TYPES.includes(fuelType)) {
      return res.status(400).json({ success: false, error: 'Invalid fuel type' });
    }

    const reserve = oracleService.calculateEscrowReserve(liters, fuelType);
    if (!reserve) {
      return res.status(404).json({ success: false, error: 'Price not available' });
    }

    res.json({ success: true, data: reserve });
  }

  async refreshPrices(_req: Request, res: Response) {
    const updated = await oracleService.refreshPrices();
    res.json({
      success: true,
      data: updated,
    });
  }
}

export const oracleController = new OracleController();

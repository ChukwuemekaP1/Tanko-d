import { Router } from 'express';
import { oracleController } from '../controllers/oracle.controller.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();

const calculateReserveSchema = z.object({
  liters: z.coerce.number().positive(),
  fuelType: z.enum(['MAGNA', 'PREMIUM', 'DIESEL']),
});

router.get('/oracle/prices', (req, res) => oracleController.getPrices(req, res));

router.get(
  '/oracle/calculate',
  validate(calculateReserveSchema, 'query'),
  (req, res) => oracleController.calculateReserve(req, res),
);

router.post('/oracle/refresh', (req, res) => oracleController.refreshPrices(req, res));

export default router;

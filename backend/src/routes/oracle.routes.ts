import { Router } from 'express';
import { oracleController } from '../controllers/oracle.controller.js';

const router = Router();

/**
 * Oracle API Routes
 *
 * Public endpoints (no authentication):
 * - GET /oracle/prices - Get all current signed prices
 * - GET /oracle/prices/:fuelType - Get price for specific fuel type
 * - GET /oracle/status - Get oracle service status
 *
 * Admin endpoints (requires authentication):
 * - POST /oracle/update - Manually trigger price update
 * - POST /oracle/verify - Verify a signed price payload
 */

// Public endpoints
router.get('/oracle/prices', (req, res) => oracleController.getPrices(req, res));
router.get('/oracle/prices/:fuelType', (req, res) => oracleController.getPriceByType(req, res));
router.get('/oracle/status', (req, res) => oracleController.getStatus(req, res));

// Admin endpoints (TODO: Add authentication middleware)
router.post('/oracle/verify', (req, res) => oracleController.verifyPrice(req, res));
router.post('/oracle/update', (req, res) => oracleController.updatePrices(req, res));

export default router;

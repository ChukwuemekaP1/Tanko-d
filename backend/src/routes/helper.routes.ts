import { Router } from 'express';
import { escrowController } from '../controllers/escrow.controller.js';

const router = Router();

// Helper routes - only include methods that actually exist in the controller
// TODO: Implement setTrustline, getEscrowsByRole, getMultipleBalances if needed

export default router;

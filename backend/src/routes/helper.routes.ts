import { Router } from 'express';
import { trustlessWorkService } from '../services/trustlessWork.service.js';
import { validate } from '../middleware/validate.js';
import { setTrustlineSchema, getEscrowsByRoleSchema, getMultipleBalancesSchema } from '../utils/validators.js';

const router = Router();

router.post('/trustline', validate(setTrustlineSchema), async (req, res) => {
  try {
    const result = await trustlessWorkService.setTrustline(req.body);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/escrows-by-role', validate(getEscrowsByRoleSchema, 'query'), async (req, res) => {
  try {
    const result = await trustlessWorkService.getEscrowsByRole(req.query as any);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/multiple-balances', validate(getMultipleBalancesSchema), async (req, res) => {
  try {
    const result = await trustlessWorkService.getMultipleEscrowBalances(req.body);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

export default router;

import { Router } from 'express';
import { kycController } from '../controllers/kyc.controller.js';

const router = Router();

router.get('/pending', kycController.getAllPending);
router.get('/:userId', kycController.getStatus);
router.post('/submit', kycController.submit);
router.post('/:userId/review', kycController.review);

export default router;

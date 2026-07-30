import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';

const router = Router();

router.post('/auth/register', (req, res) => authController.register(req, res));

export default router;

import { Router } from 'express';
import { stationController } from '../controllers/station.controller.js';

const router = Router();

router.get('/stations', (req, res) => stationController.getAll(req, res));
router.get('/stations/:id', (req, res) => stationController.getById(req, res));
router.post('/stations', (req, res) => stationController.create(req, res));
router.put('/stations/:id', (req, res) => stationController.update(req, res));
router.delete('/stations/:id', (req, res) => stationController.delete(req, res));

export default router;

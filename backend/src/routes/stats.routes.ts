import { Router } from 'express';
import { statsController } from '../controllers/stats.controller.js';

const router = Router();

router.get('/stats/dashboard', (req, res) => statsController.getDashboardStats(req, res));

router.get('/stats/consumption-by-driver', (req, res) => statsController.getConsumptionByDriver(req, res));

router.get('/stats/recent-transactions', (req, res) => statsController.getRecentTransactions(req, res));

router.get('/stats/reports', (req, res) => statsController.getReportStats(req, res));

router.get('/stats/summary', (req, res) => statsController.getStatsSummary(req, res));

export default router;

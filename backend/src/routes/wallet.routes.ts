import { Router } from 'express';
import { walletController } from '../controllers/wallet.controller.js';

const router = Router();

router.post('/wallet/generate', (req, res) => walletController.generateWallet(req, res));

// Called by the frontend after any wallet connects (Freighter or Decaf).
// Validates the public key and logs the connection to the terminal.
router.post('/wallet/connect', (req, res) => walletController.connectWallet(req, res));

router.get('/wallet/:publicKey/info', (req, res) => walletController.getAccountInfo(req, res));

router.get('/wallet/:publicKey/balances', (req, res) => walletController.getBalances(req, res));

router.get('/wallet/validate', (req, res) => walletController.validateAddress(req, res));

// TODO: Implement signAndSubmitTransaction in escrowController if needed

export default router;

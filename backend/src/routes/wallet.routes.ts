import { Router } from 'express';
import { walletController } from '../controllers/wallet.controller.js';
import { stellarService } from '../services/stellar.service.js';

const router = Router();

router.post('/wallet/generate', (req, res) => walletController.generateWallet(req, res));
router.post('/wallet/connect', (req, res) => walletController.connectWallet(req, res));
router.get('/wallet/:publicKey/info', (req, res) => walletController.getAccountInfo(req, res));
router.get('/wallet/:publicKey/balances', (req, res) => walletController.getBalances(req, res));
router.get('/wallet/validate', (req, res) => walletController.validateAddress(req, res));

router.post('/transaction/sign', async (req, res) => {
  const { xdr, secret } = req.body as { xdr?: string; secret?: string };
  if (!secret || !stellarService.validateSecretKey(secret)) {
    res.status(400).json({ success: false, error: 'Invalid secret key' });
    return;
  }
  try {
    const signed = stellarService.signTransaction(xdr!, secret);
    const result = await stellarService.submitTransaction(signed);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

export default router;

import { Request, Response } from 'express';
import { stellarService } from '../services/stellar.service.js';
import { avalancheCChainAddressSchema } from '../utils/validators.js';
import { userRepository } from '../repositories/user.repository.js';

export class WalletController {
  async generateWallet(req: Request, res: Response): Promise<void> {
    try {
      const keypair = stellarService.generateKeypair();
      res.status(200).json({
        success: true,
        data: keypair,
        message: 'Store the secret securely. It will not be shown again.',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate wallet',
      });
    }
  }

  /**
   * POST /api/v1/wallet/connect
   * Called by the frontend immediately after a successful wallet connection.
   * Validates the public key and logs the session to the terminal — useful
   * for demos and debugging.
   */
  async connectWallet(req: Request, res: Response): Promise<void> {
    try {
      const { publicKey, walletType, avalancheAddress, chainId } = req.body as {
        publicKey?: string;
        walletType?: string;
        avalancheAddress?: string;
        chainId?: string;
      };

      if (walletType === 'core') {
        const parsed = avalancheCChainAddressSchema.safeParse(avalancheAddress);
        if (!parsed.success) {
          res.status(400).json({ success: false, error: 'Invalid Avalanche C-Chain address' });
          return;
        }

        const normalized = parsed.data.toLowerCase();
        let user: unknown = null;
        try {
          user = await userRepository.upsertAvalancheWallet(normalized, chainId);
        } catch (error) {
          console.warn('[Tanko] Avalanche wallet persistence failed:', error);
        }

        console.log(`\nCore Wallet connected on Avalanche C-Chain: ${normalized} (${chainId ?? 'unknown chain'})\n`);

        res.status(200).json({
          success: true,
          data: {
            avalancheAddress: normalized,
            walletType: 'core',
            chainId: chainId ?? null,
            user,
            connectedAt: new Date().toISOString(),
          },
        });
        return;
      }

      if (!publicKey || typeof publicKey !== 'string') {
        res.status(400).json({ success: false, error: 'publicKey is required' });
        return;
      }

      if (!stellarService.validatePublicKey(publicKey)) {
        res.status(400).json({ success: false, error: 'Invalid Stellar public key' });
        return;
      }

      const label = walletType === 'walletconnect' ? 'Decaf (WalletConnect)' : (walletType ?? 'unknown');

      console.log('\n┌─────────────────────────────────────────────────────┐');
      console.log(`│  🟢 WALLET CONNECTED via ${label.padEnd(26)}│`);
      console.log(`│  Key: ${publicKey.slice(0, 20)}...${publicKey.slice(-8).padEnd(20)}│`);
      console.log('└─────────────────────────────────────────────────────┘\n');

      // Optionally fetch live Stellar account info
      let accountInfo: any = null;
      try {
        accountInfo = await stellarService.getAccountInfo(publicKey);
      } catch {
        // Account may not be funded yet on testnet — that's fine
      }

      res.status(200).json({
        success: true,
        data: {
          publicKey,
          walletType: walletType ?? 'unknown',
          accountInfo,
          connectedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Connection validation failed',
      });
    }
  }

  async getAccountInfo(req: Request, res: Response): Promise<void> {
    try {
      const { publicKey } = req.params;
      
      if (!stellarService.validatePublicKey(publicKey)) {
        res.status(400).json({ success: false, error: 'Invalid public key' });
        return;
      }

      const info = await stellarService.getAccountInfo(publicKey);
      res.status(200).json({ success: true, data: info });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account info',
      });
    }
  }

  async getBalances(req: Request, res: Response): Promise<void> {
    try {
      const { publicKey } = req.params;
      
      if (!stellarService.validatePublicKey(publicKey)) {
        res.status(400).json({ success: false, error: 'Invalid public key' });
        return;
      }

      const balances = await stellarService.getAccountBalance(publicKey);
      res.status(200).json({ success: true, data: balances });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get balances',
      });
    }
  }

  async validateAddress(req: Request, res: Response): Promise<void> {
    try {
      const { address, network } = req.query;
      
      if (typeof address !== 'string') {
        res.status(400).json({ success: false, error: 'Address is required' });
        return;
      }

      const isValid =
        network === 'avalanche'
          ? avalancheCChainAddressSchema.safeParse(address).success
          : stellarService.validatePublicKey(address);
      res.status(200).json({ success: true, data: { isValid, address } });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      });
    }
  }
}

export const walletController = new WalletController();

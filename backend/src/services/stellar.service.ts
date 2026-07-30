import {
  Keypair,
  Transaction,
  StrKey,
  Horizon,
} from '@stellar/stellar-sdk';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const RPC_WARN_MS = 3000;

function rpcTimer(label: string): () => void {
  const t0 = performance.now();
  return () => {
    const ms = Math.round(performance.now() - t0);
    if (ms > RPC_WARN_MS) {
      logger.warn(`Stellar RPC slow: ${label}`, { ms });
    } else {
      logger.debug(`Stellar RPC: ${label}`, { ms });
    }
  };
}

const { HORIZON_URL } = {
  HORIZON_URL: config.stellar.horizonUrl,
};

interface BalanceInfo {
  asset: string;
  balance: string;
}

interface AccountInfo {
  publicKey: string;
  sequence: string;
  balances: BalanceInfo[];
}

interface BalanceLine {
  asset_type: string;
  balance: string;
  asset_code?: string;
}

export class StellarService {
  private horizonServer: Horizon.Server;

  constructor() {
    this.horizonServer = new Horizon.Server(HORIZON_URL);
  }

  validatePublicKey(publicKey: string): boolean {
    try {
      return StrKey.isValidEd25519PublicKey(publicKey);
    } catch {
      return false;
    }
  }

  validateSecretKey(secretKey: string): boolean {
    try {
      const keypair = Keypair.fromSecret(secretKey);
      return StrKey.isValidEd25519PublicKey(keypair.publicKey());
    } catch {
      return false;
    }
  }

  generateKeypair(): { publicKey: string; secret: string } {
    const keypair = Keypair.random();
    return {
      publicKey: keypair.publicKey(),
      secret: keypair.secret(),
    };
  }

  getKeypairFromSecret(secret: string): Keypair {
    return Keypair.fromSecret(secret);
  }

  signTransaction(xdr: string, secret: string): string {
    const transaction = new Transaction(xdr, config.stellar.networkPassphrase);
    const keypair = this.getKeypairFromSecret(secret);
    transaction.sign(keypair);
    return transaction.toXDR();
  }

  async submitTransaction(signedXdr: string): Promise<{ hash: string }> {
    const done = rpcTimer('submitTransaction');
    const transaction = new Transaction(signedXdr, config.stellar.networkPassphrase);
    const response = await this.horizonServer.submitTransaction(transaction);
    done();
    return { hash: response.hash };
  }

  async getAccountBalance(publicKey: string): Promise<BalanceInfo[]> {
    const done = rpcTimer('getAccountBalance');
    try {
      const account = await this.horizonServer.loadAccount(publicKey);
      done();
      return account.balances.map((balance: BalanceLine) => ({
        asset: balance.asset_type === 'native' ? 'XLM' : (balance.asset_code || 'unknown'),
        balance: balance.balance,
      }));
    } catch (error) {
      done();
      throw new Error(`Failed to fetch account balance: ${error}`);
    }
  }

  async getAccountInfo(publicKey: string): Promise<AccountInfo> {
    const done = rpcTimer('getAccountInfo');
    try {
      const account = await this.horizonServer.loadAccount(publicKey);
      done();
      return {
        publicKey,
        sequence: account.sequenceNumber(),
        balances: account.balances.map((balance: BalanceLine) => ({
          asset: balance.asset_type === 'native' ? 'XLM' : (balance.asset_code || 'unknown'),
          balance: balance.balance,
        })),
      };
    } catch (error) {
      done();
      throw new Error(`Failed to fetch account info: ${error}`);
    }
  }

  getNetworkPassphrase(): string {
    return config.stellar.networkPassphrase;
  }

  isTestnet(): boolean {
    return config.stellar.network === 'testnet';
  }
}

export const stellarService = new StellarService();

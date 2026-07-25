import {
  Contract,
  Keypair,
  nativeToScVal,
  rpc,
  scValToNative,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk';
import { config } from '../config/index.js';
import { OraclePriceRecord } from './oracle.service.js';

const SOROBAN_RPC_URL =
  process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org:443';

export class SorobanOracleService {
  private server: rpc.Server;

  constructor() {
    this.server = new rpc.Server(SOROBAN_RPC_URL);
  }

  isConfigured(): boolean {
    return Boolean(config.oracle.contractId && config.oracle.privateKey);
  }

  async submitPriceUpdate(record: OraclePriceRecord): Promise<string | null> {
    if (!this.isConfigured()) return null;

    const contractId = config.oracle.contractId;
    const keypair = Keypair.fromSecret(config.oracle.privateKey);
    const contract = new Contract(contractId);

    try {
      const account = await this.server.getAccount(keypair.publicKey());
      const signatureBuffer = Buffer.from(record.signature, 'base64');

      const tx = new TransactionBuilder(account, {
        fee: '100000',
        networkPassphrase: config.stellar.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'update_price',
            nativeToScVal(record.fuel_type, { type: 'symbol' }),
            nativeToScVal(record.price_mxn_scaled, { type: 'u64' }),
            nativeToScVal(record.price_usdc_scaled, { type: 'u64' }),
            nativeToScVal(record.timestamp, { type: 'u64' }),
            nativeToScVal(record.station_id, { type: 'string' }),
            xdr.ScVal.scvBytes(signatureBuffer),
          ),
        )
        .setTimeout(180)
        .build();

      const prepared = await this.server.prepareTransaction(tx);
      prepared.sign(keypair);
      const result = await this.server.sendTransaction(prepared);

      if (result.hash && result.status !== 'ERROR') {
        return result.hash;
      }

      console.warn('[SorobanOracle] Transaction not submitted', result);
      return null;
    } catch (error) {
      console.warn('[SorobanOracle] On-chain update skipped', error);
      return null;
    }
  }

  async readPrice(fuelType: string): Promise<Record<string, unknown> | null> {
    if (!config.oracle.contractId) return null;

    const contract = new Contract(config.oracle.contractId);
    const keypair = Keypair.random();

    try {
      await this.server.getAccount(keypair.publicKey());
    } catch {
      try {
        await fetch(
          `https://friendbot.stellar.org?addr=${encodeURIComponent(keypair.publicKey())}`,
        );
      } catch {
        return null;
      }
    }

    try {
      const account = await this.server.getAccount(keypair.publicKey());
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: config.stellar.networkPassphrase,
      })
        .addOperation(
          contract.call('get_price', nativeToScVal(fuelType, { type: 'symbol' })),
        )
        .setTimeout(30)
        .build();

      const sim = await this.server.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
        return scValToNative(sim.result.retval) as Record<string, unknown>;
      }
    } catch {
      return null;
    }
    return null;
  }
}

export const sorobanOracleService = new SorobanOracleService();

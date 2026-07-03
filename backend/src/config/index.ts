import dotenv from 'dotenv';
import path from 'path';

// In the monorepo the root .env lives one level above backend/.
// Falls back to a local .env so the package still works standalone.
const rootEnv = dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
if (rootEnv.error) {
  dotenv.config();
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  env: process.env.NODE_ENV || 'development',

  trustlessWork: {
    apiUrl: process.env.TRUSTLESS_WORK_API_URL || 'https://dev.api.trustlesswork.com',
    apiKey: process.env.TRUSTLESS_WORK_API_KEY || '',
  },

  stellar: {
    network: process.env.STELLAR_NETWORK || 'testnet',
    horizonUrl: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    networkPassphrase:
      process.env.STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  },

  soroban: {
    rpcUrl: process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org:443',
    networkPassphrase: process.env.SOROBAN_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
    contractId: process.env.SOROBAN_CONTRACT_ID || '',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  mail: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@tanko.app',
  },

  get fx() {
    return {
      mxnPerUsd: parseFloat(process.env.FX_MXN_PER_USD || '17.24'),
      apiUrl: process.env.FX_RATE_API_URL || '',
    };
  },

  get oracle() {
    return {
      seedPrices: {
        magna: parseFloat(process.env.ORACLE_SEED_PRICE_MAGNA || '24.00'),
        premium: parseFloat(process.env.ORACLE_SEED_PRICE_PREMIUM || '28.66'),
        diesel: parseFloat(process.env.ORACLE_SEED_PRICE_DIESEL || '27.44'),
      },
      privateKey: process.env.ORACLE_PRIVATE_KEY || '',
      publicKey: process.env.ORACLE_PUBLIC_KEY || '',
      defaultStationId: process.env.ORACLE_DEFAULT_STATION_ID || 'CRE-MX-001',
      priceSourceUrl: process.env.ORACLE_PRICE_SOURCE_URL || '',
      workerEnabled: process.env.ORACLE_WORKER_ENABLED !== 'false',
      workerIntervalMs: parseInt(process.env.ORACLE_WORKER_INTERVAL_MS || '3600000', 10),
      contractId: process.env.ORACLE_CONTRACT_ID || '',
      /** Cron job in index.ts — off by default in dev to reduce console noise */
      enabled: process.env.ORACLE_CRON_ENABLED === 'true',
      cronExpression: process.env.ORACLE_CRON_EXPRESSION || '0 */6 * * *',
    };
  },
};

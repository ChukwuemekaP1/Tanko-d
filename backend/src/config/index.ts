import dotenv from 'dotenv';
import path from 'path';

// In the monorepo the root .env lives one level above backend/.
// Falls back to a local .env so the package still works standalone.
const rootEnv = dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
if (rootEnv.error) {
  dotenv.config();
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
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
};

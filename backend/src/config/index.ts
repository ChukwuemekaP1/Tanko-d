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

  oracle: {
    // Oracle keypair for signing price payloads
    // NOTE: In production, store in secure key management system (e.g., AWS Secrets Manager, HashiCorp Vault)
    publicKey: process.env.ORACLE_PUBLIC_KEY || '',
    secretKey: process.env.ORACLE_SECRET_KEY || '',
    // Price fetch configuration
    enabled: process.env.ORACLE_ENABLED === 'true' || false,
    // Cron expression for price updates (default: every hour)
    cronExpression: process.env.ORACLE_CRON || '0 * * * *',
    // Max age of price data in milliseconds (default: 1 hour)
    maxPriceAge: parseInt(process.env.ORACLE_MAX_PRICE_AGE || '3600000', 10),
    // Price API configuration
    priceApi: {
      // Using a mock API for v1; replace with real API (PETROIntelligence, CRE, etc.)
      baseUrl: process.env.PRICE_API_URL || 'https://api.example.com/prices',
      apiKey: process.env.PRICE_API_KEY || '',
    },
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};

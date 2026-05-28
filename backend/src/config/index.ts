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

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  mail: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE !== 'false',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Tanko <noreply@tanko.app>',
  },
};

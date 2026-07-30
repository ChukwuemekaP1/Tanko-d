import request from 'supertest';
import express from 'express';
import { Keypair } from '@stellar/stellar-sdk';

process.env.ORACLE_SEED_PRICE_MAGNA = '24.00';
process.env.ORACLE_SEED_PRICE_PREMIUM = '28.66';
process.env.ORACLE_SEED_PRICE_DIESEL = '27.44';
process.env.FX_MXN_PER_USD = '17.24';
process.env.ORACLE_PRIVATE_KEY = Keypair.random().secret();
process.env.ORACLE_WORKER_ENABLED = 'false';

import oracleRoutes from '../../src/routes/oracle.routes.js';

const app = express();
app.use(express.json());
app.use('/api/v1', oracleRoutes);

describe('Oracle API integration', () => {
  it('GET /oracle/prices returns seed prices for all fuel types', async () => {
    const res = await request(app).get('/api/v1/oracle/prices');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const prices = res.body.data.prices as Array<{
      fuel_type: string;
      price_mxn: number;
    }>;

    const magna = prices.find((p) => p.fuel_type === 'MAGNA');
    const premium = prices.find((p) => p.fuel_type === 'PREMIUM');
    const diesel = prices.find((p) => p.fuel_type === 'DIESEL');

    expect(magna?.price_mxn).toBe(24);
    expect(premium?.price_mxn).toBe(28.66);
    expect(diesel?.price_mxn).toBe(27.44);
    expect(res.body.data.fx.mxnPerUsd).toBe(17.24);
  });

  it('GET /oracle/calculate returns MXN and USDC escrow reserve', async () => {
    const res = await request(app)
      .get('/api/v1/oracle/calculate')
      .query({ liters: 50, fuelType: 'MAGNA' });

    expect(res.status).toBe(200);
    expect(res.body.data.total_mxn).toBe(1200);
    expect(res.body.data.total_usdc).toBeCloseTo(1200 / 17.24, 2);
    expect(res.body.data.total_usdc_stroops).toBeGreaterThan(0);
  });

  it('rejects invalid fuel type', async () => {
    const res = await request(app)
      .get('/api/v1/oracle/calculate')
      .query({ liters: 10, fuelType: 'INVALID' });

    expect(res.status).toBe(400);
  });
});

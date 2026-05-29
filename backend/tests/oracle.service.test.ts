import crypto from 'crypto';
import { Keypair } from 'stellar-sdk';

const testKeypair = Keypair.random();

process.env.ORACLE_SEED_PRICE_MAGNA = '24.00';
process.env.ORACLE_SEED_PRICE_PREMIUM = '28.66';
process.env.ORACLE_SEED_PRICE_DIESEL = '27.44';
process.env.FX_MXN_PER_USD = '17.24';
process.env.ORACLE_PRIVATE_KEY = testKeypair.secret();
process.env.ORACLE_DEFAULT_STATION_ID = 'CRE-MX-001';

import {
  OracleService,
  CertifiedPricePayload,
} from '../src/services/oracle.service.js';
import { FxService } from '../src/services/fx.service.js';

const FUEL_TYPE_CODE = { MAGNA: 0, PREMIUM: 1, DIESEL: 2 };


function buildMessage(payload: CertifiedPricePayload): Buffer {
  const fuelCode = FUEL_TYPE_CODE[payload.fuel_type];
  const priceMxnScaled = Math.round(payload.price_mxn * 10_000);
  const priceUsdcScaled = Math.round(payload.price_usdc * 10_000_000);
  const stationHash = crypto
    .createHash('sha256')
    .update(payload.station_id, 'utf8')
    .digest();

  const buf = Buffer.alloc(60);
  let offset = 0;
  buf.writeUInt32BE(fuelCode, offset);
  offset += 4;
  buf.writeBigUInt64BE(BigInt(priceMxnScaled), offset);
  offset += 8;
  buf.writeBigUInt64BE(BigInt(priceUsdcScaled), offset);
  offset += 8;
  buf.writeBigUInt64BE(BigInt(payload.timestamp), offset);
  offset += 8;
  stationHash.copy(buf, offset);
  return buf;
}

describe('OracleService', () => {
  it('initializes with seed prices from environment', () => {
    const oracle = new OracleService();
    const magna = oracle.getPrice('MAGNA');
    const premium = oracle.getPrice('PREMIUM');
    const diesel = oracle.getPrice('DIESEL');

    expect(magna?.price_mxn).toBe(24);
    expect(premium?.price_mxn).toBe(28.66);
    expect(diesel?.price_mxn).toBe(27.44);
  });

  it('signs certified payloads with Ed25519', () => {
    const oracle = new OracleService();
    const payload: CertifiedPricePayload = {
      fuel_type: 'MAGNA',
      price_mxn: 24.0,
      price_usdc: 1.39,
      timestamp: 1_748_304_000,
      station_id: 'CRE-MX-001',
    };

    const signature = Buffer.from(oracle.signPayload(payload), 'base64');
    const message = oracle.buildCertificationMessage(payload);
    const expected = testKeypair.sign(message);

    expect(signature.equals(expected)).toBe(true);
  });

  it('rejects verification when payload is altered', () => {
    const oracle = new OracleService();
    const payload: CertifiedPricePayload = {
      fuel_type: 'DIESEL',
      price_mxn: 27.44,
      price_usdc: 1.59,
      timestamp: 1_748_304_000,
      station_id: 'CRE-MX-001',
    };

    const signature = Buffer.from(oracle.signPayload(payload), 'base64');
    const tampered = oracle.buildCertificationMessage({
      ...payload,
      price_mxn: 99.99,
    });
    const tamperedSig = testKeypair.sign(tampered);

    expect(signature.equals(tamperedSig)).toBe(false);
  });
});

describe('FxService', () => {
  it('converts MXN to USDC using configured rate', async () => {
    const fx = new FxService();
    const usdc = await fx.convertMxnToUsdc(24.0);
    expect(usdc).toBeCloseTo(24 / 17.24, 2);
  });
});

describe('Oracle valuation cycle', () => {
  it('computes escrow reserve: oracle price → FX → USDC stroops', () => {
    const oracle = new OracleService();
    const reserve = oracle.calculateEscrowReserve(100, 'MAGNA');

    expect(reserve).not.toBeNull();
    expect(reserve!.price_per_liter_mxn).toBe(24);
    expect(reserve!.total_mxn).toBe(2400);
    expect(reserve!.total_usdc).toBeCloseTo(2400 / 17.24, 2);
    expect(reserve!.total_usdc_stroops).toBe(
      Math.floor(reserve!.total_usdc * 10_000_000),
    );
  });

  it('produces message bytes matching contract format', () => {
    const oracle = new OracleService();
    const payload: CertifiedPricePayload = {
      fuel_type: 'PREMIUM',
      price_mxn: 28.66,
      price_usdc: 1.66,
      timestamp: 1_748_304_000,
      station_id: 'CRE-MX-001',
    };

    const backendMsg = oracle.buildCertificationMessage(payload);
    const testMsg = buildMessage(payload);
    expect(backendMsg.equals(testMsg)).toBe(true);
  });
});

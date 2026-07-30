import crypto from 'crypto';
import { Keypair } from '@stellar/stellar-sdk';
import { config } from '../config/index.js';
import { fxService, MXN_SCALE, USDC_SCALE } from './fx.service.js';
import { sorobanOracleService } from './sorobanOracle.service.js';
import { logger } from '../utils/logger.js';

export type FuelType = 'MAGNA' | 'PREMIUM' | 'DIESEL';

export interface CertifiedPricePayload {
  fuel_type: FuelType;
  price_mxn: number;
  price_usdc: number;
  timestamp: number;
  station_id: string;
}

export interface OraclePriceRecord extends CertifiedPricePayload {
  price_mxn_scaled: number;
  price_usdc_scaled: number;
  signature: string;
}

const FUEL_TYPE_CODE: Record<FuelType, number> = {
  MAGNA: 0,
  PREMIUM: 1,
  DIESEL: 2,
};

export class OracleService {
  private prices: Map<FuelType, OraclePriceRecord> = new Map();
  private oracleKeypair: Keypair | null = null;

  constructor() {
    this.loadOracleKeypair();
    this.initializeSeedPrices();
  }

  private loadOracleKeypair(): void {
    const secret = config.oracle.privateKey;
    if (!secret) {
      return;
    }
    try {
      this.oracleKeypair = Keypair.fromSecret(secret);
    } catch (error) {
      logger.error("Invalid ORACLE_PRIVATE_KEY", error);
    }
  }

  private initializeSeedPrices(): void {
    const now = Math.floor(Date.now() / 1000);
    const seeds: Array<{ fuel: FuelType; mxn: number }> = [
      { fuel: 'MAGNA', mxn: config.oracle.seedPrices.magna },
      { fuel: 'PREMIUM', mxn: config.oracle.seedPrices.premium },
      { fuel: 'DIESEL', mxn: config.oracle.seedPrices.diesel },
    ];

    for (const { fuel, mxn } of seeds) {
      const usdc = mxn / config.fx.mxnPerUsd;
      const record = this.buildRecord({
        fuel_type: fuel,
        price_mxn: mxn,
        price_usdc: usdc,
        timestamp: now,
        station_id: config.oracle.defaultStationId,
      });
      this.prices.set(fuel, record);
    }
  }

  getOraclePublicKey(): string | null {
    if (config.oracle.publicKey) return config.oracle.publicKey;
    return this.oracleKeypair?.publicKey() ?? null;
  }

  getPrices(): OraclePriceRecord[] {
    return Array.from(this.prices.values());
  }

  getPrice(fuelType: FuelType): OraclePriceRecord | undefined {
    return this.prices.get(fuelType);
  }

  calculateEscrowReserve(liters: number, fuelType: FuelType): {
    liters: number;
    fuel_type: FuelType;
    price_per_liter_mxn: number;
    price_per_liter_usdc: number;
    total_mxn: number;
    total_usdc: number;
    total_usdc_stroops: number;
  } | null {
    const price = this.prices.get(fuelType);
    if (!price) return null;

    const totalMxn = liters * price.price_mxn;
    const totalUsdc = liters * price.price_usdc;

    return {
      liters,
      fuel_type: fuelType,
      price_per_liter_mxn: price.price_mxn,
      price_per_liter_usdc: price.price_usdc,
      total_mxn: totalMxn,
      total_usdc: totalUsdc,
      total_usdc_stroops: Math.floor(totalUsdc * USDC_SCALE),
    };
  }

  buildCertificationMessage(payload: CertifiedPricePayload): Buffer {
    const fuelCode = FUEL_TYPE_CODE[payload.fuel_type];
    const priceMxnScaled = fxService.scaleMxn(payload.price_mxn);
    const priceUsdcScaled = fxService.scaleUsdc(payload.price_usdc);
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

  signPayload(payload: CertifiedPricePayload): string {
    if (!this.oracleKeypair) {
      throw new Error('Oracle private key not configured');
    }
    const message = this.buildCertificationMessage(payload);
    const signature = this.oracleKeypair.sign(message);
    return signature.toString('base64');
  }

  buildRecord(payload: CertifiedPricePayload): OraclePriceRecord {
    const price_mxn_scaled = fxService.scaleMxn(payload.price_mxn);
    const price_usdc_scaled = fxService.scaleUsdc(payload.price_usdc);
    let signature = '';
    try {
      signature = this.signPayload(payload);
    } catch {
      signature = '';
    }
    return {
      ...payload,
      price_mxn_scaled,
      price_usdc_scaled,
      signature,
    };
  }

  async fetchRegulatoryPrices(): Promise<CertifiedPricePayload[]> {
    if (config.oracle.priceSourceUrl) {
      try {
        const axios = (await import('axios')).default;
        const response = await axios.get(config.oracle.priceSourceUrl, {
          timeout: 8000,
        });
        const parsed = this.parseRegulatoryResponse(response.data);
        if (parsed.length > 0) return parsed;
      } catch (error) {
        logger.debug("Regulatory API fetch failed", error);
      }
    }

    return this.getSimulatedRegulatoryPrices();
  }

  private getSimulatedRegulatoryPrices(): CertifiedPricePayload[] {
    const timestamp = Math.floor(Date.now() / 1000);
    const station_id = config.oracle.defaultStationId;
    const fuels: FuelType[] = ['MAGNA', 'PREMIUM', 'DIESEL'];

    return fuels.map((fuel) => {
      const current = this.prices.get(fuel);
      const baseMxn = current?.price_mxn ?? config.oracle.seedPrices.magna;
      return {
        fuel_type: fuel,
        price_mxn: Number(baseMxn.toFixed(2)),
        price_usdc: 0,
        timestamp,
        station_id,
      };
    });
  }

  private parseRegulatoryResponse(data: unknown): CertifiedPricePayload[] {
    if (!Array.isArray(data)) return [];
    const timestamp = Math.floor(Date.now() / 1000);

    return data
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const fuel = row.fuel_type as FuelType;
        const priceMxn = Number(row.price_mxn);
        if (!['MAGNA', 'PREMIUM', 'DIESEL'].includes(fuel) || !Number.isFinite(priceMxn)) {
          return null;
        }
        return {
          fuel_type: fuel,
          price_mxn: priceMxn,
          price_usdc: 0,
          timestamp,
          station_id: String(row.station_id ?? config.oracle.defaultStationId),
        } satisfies CertifiedPricePayload;
      })
      .filter((p): p is CertifiedPricePayload => p !== null);
  }

  async refreshPrices(): Promise<OraclePriceRecord[]> {
    await fxService.refreshRate();
    const fetched = await this.fetchRegulatoryPrices();
    const updated: OraclePriceRecord[] = [];

    for (const raw of fetched) {
      const price_usdc = await fxService.convertMxnToUsdc(raw.price_mxn);
      const payload: CertifiedPricePayload = {
        ...raw,
        price_usdc: Number(price_usdc.toFixed(7)),
      };
      const record = this.buildRecord(payload);
      this.prices.set(payload.fuel_type, record);
      updated.push(record);

      if (sorobanOracleService.isConfigured()) {
        await sorobanOracleService.submitPriceUpdate(record);
      }
    }

    return updated;
  }
}

export const oracleService = new OracleService();

// ── Compat API expected by oracle.test.ts ────────────────────────────────

export interface SignedPrice {
  payload: { fuelType: string; pricePerLiter: number; timestamp: number };
  signature: string;
  oraclePublicKey: string;
}

// Extend the singleton with the simpler test-facing API
const _svc = oracleService as any;

function _getKeypair(): import('@stellar/stellar-sdk').Keypair {
  // Re-read from env each call so tests that set env before require() work
  const secret = process.env.ORACLE_SECRET_KEY || process.env.ORACLE_PRIVATE_KEY || config.oracle.privateKey;
  if (!secret) throw new Error('Oracle keypair not configured');
  const { Keypair: KP } = require('@stellar/stellar-sdk') as typeof import('@stellar/stellar-sdk');
  return KP.fromSecret(secret);
}

_svc.getPublicKey = (): string | null => {
  try { return _getKeypair().publicKey(); } catch { return null; }
};

_svc.signPrice = (payload: { fuelType: string; pricePerLiter: number; timestamp: number }): SignedPrice => {
  const kp = _getKeypair();
  const msgBuf = Buffer.from(`${payload.fuelType}:${payload.pricePerLiter}:${payload.timestamp}`, 'utf8');
  return { payload, signature: kp.sign(msgBuf).toString('base64'), oraclePublicKey: kp.publicKey() };
};

_svc.verifySignedPrice = (signed: SignedPrice): boolean => {
  try {
    if (!signed?.payload || !signed?.signature || !signed?.oraclePublicKey) return false;
  const { Keypair: KP } = require('@stellar/stellar-sdk') as typeof import('@stellar/stellar-sdk');
    const kp = KP.fromPublicKey(signed.oraclePublicKey);
    const msgBuf = Buffer.from(`${signed.payload.fuelType}:${signed.payload.pricePerLiter}:${signed.payload.timestamp}`, 'utf8');
    return kp.verify(msgBuf, Buffer.from(signed.signature, 'base64'));
  } catch { return false; }
};

_svc.isPricefresh = (payload: { timestamp: number }): boolean => {
  const maxAge = parseInt(process.env.ORACLE_MAX_PRICE_AGE || '3600000', 10);
  return Date.now() - payload.timestamp < maxAge;
};

_svc.getMaxPriceAge = (): number => parseInt(process.env.ORACLE_MAX_PRICE_AGE || '3600000', 10);

_svc.fetchFuelPrices = async (): Promise<Array<{ fuelType: string; pricePerLiter: number; timestamp: number }>> => {
  const records = await oracleService.fetchRegulatoryPrices();
  return records.map((r) => ({ fuelType: r.fuel_type, pricePerLiter: r.price_mxn, timestamp: r.timestamp * 1000 }));
};

_svc.getSignedPrices = async (): Promise<SignedPrice[]> => {
  const prices = await _svc.fetchFuelPrices();
  return prices.map((p: { fuelType: string; pricePerLiter: number; timestamp: number }) => _svc.signPrice(p));
};

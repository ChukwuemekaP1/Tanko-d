import axios from 'axios';
import { config } from '../config/index.js';

export const MXN_SCALE = 10_000;
export const USDC_SCALE = 10_000_000;

export interface FxRateInfo {
  mxnPerUsd: number;
  source: string;
  fetchedAt: number;
}

export class FxService {
  private cachedRate: FxRateInfo | null = null;
  private readonly cacheTtlMs = 5 * 60 * 1000;

  getMxnPerUsd(): number {
    return this.cachedRate?.mxnPerUsd ?? config.fx.mxnPerUsd;
  }

  async refreshRate(): Promise<FxRateInfo> {
    if (this.cachedRate && Date.now() - this.cachedRate.fetchedAt < this.cacheTtlMs) {
      return this.cachedRate;
    }

    if (config.fx.apiUrl) {
      try {
        const response = await axios.get(config.fx.apiUrl, { timeout: 5000 });
        const mxnPerUsd = this.parseApiRate(response.data);
        if (mxnPerUsd > 0) {
          this.cachedRate = {
            mxnPerUsd,
            source: 'api',
            fetchedAt: Date.now(),
          };
          return this.cachedRate;
        }
      } catch (error) {
        console.warn('[FxService] Rate API unavailable, using fallback', error);
      }
    }

    this.cachedRate = {
      mxnPerUsd: config.fx.mxnPerUsd,
      source: 'env',
      fetchedAt: Date.now(),
    };
    return this.cachedRate;
  }

  async convertMxnToUsdc(priceMxn: number): Promise<number> {
    const rate = await this.refreshRate();
    return priceMxn / rate.mxnPerUsd;
  }

  scaleMxn(priceMxn: number): number {
    return Math.round(priceMxn * MXN_SCALE);
  }

  scaleUsdc(priceUsdc: number): number {
    return Math.round(priceUsdc * USDC_SCALE);
  }

  unscaleMxn(scaled: number): number {
    return scaled / MXN_SCALE;
  }

  unscaleUsdc(scaled: number): number {
    return scaled / USDC_SCALE;
  }

  private parseApiRate(data: unknown): number {
    if (!data || typeof data !== 'object') return 0;
    const record = data as Record<string, unknown>;
    if (typeof record.mxnPerUsd === 'number') return record.mxnPerUsd;
    if (typeof record.rate === 'number') return record.rate;
    if (record.rates && typeof record.rates === 'object') {
      const rates = record.rates as Record<string, number>;
      if (typeof rates.MXN === 'number') return rates.MXN;
    }
    return 0;
  }
}

export const fxService = new FxService();

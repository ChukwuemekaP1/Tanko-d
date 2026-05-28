import { Keypair, StrKey } from 'stellar-sdk';
import axios from 'axios';
import { config } from '../config/index.js';

/**
 * Price data structure that will be signed
 */
export interface PricePayload {
  fuelType: string; // e.g., "Diesel", "Premium", "Magna"
  pricePerLiter: number; // Price in USD per liter
  stationId?: string; // Optional: specific gas station
  timestamp: number; // Unix timestamp in milliseconds
}

/**
 * Signed price data returned to contracts
 */
export interface SignedPrice {
  payload: PricePayload;
  signature: string; // Ed25519 signature (hex-encoded)
  oraclePublicKey: string; // Signer's public key
}

/**
 * Price feed data structure stored in database
 */
export interface FuelPriceFeed {
  fuelType: string;
  pricePerLiter: number;
  stationId?: string;
  timestamp: number;
  signature: string;
  oraclePublicKey: string;
}

/**
 * OracleService - Manages fuel price data signing and distribution
 *
 * Responsibilities:
 * - Sign price payloads with Oracle's Ed25519 private key
 * - Fetch real-time fuel prices from trusted APIs
 * - Maintain Oracle keypair
 * - Prepare price data for consumption by Soroban contracts
 */
export class OracleService {
  private keypair: Keypair | null = null;
  private publicKey: string;
  private secretKey: string;

  constructor() {
    this.publicKey = config.oracle.publicKey;
    this.secretKey = config.oracle.secretKey;

    // Initialize keypair if both keys are configured
    if (this.publicKey && this.secretKey) {
      try {
        this.keypair = Keypair.fromSecret(this.secretKey);
        this.validateKeypair();
      } catch (error) {
        console.error('Failed to initialize Oracle keypair:', error);
        throw new Error('Invalid Oracle keypair configuration');
      }
    }
  }

  /**
   * Validates that the keypair is correctly initialized
   */
  private validateKeypair(): void {
    if (!this.keypair) {
      throw new Error('Oracle keypair not initialized');
    }

    // Verify public key matches
    const derivedPublicKey = this.keypair.publicKey();
    if (derivedPublicKey !== this.publicKey) {
      throw new Error('Oracle public key does not match the derived key from secret');
    }

    // Verify it's a valid Ed25519 key
    if (!StrKey.isValidEd25519PublicKey(derivedPublicKey)) {
      throw new Error('Oracle public key is not a valid Ed25519 key');
    }
  }

  /**
   * Gets the Oracle's public key
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Signs a price payload with the Oracle's private key
   *
   * @param payload - The price data to sign
   * @returns Signed price data including signature
   * @throws Error if keypair not initialized or signing fails
   */
  signPrice(payload: PricePayload): SignedPrice {
    if (!this.keypair) {
      throw new Error('Oracle keypair not initialized. Configure ORACLE_SECRET_KEY and ORACLE_PUBLIC_KEY');
    }

    try {
      // Convert payload to Buffer for signing
      const payloadString = JSON.stringify(payload);
      const payloadBuffer = Buffer.from(payloadString, 'utf-8');

      // Sign using Ed25519
      const signature = this.keypair.sign(payloadBuffer);
      const signatureHex = signature.toString('hex');

      return {
        payload,
        signature: signatureHex,
        oraclePublicKey: this.publicKey,
      };
    } catch (error) {
      throw new Error(`Failed to sign price payload: ${error}`);
    }
  }

  /**
   * Fetches fuel prices from external API
   *
   * For v1, this is a mock implementation. In production, integrate with:
   * - PETROIntelligence API
   * - CRE open data
   * - Partner gas station APIs
   * - Real-time market data providers
   *
   * @returns Array of fuel price payloads
   */
  async fetchFuelPrices(): Promise<PricePayload[]> {
    try {
      // Mock implementation - returns default prices
      // TODO: Replace with real API integration
      const mockPrices: PricePayload[] = [
        {
          fuelType: 'Diesel',
          pricePerLiter: 25.0,
          timestamp: Date.now(),
        },
        {
          fuelType: 'Premium',
          pricePerLiter: 26.5,
          timestamp: Date.now(),
        },
        {
          fuelType: 'Magna',
          pricePerLiter: 24.5,
          timestamp: Date.now(),
        },
      ];

      return mockPrices;

      // Real implementation would look like:
      /*
      const response = await axios.get(config.oracle.priceApi.baseUrl, {
        headers: {
          'Authorization': `Bearer ${config.oracle.priceApi.apiKey}`,
        },
      });

      return response.data.prices.map((price: any) => ({
        fuelType: price.type,
        pricePerLiter: price.pricePerLiter,
        stationId: price.stationId,
        timestamp: Date.now(),
      }));
      */
    } catch (error) {
      console.error('Failed to fetch fuel prices:', error);
      throw new Error(`Failed to fetch fuel prices: ${error}`);
    }
  }

  /**
   * Fetches and signs current fuel prices
   *
   * @returns Array of signed price data ready for smart contract consumption
   */
  async getSignedPrices(): Promise<SignedPrice[]> {
    const prices = await this.fetchFuelPrices();
    return prices.map((price) => this.signPrice(price));
  }

  /**
   * Verifies a signed price payload (for testing/validation)
   *
   * Note: The actual verification happens in the Soroban contract
   *
   * @param signedPrice - The signed price to verify
   * @returns true if signature is valid, false otherwise
   */
  verifySignedPrice(signedPrice: SignedPrice): boolean {
    try {
      if (!this.keypair) {
        throw new Error('Oracle keypair not initialized');
      }

      // Verify the public key matches
      if (signedPrice.oraclePublicKey !== this.publicKey) {
        return false;
      }

      // Reconstruct the signed message
      const payloadString = JSON.stringify(signedPrice.payload);
      const payloadBuffer = Buffer.from(payloadString, 'utf-8');
      const signatureBuffer = Buffer.from(signedPrice.signature, 'hex');

      // Verify the signature
      const isValid = this.keypair.verify(payloadBuffer, signatureBuffer);
      return isValid;
    } catch (error) {
      console.error('Failed to verify signature:', error);
      return false;
    }
  }

  /**
   * Gets the maximum age for price data (in milliseconds)
   * Used by contracts to reject stale prices
   */
  getMaxPriceAge(): number {
    return config.oracle.maxPriceAge;
  }

  /**
   * Checks if a price payload is within acceptable age
   *
   * @param payload - The price payload to check
   * @returns true if price is fresh, false if expired
   */
  isPricefresh(payload: PricePayload): boolean {
    const now = Date.now();
    const age = now - payload.timestamp;
    return age <= this.getMaxPriceAge();
  }
}

// Singleton instance
export const oracleService = new OracleService();

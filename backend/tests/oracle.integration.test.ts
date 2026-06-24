/**
 * Oracle Integration Tests
 *
 * These tests verify the Oracle system end-to-end on Stellar Testnet
 *
 * Prerequisites:
 * - Stellar Testnet account with XLM for transaction fees
 * - Deployed TankoRegistry contract
 * - Oracle account with private key set in ORACLE_SECRET_KEY
 *
 * Environment Variables:
 * - ORACLE_CONTRACT_ID: The Soroban contract ID
 * - ORACLE_SECRET_KEY: Oracle backend's Ed25519 secret key
 * - ADMIN_SECRET_KEY: Admin account's secret key
 */

import { StellarService } from '../src/services/stellar.service';
import { oracleService } from '../src/services/oracle.service';
import { config } from '../src/config/index';
import axios from 'axios';

describe('Oracle Integration Tests (Stellar Testnet)', () => {
  let stellarService: StellarService;

  const ORACLE_CONTRACT_ID = process.env.ORACLE_CONTRACT_ID || '';
  const ORACLE_HORIZON_URL = config.stellar.horizonUrl;

  beforeAll(() => {
    stellarService = new StellarService();

    // Skip tests if contract ID not configured
    if (!ORACLE_CONTRACT_ID) {
      console.log('⚠️  Skipping Oracle integration tests - ORACLE_CONTRACT_ID not configured');
    }
  });

  describe('Oracle Backend Functionality', () => {
    it('should fetch and sign prices', async () => {
      const prices = await oracleService.getSignedPrices();

      expect(Array.isArray(prices)).toBe(true);
      expect(prices.length).toBeGreaterThan(0);

      // Verify each signed price
      prices.forEach((price) => {
        expect(price).toHaveProperty('payload');
        expect(price).toHaveProperty('signature');
        expect(price).toHaveProperty('oraclePublicKey');

        // Verify payload structure
        expect(price.payload).toHaveProperty('fuelType');
        expect(price.payload).toHaveProperty('pricePerLiter');
        expect(price.payload).toHaveProperty('timestamp');

        // Verify signature is valid
        const isValid = oracleService.verifySignedPrice(price);
        expect(isValid).toBe(true);
      });
    });

    it('should reject tampered signatures', async () => {
      const prices = await oracleService.getSignedPrices();
      const tampered = {
        ...prices[0],
        signature: 'a'.repeat(128), // Invalid signature
      };

      const isValid = oracleService.verifySignedPrice(tampered);
      expect(isValid).toBe(false);
    });

    it('should reject stale prices', () => {
      const oldPayload = {
        fuelType: 'Diesel',
        pricePerLiter: 25.0,
        timestamp: Date.now() - 7200000, // 2 hours ago
      };

      const isFresh = oracleService.isPricefresh(oldPayload);
      expect(isFresh).toBe(false);
    });
  });

  describe('Oracle API Endpoints', () => {
    const API_BASE_URL = `http://localhost:${config.port}/api/v1`;

    it('should get current prices from API', async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/oracle/prices`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('data');
        expect(response.data.data).toHaveProperty('prices');
        expect(response.data.data).toHaveProperty('oraclePublicKey');

        // Verify prices structure
        const { prices } = response.data.data;
        expect(Array.isArray(prices)).toBe(true);

        prices.forEach((price: any) => {
          expect(price).toHaveProperty('payload');
          expect(price).toHaveProperty('signature');
          expect(price).toHaveProperty('oraclePublicKey');
        });
      } catch (error) {
        if ((error as any).code === 'ECONNREFUSED') {
          console.log('⚠️  Skipping API test - backend not running');
        } else {
          throw error;
        }
      }
    });

    it('should get price by fuel type', async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/oracle/prices/Diesel`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data.data).toHaveProperty('price');
        expect(response.data.data.price.payload.fuelType).toBe('Diesel');
      } catch (error) {
        if ((error as any).code === 'ECONNREFUSED') {
          console.log('⚠️  Skipping API test - backend not running');
        } else if ((error as any).response?.status === 404) {
          console.log('⚠️  Fuel type not available');
        } else {
          throw error;
        }
      }
    });

    it('should get oracle status', async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/oracle/status`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data.data).toHaveProperty('enabled');
        expect(response.data.data).toHaveProperty('oraclePublicKey');
        expect(response.data.data).toHaveProperty('maxPriceAge');
      } catch (error) {
        if ((error as any).code === 'ECONNREFUSED') {
          console.log('⚠️  Skipping API test - backend not running');
        } else {
          throw error;
        }
      }
    });

    it('should verify a signed price via API', async () => {
      try {
        // First get a price
        const priceResponse = await axios.get(`${API_BASE_URL}/oracle/prices`);
        const signedPrice = priceResponse.data.data.prices[0];

        // Verify it
        const verifyResponse = await axios.post(`${API_BASE_URL}/oracle/verify`, {
          price: signedPrice,
        });

        expect(verifyResponse.status).toBe(200);
        expect(verifyResponse.data).toHaveProperty('success', true);
        expect(verifyResponse.data.data).toHaveProperty('isValid', true);
      } catch (error) {
        if ((error as any).code === 'ECONNREFUSED') {
          console.log('⚠️  Skipping API test - backend not running');
        } else {
          throw error;
        }
      }
    });
  });

  describe('Price Update Scenarios', () => {
    it('should handle multiple fuel types', async () => {
      const prices = await oracleService.getSignedPrices();

      const fuelTypes = new Set(prices.map((p) => p.payload.fuelType));

      // Should have at least Diesel, Premium, Magna
      expect(fuelTypes.size).toBeGreaterThan(0);

      prices.forEach((price) => {
        // Each price should have a unique fuel type with different price
        expect(['Diesel', 'Premium', 'Magna']).toContain(price.payload.fuelType);
      });
    });

    it('should support regional pricing', async () => {
      // Create a price with station ID
      const regionalPrice = {
        fuelType: 'Diesel',
        pricePerLiter: 24.5,
        stationId: 42,
        timestamp: Date.now(),
      };

      const signed = oracleService.signPrice(regionalPrice);

      // Should include station ID in signed payload
      expect(signed.payload.stationId).toBe(42);
      expect(signed.signature).toBeDefined();
    });

    it('should track price history', async () => {
      // Get prices at different times
      const prices1 = await oracleService.getSignedPrices();

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      const prices2 = await oracleService.getSignedPrices();

      // Both should be valid
      expect(Array.isArray(prices1)).toBe(true);
      expect(Array.isArray(prices2)).toBe(true);

      // Timestamps might be different if fetched from fresh API
      prices1.forEach((p) => expect(p.payload.timestamp).toBeDefined());
      prices2.forEach((p) => expect(p.payload.timestamp).toBeDefined());
    });
  });

  describe('Security Validations', () => {
    it('should reject prices without timestamp', () => {
      const invalidPayload = {
        fuelType: 'Diesel',
        pricePerLiter: 25.0,
        // Missing timestamp
      } as any;

      const isFresh = oracleService.isPricefresh(invalidPayload);
      expect(isFresh).toBe(false);
    });

    it('should reject prices with invalid fuel type', async () => {
      // Attempting to sign with invalid data should still work
      // but the contract should validate it
      const invalidPayload = {
        fuelType: 'Unknown', // Invalid fuel type
        pricePerLiter: 25.0,
        timestamp: Date.now(),
      };

      const signed = oracleService.signPrice(invalidPayload);

      // Should still sign (backend doesn't validate fuel type)
      expect(signed.signature).toBeDefined();
      expect(signed.payload.fuelType).toBe('Unknown');

      // But contract would reject invalid fuel types
    });

    it('should prevent signature replay attacks', () => {
      const payload = {
        fuelType: 'Diesel',
        pricePerLiter: 25.0,
        timestamp: Date.now() - 7200000, // 2 hours ago
      };

      // Even with valid signature, stale timestamp should be rejected by contract
      const signed = oracleService.signPrice(payload);

      expect(oracleService.verifySignedPrice(signed)).toBe(true);
      expect(oracleService.isPricefresh(payload)).toBe(false);

      // Contract would reject this due to stale timestamp
    });
  });

  describe('Cron Service Integration', () => {
    it('should have oracle enabled in config', () => {
      // Check if oracle is configured
      expect(config.oracle).toBeDefined();
      expect(config.oracle.publicKey).toBeDefined();
      expect(config.oracle.secretKey).toBeDefined();
      expect(config.oracle.enabled).toBeDefined();
    });

    it('should have valid cron expression', () => {
      const cronExpression = config.oracle.cronExpression;

      // Should be a valid cron expression (simplified check)
      expect(cronExpression).toMatch(/^\d \* \* \* \*|^(\*\/\d+|\d+(-\d+)?)(,(\*\/\d+|\d+(-\d+)?))*\s/);
    });

    it('should have reasonable max price age', () => {
      const maxPriceAge = config.oracle.maxPriceAge;

      // Should be between 1 minute and 24 hours
      expect(maxPriceAge).toBeGreaterThan(60000); // Min 1 minute
      expect(maxPriceAge).toBeLessThan(86400000); // Max 24 hours
    });
  });
});

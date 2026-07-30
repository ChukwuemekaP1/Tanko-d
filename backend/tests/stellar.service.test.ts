import { StrKey, Keypair } from '@stellar/stellar-sdk';

describe('Stellar SDK Utilities', () => {
  const validKeypair = Keypair.random();
  const validKey = validKeypair.publicKey();

  describe('Public Key Validation', () => {
    it('should validate correct Stellar public key format', () => {
      const isValid = StrKey.isValidEd25519PublicKey(validKey);
      expect(isValid).toBe(true);
    });

    it('should reject invalid public key format', () => {
      const invalidKeys = [
        'INVALID_KEY',
        '1234567890',
        '',
        'GABC', 
      ];

      invalidKeys.forEach((key) => {
        const isValid = StrKey.isValidEd25519PublicKey(key);
        expect(isValid).toBe(false);
      });
    });

    it('should validate generated keypair', () => {
      const newKeypair = Keypair.random();
      expect(StrKey.isValidEd25519PublicKey(newKeypair.publicKey())).toBe(true);
    });
  });

  describe('Keypair Generation', () => {
    it('should be able to generate random keypairs', () => {
      const keypair = Keypair.random();
      
      expect(keypair.publicKey()).toBeDefined();
      expect(keypair.publicKey()).toHaveLength(56);
      expect(keypair.publicKey().startsWith('G')).toBe(true);
      expect(keypair.secret()).toBeDefined();
      expect(keypair.secret().startsWith('S')).toBe(true);
    });
  });

  describe('Transaction Operations', () => {
    it('should have Transaction class available', async () => {
      const { Transaction } = await import('@stellar/stellar-sdk');
      expect(Transaction).toBeDefined();
    });

    it('should have Networks constant', async () => {
      const { Networks } = await import('@stellar/stellar-sdk');
      expect(Networks.TESTNET).toBeDefined();
      expect(Networks.PUBLIC).toBeDefined();
    });
  });

  describe('Horizon Server', () => {
    it('should have Horizon Server available', async () => {
      const { Horizon } = await import('@stellar/stellar-sdk');
      expect(Horizon.Server).toBeDefined();
    });
  });
});

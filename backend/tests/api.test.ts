import request from 'supertest';
import express from 'express';
import { Keypair } from 'stellar-sdk';

const mockContractId = 'CD1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
const mockXdr = 'AAAA4K4KNVGYVLBUJHTHV2WYQXNKA6IJHGBNHWSOHIQB2M4BKZPGQABZABO4IA+pD+YW5T2J6D7E8F9G0H1I2J3';
const mockTxHash = 'abc123def456789012345678901234567890abcdef123456789012345678901234';

const testKeypair = Keypair.random();
const validSender = testKeypair.publicKey();
const testKeypair2 = Keypair.random();
const validApprover = testKeypair2.publicKey();
const testKeypair3 = Keypair.random();
const validReceiver = testKeypair3.publicKey();

const validEscrowPayload = {
  signer: validApprover,
  engagementId: 'ORDER-FUEL-001',
  roles: {
    sender: validSender,
    approver: validApprover,
    receiver: validReceiver,
  },
  amount: '10000000',
  description: 'Pago por suministro de diésel',
  trustline: {
    address: 'CBIELTK6YBZJU5UP2WWQAUYO4SJ2HBMQEFMU7HHD32YBXE7MKU65XABZ',
    decimals: 10000000,
  },
};

const validFundPayload = {
  contractId: mockContractId,
  signer: validSender,
  role: 'sender' as const,
  rolePublicKey: validSender,
  trustline: validEscrowPayload.trustline,
};

const validReleasePayload = {
  contractId: mockContractId,
  signer: validApprover,
  rolePublicKey: validApprover,
};

jest.mock('../src/services/trustlessWork.service', () => ({
  trustlessWorkService: {
    createSingleReleaseEscrow: jest.fn(),
    createMultiReleaseEscrow: jest.fn(),
    fundEscrow: jest.fn(),
    approveMilestone: jest.fn(),
    releaseFunds: jest.fn(),
    getEscrow: jest.fn(),
    disputeEscrow: jest.fn(),
    resolveDispute: jest.fn(),
    setTrustline: jest.fn(),
    getMultipleEscrowBalances: jest.fn(),
    getEscrowsByRole: jest.fn(),
    sendTransaction: jest.fn(),
  },
}));

jest.mock('../src/services/stellar.service', () => ({
  stellarService: {
    validatePublicKey: jest.fn((key: string) => key.startsWith('G') && key.length === 56),
    validateSecretKey: jest.fn((key: string) => key.startsWith('S') && key.length === 56),
    generateKeypair: jest.fn(() => ({
      publicKey: 'GNEWWALLET1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567',
      secret: 'SNNEWWALLET1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
    })),
    signTransaction: jest.fn((xdr: string) => xdr),
    submitTransaction: jest.fn(() => Promise.resolve({ hash: mockTxHash })),
  },
}));

jest.mock('../src/db/prisma', () => ({
  prisma: {},
  default: {},
}));

import escrowRoutes from '../src/routes/escrow.routes';
import walletRoutes from '../src/routes/wallet.routes';
import helperRoutes from '../src/routes/helper.routes';
import { trustlessWorkService } from '../src/services/trustlessWork.service';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', escrowRoutes);
  app.use('/api/v1', walletRoutes);
  app.use('/api/v1/helper', helperRoutes);
  return app;
};

describe('API Endpoints - Escrow Operations', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  describe('POST /api/v1/escrow/single/create', () => {
    it('should create single release escrow successfully', async () => {
      (trustlessWorkService.createSingleReleaseEscrow as jest.Mock).mockResolvedValue({
        success: true,
        data: { contractId: mockContractId, xdr: mockXdr },
      });

      const response = await request(app)
        .post('/api/v1/escrow/single/create')
        .send(validEscrowPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.contractId).toBe(mockContractId);
    });

    it('should reject invalid sender address', async () => {
      const payload = {
        ...validEscrowPayload,
        roles: { ...validEscrowPayload.roles, sender: 'INVALID' },
      };

      const response = await request(app)
        .post('/api/v1/escrow/single/create')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid sender address');
    });

    it('should reject missing required fields', async () => {
      const invalidPayload = { signer: 'test' };

      const response = await request(app)
        .post('/api/v1/escrow/single/create')
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/escrow/multi/create', () => {
    it('should create multi release escrow with milestones', async () => {
      (trustlessWorkService.createMultiReleaseEscrow as jest.Mock).mockResolvedValue({
        success: true,
        data: { contractId: mockContractId, xdr: mockXdr },
      });

      const payload = {
        ...validEscrowPayload,
        milestones: [
          { description: 'Primera entrega' },
          { description: 'Segunda entrega' },
        ],
      };

      const response = await request(app)
        .post('/api/v1/escrow/multi/create')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject multi escrow without milestones', async () => {
      const payload = { ...validEscrowPayload, milestones: [] };

      const response = await request(app)
        .post('/api/v1/escrow/multi/create')
        .send(payload);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/escrow/single/fund', () => {
    it('should fund escrow successfully', async () => {
      (trustlessWorkService.getEscrow as jest.Mock).mockResolvedValue({
        success: true,
        data: { contractId: mockContractId, status: 'initialized' },
      });
      (trustlessWorkService.fundEscrow as jest.Mock).mockResolvedValue({
        success: true,
        data: { txHash: mockTxHash },
      });

      const response = await request(app)
        .post('/api/v1/escrow/single/fund')
        .send(validFundPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.txHash).toBe(mockTxHash);
    });

    it('should return 404 for non-existent escrow', async () => {
      (trustlessWorkService.getEscrow as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Escrow not found',
      });

      const response = await request(app)
        .post('/api/v1/escrow/single/fund')
        .send(validFundPayload);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/escrow/single/approve', () => {
    it('should approve milestone successfully', async () => {
      (trustlessWorkService.getEscrow as jest.Mock).mockResolvedValue({
        success: true,
        data: { contractId: mockContractId, status: 'funded' },
      });
      (trustlessWorkService.approveMilestone as jest.Mock).mockResolvedValue({
        success: true,
        data: { xdr: mockXdr },
      });

      const payload = {
        contractId: mockContractId,
        milestoneIndex: 0,
        signer: validApprover,
        rolePublicKey: validApprover,
      };

      const response = await request(app)
        .post('/api/v1/escrow/single/approve')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.xdr).toBeDefined();
    });
  });

  describe('POST /api/v1/escrow/single/release', () => {
    it('should release funds successfully', async () => {
      (trustlessWorkService.getEscrow as jest.Mock).mockResolvedValue({
        success: true,
        data: { contractId: mockContractId, status: 'approved' },
      });
      (trustlessWorkService.releaseFunds as jest.Mock).mockResolvedValue({
        success: true,
        data: { xdr: mockXdr },
      });

      const response = await request(app)
        .post('/api/v1/escrow/single/release')
        .send(validReleasePayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.xdr).toBeDefined();
    });
  });

  describe('GET /api/v1/escrow', () => {
    it('should get escrow details', async () => {
      (trustlessWorkService.getEscrow as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          contractId: mockContractId,
          status: 'funded',
          amount: '10000000',
          createdAt: '2026-03-20T10:00:00Z',
          updatedAt: '2026-03-20T12:00:00Z',
        },
      });

      const response = await request(app)
        .get('/api/v1/escrow')
        .query({ contractId: mockContractId, type: 'single' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('funded');
    });
  });

  describe('POST /api/v1/escrow/dispute', () => {
    it('should create dispute successfully', async () => {
      (trustlessWorkService.disputeEscrow as jest.Mock).mockResolvedValue({
        success: true,
        data: { xdr: mockXdr },
      });

      const payload = {
        contractId: mockContractId,
        signer: validSender,
        rolePublicKey: validSender,
        reason: 'Combustible no entregado',
      };

      const response = await request(app)
        .post('/api/v1/escrow/dispute')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/escrow/resolve-dispute', () => {
    it('should resolve dispute successfully', async () => {
      (trustlessWorkService.resolveDispute as jest.Mock).mockResolvedValue({
        success: true,
        data: { xdr: mockXdr },
      });

      const payload = {
        contractId: mockContractId,
        signer: validApprover,
        rolePublicKey: validApprover,
        resolver: 'receiver',
        percentage: 100,
      };

      const response = await request(app)
        .post('/api/v1/escrow/resolve-dispute')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('API Endpoints - Wallet Operations', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  describe('POST /api/v1/wallet/generate', () => {
    it('should generate new wallet', async () => {
      const response = await request(app)
        .post('/api/v1/wallet/generate')
        .send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.publicKey).toBeDefined();
      expect(response.body.data.secret).toBeDefined();
    });
  });

  describe('GET /api/v1/wallet/validate', () => {
    it('should validate correct address', async () => {
      const response = await request(app)
        .get('/api/v1/wallet/validate')
        .query({ address: validSender });

      expect(response.status).toBe(200);
      expect(response.body.data.isValid).toBe(true);
    });

    it('should reject invalid address', async () => {
      const response = await request(app)
        .get('/api/v1/wallet/validate')
        .query({ address: 'INVALID' });

      expect(response.status).toBe(200);
      expect(response.body.data.isValid).toBe(false);
    });
  });

  describe('POST /api/v1/transaction/sign', () => {
    it('should sign and submit transaction', async () => {
      const testSecretKeypair = Keypair.random();
      const payload = {
        xdr: mockXdr,
        secret: testSecretKeypair.secret(),
      };

      const response = await request(app)
        .post('/api/v1/transaction/sign')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hash).toBe(mockTxHash);
    });

    it('should reject invalid secret', async () => {
      const payload = {
        xdr: mockXdr,
        secret: 'INVALID',
      };

      const response = await request(app)
        .post('/api/v1/transaction/sign')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid secret key');
    });
  });
});

describe('API Endpoints - Helper Operations', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  describe('POST /api/v1/helper/trustline', () => {
    it('should set trustline successfully', async () => {
      (trustlessWorkService.setTrustline as jest.Mock).mockResolvedValue({
        success: true,
        data: { xdr: mockXdr },
      });

      const payload = {
        address: validSender,
        publicKey: validSender,
        trustline: {
          address: 'CBIELTK6YBZJU5UP2WWQAUYO4SJ2HBMQEFMU7HHD32YBXE7MKU65XABZ',
          decimals: 10000000,
        },
      };

      const response = await request(app)
        .post('/api/v1/helper/trustline')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/helper/escrows-by-role', () => {
    it('should get escrows by role', async () => {
      (trustlessWorkService.getEscrowsByRole as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          { contractId: mockContractId, status: 'funded', amount: '10000000' },
        ],
      });

      const response = await request(app)
        .get('/api/v1/helper/escrows-by-role')
        .query({ role: 'sender', publicKey: validSender });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/helper/multiple-balances', () => {
    it('should get balances for multiple escrows', async () => {
      (trustlessWorkService.getMultipleEscrowBalances as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          { contractId: mockContractId, balance: '5000000' },
          { contractId: 'CD0987654321ZYXWVUTSRQPONMLKJIHGFEDCBA0987654321', balance: '3000000' },
        ],
      });

      const payload = {
        contractIds: [mockContractId, 'CD0987654321ZYXWVUTSRQPONMLKJIHGFEDCBA0987654321'],
      };

      const response = await request(app)
        .post('/api/v1/helper/multiple-balances')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });
});

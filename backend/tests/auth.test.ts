import request from 'supertest';
import app from '../src/index';
import prisma from '../src/db/prisma';

describe('Auth API Endpoints', () => {
  beforeAll(async () => {
    await prisma.driverProfile.deleteMany();
    await prisma.managerProfile.deleteMany();
    await prisma.fuelWallet.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a MANAGER and create a FuelWallet with 0 balance', async () => {
      const payload = {
        name: 'Manager Test',
        email: 'manager@test.com',
        password: 'Password123',
        phone: '1234567890',
        role: 'MANAGER',
        documentId: 'GOV-ID-123',
      };

      const res = await request(app).post('/api/v1/auth/register').send(payload);
      
      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.role).toBe('MANAGER');

      // Verify DB entries
      const managerUser = await prisma.user.findUnique({ where: { email: payload.email } });
      expect(managerUser).not.toBeNull();
      expect(managerUser?.passwordHash).not.toBeNull();
      expect(managerUser?.passwordHash).not.toBe(payload.password); // Should be hashed

      const profile = await prisma.managerProfile.findUnique({ where: { documentId: payload.documentId } });
      expect(profile).not.toBeNull();
      expect(profile?.userId).toBe(managerUser?.id);

      const wallet = await prisma.fuelWallet.findUnique({ where: { userId: managerUser?.id } });
      expect(wallet).not.toBeNull();
      expect(wallet?.balance).toBe(0);
    });

    it('should register a DRIVER without creating a FuelWallet', async () => {
      const payload = {
        name: 'Driver Test',
        email: 'driver@test.com',
        password: 'Password123',
        phone: '0987654321',
        role: 'DRIVER',
        documentId: 'DRV-LIC-123',
      };

      const res = await request(app).post('/api/v1/auth/register').send(payload);
      
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('DRIVER');

      // Verify DB entries
      const driverUser = await prisma.user.findUnique({ where: { email: payload.email } });
      expect(driverUser).not.toBeNull();

      const profile = await prisma.driverProfile.findUnique({ where: { documentId: payload.documentId } });
      expect(profile).not.toBeNull();

      const wallet = await prisma.fuelWallet.findUnique({ where: { userId: driverUser?.id } });
      expect(wallet).toBeNull(); // Drivers should not have their own fuel wallet
    });

    it('should fail registration with duplicate email', async () => {
      const payload = {
        name: 'Another Manager',
        email: 'manager@test.com',
        password: 'Password123',
        phone: '1231231234',
        role: 'MANAGER',
        documentId: 'GOV-ID-999',
      };

      const res = await request(app).post('/api/v1/auth/register').send(payload);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already exists');
    });

    it('should fail registration with duplicate document ID for the same role', async () => {
      const payload = {
        name: 'Manager Duplicate Doc',
        email: 'manager2@test.com',
        password: 'Password123',
        phone: '1231231234',
        role: 'MANAGER',
        documentId: 'GOV-ID-123', // Same as first test
      };

      const res = await request(app).post('/api/v1/auth/register').send(payload);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already registered');
    });
  });
});

import prisma from '../db/prisma.js';
import { randomUUID } from 'crypto';

export type UserRole = 'ADMIN' | 'JEFE' | 'CONDUCTOR';
export type Status = 'ACTIVE' | 'INACTIVE';

export interface CreateUserDTO {
  name: string;
  email: string;
  phone?: string;
  stellarPubKey?: string;
  avalancheCChainAddress?: string;
  avalancheChainId?: string;
  role?: UserRole;
  status?: Status;
  managerId?: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  phone?: string;
  stellarPubKey?: string;
  avalancheCChainAddress?: string;
  avalancheChainId?: string;
  role?: UserRole;
  status?: Status;
  managerId?: string;
}

export class UserRepository {
  async findAll() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByStellarPubKey(pubKey: string) {
    return prisma.user.findFirst({ where: { stellarPubKey: pubKey } });
  }

  async findByAvalancheAddress(address: string) {
    const rows = await prisma.$queryRawUnsafe<unknown[]>(
      'SELECT * FROM "User" WHERE "avalancheCChainAddress" = $1 LIMIT 1',
      address.toLowerCase(),
    );
    return rows[0] ?? null;
  }

  async upsertAvalancheWallet(address: string, chainId?: string | null) {
    const normalized = address.toLowerCase();
    const email = `avax-${normalized.slice(2, 12)}@tanko.wallet`;
    const rows = await prisma.$queryRawUnsafe<unknown[]>(
      `INSERT INTO "User" (
        "id",
        "name",
        "email",
        "avalancheCChainAddress",
        "avalancheChainId",
        "role",
        "status",
        "kycStatus",
        "createdAt",
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, 'CONDUCTOR', 'ACTIVE', 'NOT_STARTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("avalancheCChainAddress")
      DO UPDATE SET "avalancheChainId" = EXCLUDED."avalancheChainId", "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *`,
      randomUUID(),
      `Core ${normalized.slice(0, 6)}...${normalized.slice(-4)}`,
      email,
      normalized,
      chainId ?? null,
    );
    return rows[0] ?? null;
  }

  async findByRole(role: UserRole) {
    return prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateUserDTO) {
    return prisma.user.create({ data });
  }

  async update(id: string, data: UpdateUserDTO) {
    return prisma.user.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  }

  async count() {
    return prisma.user.count();
  }

  async countByRole(role: UserRole) {
    return prisma.user.count({ where: { role } });
  }

  async findDriversByManagerId(managerId: string) {
    return prisma.user.findMany({
      where: { managerId, role: 'CONDUCTOR' },
      include: { units: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDriversWithStats(managerPubKey: string) {
    return prisma.user.findMany({
      where: { role: 'CONDUCTOR' },
      include: {
        driverRequests: {
          where: { managerPubKey },
        },
        units: true,
        fuelLogs: true,
      },
    });
  }
}

export const userRepository = new UserRepository();


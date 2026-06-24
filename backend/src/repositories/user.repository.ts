import prisma from '../db/prisma.js';

export type UserRole = 'ADMIN' | 'JEFE' | 'CONDUCTOR';
export type Status = 'ACTIVE' | 'INACTIVE';

export interface CreateUserDTO {
  name: string;
  email: string;
  phone?: string;
  stellarPubKey?: string;
  role?: UserRole;
  status?: Status;
  managerId?: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  phone?: string;
  stellarPubKey?: string;
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


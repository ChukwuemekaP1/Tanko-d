import prisma from '../db/prisma.js';

export type Status = 'ACTIVE' | 'INACTIVE';

export interface CreateUnitDTO {
  make: string;
  model: string;
  year: number;
  plates: string;
  specs?: string;
  permitNumber?: string;
  permitExpiry?: Date;
  monthlySpend?: number;
  status?: Status;
  userId?: string;
}

export interface UpdateUnitDTO {
  make?: string;
  model?: string;
  year?: number;
  plates?: string;
  specs?: string;
  permitNumber?: string;
  permitExpiry?: Date;
  monthlySpend?: number;
  status?: Status;
  userId?: string | null;
}

export class UnitRepository {
  async findAll() {
    return prisma.unit.findMany({
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.unit.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        fuelLogs: { orderBy: { date: 'desc' }, take: 10 },
      },
    });
  }

  async findByPlates(plates: string) {
    return prisma.unit.findUnique({ where: { plates } });
  }

  async findByUserId(userId: string) {
    return prisma.unit.findMany({
      where: { userId },
      include: { fuelLogs: { orderBy: { date: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive() {
    return prisma.unit.findMany({
      where: { status: 'ACTIVE' },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { monthlySpend: 'desc' },
    });
  }

  async create(data: CreateUnitDTO) {
    return prisma.unit.create({ data });
  }

  async update(id: string, data: UpdateUnitDTO) {
    return prisma.unit.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.unit.delete({ where: { id } });
  }

  async assignDriver(id: string, userId: string | null) {
    return prisma.unit.update({
      where: { id },
      data: { userId },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async count() {
    return prisma.unit.count();
  }

  async countActive() {
    return prisma.unit.count({ where: { status: 'ACTIVE' } });
  }

  async getTopBySpend(limit: number = 5) {
    return prisma.unit.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { monthlySpend: 'desc' },
      take: limit,
      include: { user: { select: { name: true } } },
    });
  }
}

export const unitRepository = new UnitRepository();

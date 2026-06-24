import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";

type DateWindow = {
  startDate?: Date;
  endDate?: Date;
};

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_TOTAL_SPEND_FIELDS = [
  "totalSpend",
  "spend",
  "amount",
  "cost",
  "value",
  "amountSpent",
  "fuelCost",
  "totalCost",
];
const DEFAULT_TOTAL_LITERS_FIELDS = [
  "totalLiters",
  "liters",
  "fuelLiters",
  "quantity",
  "volume",
  "amountLiters",
  "fuelQuantity",
];
const DEFAULT_DRIVER_FIELDS = [
  "driverPubKey",
  "driverPubkey",
  "driverId",
  "driver",
  "pubKey",
  "driverName",
];

function resolveWindow(startDate?: Date, endDate?: Date): DateWindow {
  if (startDate && endDate) {
    return { startDate, endDate };
  }

  if (startDate && !endDate) {
    return { startDate };
  }

  if (!startDate && endDate) {
    return { endDate };
  }

  const now = new Date();

  return {
    startDate: new Date(now.getTime() - THIRTY_DAYS_IN_MS),
    endDate: now,
  };
}

function buildDateWhere(
  field: "createdAt",
  startDate?: Date,
  endDate?: Date,
): any {
  const window = resolveWindow(startDate, endDate);
  const dateFilter: Record<string, Date> = {};

  if (window.startDate) {
    dateFilter.gte = window.startDate;
  }

  if (window.endDate) {
    dateFilter.lte = window.endDate;
  }

  return {
    [field]: dateFilter,
  } as Record<string, unknown>;
}

function toFiniteNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (typeof value === "object" && value !== null) {
    const candidate = value as {
      toNumber?: () => number;
      toString?: () => string;
    };

    if (typeof candidate.toNumber === "function") {
      const parsed = candidate.toNumber();
      return Number.isFinite(parsed) ? parsed : 0;
    }

    if (typeof candidate.toString === "function") {
      const parsed = Number(candidate.toString());
      return Number.isFinite(parsed) ? parsed : 0;
    }
  }

  return 0;
}

function pickNumber(record: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    if (key in record) {
      const value = toFiniteNumber(record[key]);
      if (value !== 0 || record[key] === 0 || record[key] === "0") {
        return value;
      }
    }
  }

  return 0;
}

function pickDriverKey(record: Record<string, unknown>): string {
  for (const key of DEFAULT_DRIVER_FIELDS) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (typeof value === "number" || typeof value === "bigint") {
      return String(value);
    }
  }

  return "unknown";
}

type FuelLogRecord = Record<string, unknown>;

class FuelLogRepository {
  async findAll(startDate?: Date, endDate?: Date) {
    return prisma.fuelLog.findMany({
      where: buildDateWhere("createdAt", startDate, endDate),
      orderBy: {
        date: "desc",
      },
    });
  }

  async findById(id: string) {
    return prisma.fuelLog.findUnique({
      where: { id },
    });
  }

  async findByUnitId(unitId: string, startDate?: Date, endDate?: Date) {
    return prisma.fuelLog.findMany({
      where: {
        unitId,
        ...buildDateWhere("createdAt", startDate, endDate),
      },
      orderBy: {
        date: "desc",
      },
    });
  }

  async findByUserId(userId: string, startDate?: Date, endDate?: Date) {
    return prisma.fuelLog.findMany({
      where: {
        userId,
        ...buildDateWhere("createdAt", startDate, endDate),
      },
      orderBy: {
        date: "desc",
      },
    });
  }

  async findByDriverPubKey(
    driverPubKey: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    return prisma.fuelLog.findMany({
      where: {
        driverPubKey,
        ...buildDateWhere("createdAt", startDate, endDate),
      },
      orderBy: {
        date: "desc",
      },
    });
  }

  async findByDateRange(startDate?: Date, endDate?: Date) {
    return prisma.fuelLog.findMany({
      where: buildDateWhere("createdAt", startDate, endDate),
      orderBy: {
        date: "desc",
      },
    });
  }

  async create(data: Prisma.FuelLogCreateInput) {
    return prisma.fuelLog.create({
      data,
    });
  }

  async update(id: string, data: Prisma.FuelLogUpdateInput) {
    return prisma.fuelLog.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.fuelLog.delete({
      where: { id },
    });
  }

  async getTotalSpend(startDate?: Date, endDate?: Date) {
    const logs = (await this.findByDateRange(
      startDate,
      endDate,
    )) as FuelLogRecord[];

    return logs.reduce(
      (total, record) => total + pickNumber(record, DEFAULT_TOTAL_SPEND_FIELDS),
      0,
    );
  }

  async getTotalLiters(startDate?: Date, endDate?: Date) {
    const logs = (await this.findByDateRange(
      startDate,
      endDate,
    )) as FuelLogRecord[];

    return logs.reduce(
      (total, record) =>
        total + pickNumber(record, DEFAULT_TOTAL_LITERS_FIELDS),
      0,
    );
  }

  async getConsumptionByDriver(startDate?: Date, endDate?: Date) {
    const logs = (await this.findByDateRange(
      startDate,
      endDate,
    )) as FuelLogRecord[];

    const grouped = new Map<
      string,
      {
        driverPubKey: string;
        totalSpend: number;
        totalLiters: number;
        count: number;
      }
    >();

    for (const record of logs) {
      const driverPubKey = pickDriverKey(record);
      const current = grouped.get(driverPubKey) ?? {
        driverPubKey,
        totalSpend: 0,
        totalLiters: 0,
        count: 0,
      };

      current.totalSpend += pickNumber(record, DEFAULT_TOTAL_SPEND_FIELDS);
      current.totalLiters += pickNumber(record, DEFAULT_TOTAL_LITERS_FIELDS);
      current.count += 1;

      grouped.set(driverPubKey, current);
    }

    return Array.from(grouped.values()).sort((left, right) => {
      if (right.totalSpend !== left.totalSpend) {
        return right.totalSpend - left.totalSpend;
      }

      if (right.totalLiters !== left.totalLiters) {
        return right.totalLiters - left.totalLiters;
      }

      return right.count - left.count;
    });
  }

  async getTotalSpendByDriver(startDate?: Date, endDate?: Date) {
    const consumptionByDriver = await this.getConsumptionByDriver(
      startDate,
      endDate,
    );

    return consumptionByDriver
      .map((driver) => ({
        driverPubKey: driver.driverPubKey,
        totalSpend: driver.totalSpend,
      }))
      .sort((left, right) => right.totalSpend - left.totalSpend);
  }

  async getTotalLitersByDriver(startDate?: Date, endDate?: Date) {
    const consumptionByDriver = await this.getConsumptionByDriver(
      startDate,
      endDate,
    );

    return consumptionByDriver
      .map((driver) => ({
        driverPubKey: driver.driverPubKey,
        totalLiters: driver.totalLiters,
      }))
      .sort((left, right) => right.totalLiters - left.totalLiters);
  }

  async getConsumptionByUnit() {
    const result = await prisma.fuelLog.groupBy({
      by: ['unitId'],
      _sum: { liters: true, amount: true },
      orderBy: { _sum: { liters: 'desc' } },
    });

    const unitIds = result.map(r => r.unitId);
    const units = await prisma.unit.findMany({
      where: { id: { in: unitIds } },
      select: { id: true, make: true, model: true, plates: true },
    });

    return result.map(r => {
      const unit = units.find(u => u.id === r.unitId);
      const unitName = unit ? `${unit.make} ${unit.model} (${unit.plates})` : 'Unknown';
      return {
        unitId: r.unitId,
        name: unitName,
        liters: r._sum.liters || 0,
        cost: r._sum.amount || 0,
      };
    });
  }
}

export const fuelLogRepository = new FuelLogRepository();
export default FuelLogRepository;

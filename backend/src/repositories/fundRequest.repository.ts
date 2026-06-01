import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";

type DateWindow = {
  startDate?: Date;
  endDate?: Date;
};
export type FundStatus =
  | 'PENDING'
  | 'ESCROW_INITIALIZED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RELEASED'
  | 'FAILED_BLOCKCHAIN';

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_MANAGER_FIELDS = [
  "managerPubKey",
  "managerPubkey",
  "managerId",
  "manager",
  "pubKey",
  "managerName",
];
const DEFAULT_DRIVER_FIELDS = [
  "driverPubKey",
  "driverPubkey",
  "driverId",
  "driver",
  "pubKey",
  "driverName",
];
const DEFAULT_AMOUNT_FIELDS = [
  "amountReleased",
  "releasedAmount",
  "amount",
  "value",
  "total",
  "requestedAmount",
  "amountRequested",
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
  const createdAtFilter: Record<string, Date> = {};

  if (window.startDate) {
    createdAtFilter.gte = window.startDate;
  }

  if (window.endDate) {
    createdAtFilter.lte = window.endDate;
  }

  return {
    [field]: createdAtFilter,
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

function pickStatus(record: Record<string, unknown>): string {
  const value = record.status;

  if (typeof value === "string") {
    return value.toLowerCase();
  }

  return "";
}

function pickManagerKey(record: Record<string, unknown>): string {
  for (const key of DEFAULT_MANAGER_FIELDS) {
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

function isReleasedStatus(status: string) {
  return ["approved", "released", "paid", "completed"].includes(
    status.toLowerCase(),
  );
}

type FundRequestRecord = Record<string, unknown>;

class FundRequestRepository {
  async findAll(startDate?: Date, endDate?: Date) {
    return prisma.fundRequest.findMany({
      where: buildDateWhere("createdAt", startDate, endDate),
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string) {
    return prisma.fundRequest.findUnique({
      where: { id },
    });
  }

  async findByDriverPubKey(
    driverPubKey: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    return prisma.fundRequest.findMany({
      where: {
        driverPubKey,
        ...buildDateWhere("createdAt", startDate, endDate),
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findByManagerPubKey(
    managerPubKey: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    return prisma.fundRequest.findMany({
      where: {
        managerPubKey,
        ...buildDateWhere("createdAt", startDate, endDate),
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findPendingByManager(
    managerPubKey: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    return prisma.fundRequest.findMany({
      where: {
        managerPubKey,
        status: {
          in: ["pending", "PENDING", "Pending"],
        },
        ...buildDateWhere("createdAt", startDate, endDate),
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findByStatus(status: string, startDate?: Date, endDate?: Date) {
    const normalizedStatus = status.trim();

    return prisma.fundRequest.findMany({
      where: {
        status: {
          in: [
            normalizedStatus,
            normalizedStatus.toLowerCase(),
            normalizedStatus.toUpperCase(),
          ],
        },
        ...buildDateWhere("createdAt", startDate, endDate),
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async create(data: Prisma.FundRequestUncheckedCreateInput) {
    return prisma.fundRequest.create({
      data,
    });
  }

  async update(id: string, data: Prisma.FundRequestUpdateInput) {
    return prisma.fundRequest.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.fundRequest.delete({
      where: { id },
    });
  }

  async count(startDate?: Date, endDate?: Date) {
    const requests = (await this.findAll(
      startDate,
      endDate,
    )) as FundRequestRecord[];
    return requests.length;
  }

  async countByStatus(status: string, startDate?: Date, endDate?: Date) {
    const requests = (await this.findByStatus(
      status,
      startDate,
      endDate,
    )) as FundRequestRecord[];
    return requests.length;
  }

  async countPending(startDate?: Date, endDate?: Date) {
    const requests = (await this.findAll(
      startDate,
      endDate,
    )) as FundRequestRecord[];

    return requests.filter((request) => pickStatus(request) === "pending")
      .length;
  }

  async getTotalReleased(startDate?: Date, endDate?: Date) {
    const requests = (await this.findAll(
      startDate,
      endDate,
    )) as FundRequestRecord[];

    return requests.reduce((total, request) => {
      const status = pickStatus(request);
      if (!isReleasedStatus(status)) {
        return total;
      }

      return total + pickNumber(request, DEFAULT_AMOUNT_FIELDS);
    }, 0);
  }

  async getStatsByManager(
    managerPubKey: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const requests = (await this.findByManagerPubKey(
      managerPubKey,
      startDate,
      endDate,
    )) as FundRequestRecord[];

    let totalRequested = 0;
    let totalReleased = 0;
    let pendingRequests = 0;
    let approvedRequests = 0;
    let rejectedRequests = 0;

    for (const request of requests) {
      const status = pickStatus(request);
      const amount = pickNumber(request, DEFAULT_AMOUNT_FIELDS);

      totalRequested += amount;

      if (status === "pending") {
        pendingRequests += 1;
      } else if (
        status === "approved" ||
        status === "released" ||
        status === "paid" ||
        status === "completed"
      ) {
        approvedRequests += 1;
        totalReleased += amount;
      } else if (
        status === "rejected" ||
        status === "declined" ||
        status === "cancelled" ||
        status === "canceled"
      ) {
        rejectedRequests += 1;
      }
    }

    return {
      managerPubKey: pickManagerKey({ managerPubKey }),
      totalRequests: requests.length,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalRequested,
      totalReleased,
    };
  }

  async findByManagerAndDriver(
    managerPubKey: string,
    driverPubKey: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    return prisma.fundRequest.findMany({
      where: {
        managerPubKey,
        driverPubKey,
        ...buildDateWhere("createdAt", startDate, endDate),
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getDriverStats(driverPubKey: string, startDate?: Date, endDate?: Date) {
    const requests = (await this.findByDriverPubKey(
      driverPubKey,
      startDate,
      endDate,
    )) as FundRequestRecord[];

    const totalRequested = requests.reduce(
      (total, request) => total + pickNumber(request, DEFAULT_AMOUNT_FIELDS),
      0,
    );
    const totalReleased = requests.reduce((total, request) => {
      const status = pickStatus(request);
      return isReleasedStatus(status)
        ? total + pickNumber(request, DEFAULT_AMOUNT_FIELDS)
        : total;
    }, 0);

    return {
      driverPubKey,
      totalRequests: requests.length,
      totalRequested,
      totalReleased,
      pendingRequests: requests.filter(
        (request) => pickStatus(request) === "pending",
      ).length,
    };
  }
}

export const fundRequestRepository = new FundRequestRepository();
export default FundRequestRepository;

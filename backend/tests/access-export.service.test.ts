// ── Mocks ──────────────────────────────────────────────────────────────────

const mockUsers = [
  { id: "u1", name: "Ana", email: "ana@test.com", phone: null, stellarPubKey: "GABC", role: "CONDUCTOR", status: "ACTIVE", kycStatus: "NOT_STARTED", createdAt: new Date("2026-01-10") },
  { id: "u2", name: "Bob", email: "bob@test.com", phone: null, stellarPubKey: "GXYZ", role: "JEFE",      status: "ACTIVE", kycStatus: "NOT_STARTED", createdAt: new Date("2026-03-05") },
];
const mockUnits = [
  { id: "n1", make: "Ford", model: "F-150", year: 2022, plates: "ABC123", status: "ACTIVE", userId: "u1", monthlySpend: 4500, createdAt: new Date("2026-01-15") },
];
const mockFuelLogs = [
  { id: "f1", date: new Date("2026-04-01"), liters: 50, pricePerLiter: 22.5, amount: 1125, fuelType: "Diesel", station: "PEMEX Norte", stationAddress: null, escrowId: null, escrowStatus: null, unitId: "n1", userId: "u1", createdAt: new Date("2026-04-01") },
  { id: "f2", date: new Date("2026-05-15"), liters: 30, pricePerLiter: 23,   amount: 690,  fuelType: "Diesel", station: "PEMEX Sur",  stationAddress: null, escrowId: null, escrowStatus: null, unitId: "n1", userId: "u1", createdAt: new Date("2026-05-15") },
];
const mockFundRequests = [
  { id: "r1", liters: 50, amount: 1125, description: "Carga semanal", status: "APPROVED", contractId: null, driverPubKey: "GABC", managerPubKey: "GXYZ", createdAt: new Date("2026-04-01"), updatedAt: new Date("2026-04-01") },
  { id: "r2", liters: 30, amount: 690,  description: null,            status: "PENDING",  contractId: null, driverPubKey: "GABC", managerPubKey: "GXYZ", createdAt: new Date("2026-05-20"), updatedAt: new Date("2026-05-20") },
];
const mockEscrowConfigs = [
  { id: "e1", name: "default", usdcAddress: "CBIELTK6", decimals: 7, platformFee: 0, createdAt: new Date("2026-01-01") },
];

jest.mock("../src/db/prisma.js", () => ({
  prisma: {
    user:         { findMany: jest.fn() },
    unit:         { findMany: jest.fn() },
    fuelLog:      { findMany: jest.fn() },
    fundRequest:  { findMany: jest.fn() },
    escrowConfig: { findMany: jest.fn() },
  },
}));

jest.mock("child_process", () => ({
  execFile: jest.fn((_cmd, _args, cb) => cb(null, "", "")),
}));

jest.mock("fs/promises", () => ({
  mkdtemp:  jest.fn().mockResolvedValue("/tmp/tanko-mock"),
  writeFile: jest.fn().mockResolvedValue(undefined),
  rm:       jest.fn().mockResolvedValue(undefined),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

import { prisma } from "../src/db/prisma.js";
import { exportToAccess } from "../src/services/access-export.service.js";

function setupPrismaMocks(users = mockUsers, units = mockUnits, fuelLogs = mockFuelLogs, fundRequests = mockFundRequests, escrowConfigs = mockEscrowConfigs) {
  (prisma.user.findMany         as jest.Mock).mockResolvedValue(users);
  (prisma.unit.findMany         as jest.Mock).mockResolvedValue(units);
  (prisma.fuelLog.findMany      as jest.Mock).mockResolvedValue(fuelLogs);
  (prisma.fundRequest.findMany  as jest.Mock).mockResolvedValue(fundRequests);
  (prisma.escrowConfig.findMany as jest.Mock).mockResolvedValue(escrowConfigs);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("access-export.service", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls exportToAccess without options and includes all 5 tables", async () => {
    setupPrismaMocks();
    const { zipPath, cleanup } = await exportToAccess();

    expect(zipPath).toMatch(/tanko-export-.+\.zip/);

    const { writeFile } = await import("fs/promises");
    const writeCalls = (writeFile as jest.Mock).mock.calls.map((c: any[]) => c[0] as string);
    const filenames = writeCalls.map((p) => p.split("/").pop());

    expect(filenames).toContain("users.csv");
    expect(filenames).toContain("units.csv");
    expect(filenames).toContain("fuel_logs.csv");
    expect(filenames).toContain("fund_requests.csv");
    expect(filenames).toContain("escrow_config.csv");

    await cleanup();
    const { rm } = await import("fs/promises");
    expect(rm).toHaveBeenCalledWith(zipPath, { force: true });
  });

  it("passes date range filter to prisma when from/to are provided", async () => {
    setupPrismaMocks();
    const from = new Date("2026-04-01");
    const to   = new Date("2026-04-30");

    await exportToAccess({ from, to });

    expect(prisma.fuelLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ date: expect.any(Object) }) }),
    );
    expect(prisma.fundRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ createdAt: expect.any(Object) }) }),
    );
  });

  it("applies no date filter when opts are omitted", async () => {
    setupPrismaMocks();
    await exportToAccess();

    expect(prisma.fuelLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined }),
    );
  });

  it("CSV content contains correct headers and row data", async () => {
    setupPrismaMocks();
    await exportToAccess();

    const { writeFile } = await import("fs/promises");
    const fuelLogsCall = (writeFile as jest.Mock).mock.calls.find((c: any[]) =>
      (c[0] as string).endsWith("fuel_logs.csv"),
    );
    expect(fuelLogsCall).toBeDefined();
    const csv = fuelLogsCall![1] as string;
    expect(csv).toMatch(/^id,date,liters/);
    expect(csv).toContain("PEMEX Norte");
    expect(csv).toContain("PEMEX Sur");
  });

  it("CSV escapes values containing commas", async () => {
    const logsWithComma = [{ ...mockFuelLogs[0], station: "PEMEX, Centro" }];
    setupPrismaMocks(mockUsers, mockUnits, logsWithComma, mockFundRequests, mockEscrowConfigs);
    await exportToAccess();

    const { writeFile } = await import("fs/promises");
    const fuelLogsCall = (writeFile as jest.Mock).mock.calls.find((c: any[]) =>
      (c[0] as string).endsWith("fuel_logs.csv"),
    );
    expect(fuelLogsCall![1]).toContain('"PEMEX, Centro"');
  });

  it("generates separate zip file per call", async () => {
    setupPrismaMocks();
    const a = await exportToAccess();
    setupPrismaMocks();
    const b = await exportToAccess();
    expect(a.zipPath).not.toBe(b.zipPath);
  });
});

import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { prisma } from "../db/prisma.js";

const execFileAsync = promisify(execFile);

export interface ExportOptions {
  from?: Date;
  to?: Date;
}

interface CsvTable {
  filename: string;
  rows: Record<string, unknown>[];
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))];
  return lines.join("\n");
}

async function fetchTables(opts: ExportOptions): Promise<CsvTable[]> {
  const { from, to } = opts;
  const dateFilter = (field: string) => ({
    ...(from && { [field]: { gte: from } }),
    ...(to && { [field]: { lte: to } }),
  });

  const [users, units, fuelLogs, fundRequests, escrowConfigs] = await Promise.all([
    prisma.user.findMany({
      where: from || to ? { createdAt: { gte: from, lte: to } } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        stellarPubKey: true,
        role: true,
        status: true,
        kycStatus: true,
        createdAt: true,
      },
    }),

    prisma.unit.findMany({
      where: from || to ? { createdAt: { gte: from, lte: to } } : undefined,
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        plates: true,
        status: true,
        userId: true,
        monthlySpend: true,
        createdAt: true,
      },
    }),

    prisma.fuelLog.findMany({
      where: from || to ? { date: dateFilter("date").date } : undefined,
      select: {
        id: true,
        date: true,
        liters: true,
        pricePerLiter: true,
        amount: true,
        fuelType: true,
        station: true,
        stationAddress: true,
        escrowId: true,
        escrowStatus: true,
        unitId: true,
        userId: true,
        createdAt: true,
      },
    }),

    prisma.fundRequest.findMany({
      where: from || to ? { createdAt: dateFilter("createdAt").createdAt } : undefined,
      select: {
        id: true,
        liters: true,
        amount: true,
        description: true,
        status: true,
        contractId: true,
        driverPubKey: true,
        managerPubKey: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    prisma.escrowConfig.findMany({
      select: {
        id: true,
        name: true,
        usdcAddress: true,
        decimals: true,
        platformFee: true,
        createdAt: true,
      },
    }),
  ]);

  return [
    { filename: "users.csv", rows: users as Record<string, unknown>[] },
    { filename: "units.csv", rows: units as Record<string, unknown>[] },
    { filename: "fuel_logs.csv", rows: fuelLogs as Record<string, unknown>[] },
    { filename: "fund_requests.csv", rows: fundRequests as Record<string, unknown>[] },
    { filename: "escrow_config.csv", rows: escrowConfigs as Record<string, unknown>[] },
  ];
}

export async function exportToAccess(opts: ExportOptions = {}): Promise<{ zipPath: string; cleanup: () => Promise<void> }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "tanko-export-"));
  const zipPath = path.join(os.tmpdir(), `tanko-export-${timestamp}.zip`);

  try {
    const tables = await fetchTables(opts);

    await Promise.all(
      tables.map((t) => fs.writeFile(path.join(tmpDir, t.filename), toCsv(t.rows), "utf-8")),
    );

    await execFileAsync("zip", ["-j", zipPath, ...tables.map((t) => path.join(tmpDir, t.filename))]);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  return {
    zipPath,
    cleanup: () => fs.rm(zipPath, { force: true }),
  };
}

import { Request, Response } from "express";
import { statsService } from "../services/stats.service.js";

type QueryValue = string | string[] | undefined;

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseDateValue(value: QueryValue, boundary: "start" | "end"): Date | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value) || typeof value !== "string") {
    throw new Error("Invalid date format");
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    return undefined;
  }

  if (isDateOnly(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);

    if ([year, month, day].some((part) => Number.isNaN(part))) {
      throw new Error("Invalid date format");
    }

    const parsed =
      boundary === "start"
        ? new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
        : new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
      throw new Error("Invalid date format");
    }

    return parsed;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date format");
  }

  return parsed;
}

function parseDateRange(query: Record<string, unknown>) {
  const startDate = parseDateValue(query.startDate as QueryValue, "start");
  const endDate = parseDateValue(query.endDate as QueryValue, "end");

  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    throw new Error("Invalid date format");
  }

  return { startDate, endDate };
}

function parseLimit(queryLimit: QueryValue, fallback = 50) {
  if (queryLimit === undefined) {
    return fallback;
  }

  if (Array.isArray(queryLimit)) {
    throw new Error("Invalid limit");
  }

  const parsed = Number.parseInt(queryLimit, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Invalid limit");
  }

  return parsed;
}

class StatsController {
  async getDashboardStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = parseDateRange(req.query as Record<string, unknown>);
      const stats = await statsService.getDashboardStats(startDate, endDate);

      return res.json(stats);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load dashboard stats";

      if (message === "Invalid date format") {
        return res.status(400).json({ message });
      }

      return res.status(500).json({ message });
    }
  }

  async getConsumptionByDriver(req: Request, res: Response) {
    try {
      const { startDate, endDate } = parseDateRange(req.query as Record<string, unknown>);
      const stats = await statsService.getConsumptionByDriver(startDate, endDate);

      return res.json(stats);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load consumption stats";

      if (message === "Invalid date format") {
        return res.status(400).json({ message });
      }

      return res.status(500).json({ message });
    }
  }

  async getRecentTransactions(req: Request, res: Response) {
    try {
      const { startDate, endDate } = parseDateRange(req.query as Record<string, unknown>);
      const limit = parseLimit(req.query.limit as QueryValue, 50);
      const transactions = await statsService.getRecentTransactions(startDate, endDate, limit);

      return res.json(transactions);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load recent transactions";

      if (message === "Invalid date format" || message === "Invalid limit") {
        return res.status(400).json({ message });
      }

      return res.status(500).json({ message });
    }
  }

  async getReportStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = parseDateRange(req.query as Record<string, unknown>);
      const report = await statsService.getReportStats(startDate, endDate);

      return res.json(report);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load report stats";

      if (message === "Invalid date format") {
        return res.status(400).json({ message });
      }

      return res.status(500).json({ message });
    }
  }

  async getStatsSummary(req: Request, res: Response): Promise<void> {
    try {
      const stats = await statsService.getStatsSummary();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats summary',
      });
    }
  }
}

export const statsController = new StatsController();
export default StatsController;
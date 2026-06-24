import { Request, Response } from "express";
import { fuelLogRepository } from "../repositories/fuelLog.repository.js";

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

class FuelLogController {
  async getAll(req: Request, res: Response) {
    try {
      const { startDate, endDate } = parseDateRange(req.query as Record<string, unknown>);
      const fuelLogs = await fuelLogRepository.findAll(startDate, endDate);

      if (fuelLogs.length === 0) {
        return res.status(404).json({ message: "No fuel logs found" });
      }

      return res.json(fuelLogs);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load fuel logs";

      if (message === "Invalid date format") {
        return res.status(400).json({ message });
      }

      return res.status(500).json({ message });
    }
  }

  async getByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate } = parseDateRange(req.query as Record<string, unknown>);
      const fuelLogs = await fuelLogRepository.findByDateRange(startDate, endDate);

      if (fuelLogs.length === 0) {
        return res.status(404).json({ message: "No fuel logs found" });
      }

      return res.json(fuelLogs);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load fuel logs by date range";

      if (message === "Invalid date format") {
        return res.status(400).json({ message });
      }

      return res.status(500).json({ message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = req.params.id ?? req.params.fuelLogId;
      const fuelLog = await fuelLogRepository.findById(id);

      if (!fuelLog) {
        return res.status(404).json({ message: "Fuel log not found" });
      }

      return res.json(fuelLog);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load fuel log";
      return res.status(500).json({ message });
    }
  }

  async getByUnitId(req: Request, res: Response) {
    try {
      const id = req.params.id ?? req.params.unitId;
      const { startDate, endDate } = parseDateRange(req.query as Record<string, unknown>);
      const fuelLogs = await fuelLogRepository.findByUnitId(id, startDate, endDate);

      if (fuelLogs.length === 0) {
        return res.status(404).json({ message: "No fuel logs found" });
      }

      return res.json(fuelLogs);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load fuel logs";

      if (message === "Invalid date format") {
        return res.status(400).json({ message });
      }

      return res.status(500).json({ message });
    }
  }

  async getByUserId(req: Request, res: Response) {
    try {
      const id = req.params.id ?? req.params.userId;
      const { startDate, endDate } = parseDateRange(req.query as Record<string, unknown>);
      const fuelLogs = await fuelLogRepository.findByUserId(id, startDate, endDate);

      if (fuelLogs.length === 0) {
        return res.status(404).json({ message: "No fuel logs found" });
      }

      return res.json(fuelLogs);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load fuel logs";

      if (message === "Invalid date format") {
        return res.status(400).json({ message });
      }

      return res.status(500).json({ message });
    }
  }

  async getByDriverPubKey(req: Request, res: Response) {
    try {
      const driverPubKey = req.params.driverPubKey ?? req.params.id;
      const { startDate, endDate } = parseDateRange(req.query as Record<string, unknown>);
      const fuelLogs = await fuelLogRepository.findByDriverPubKey(driverPubKey, startDate, endDate);

      if (fuelLogs.length === 0) {
        return res.status(404).json({ message: "No fuel logs found" });
      }

      return res.json(fuelLogs);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load fuel logs";

      if (message === "Invalid date format") {
        return res.status(400).json({ message });
      }

      return res.status(500).json({ message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const fuelLog = await fuelLogRepository.create(req.body);
      return res.status(201).json(fuelLog);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create fuel log";
      return res.status(500).json({ message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = req.params.id ?? req.params.fuelLogId;
      const fuelLog = await fuelLogRepository.update(id, req.body);
      return res.json(fuelLog);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update fuel log";
      return res.status(500).json({ message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = req.params.id ?? req.params.fuelLogId;
      await fuelLogRepository.delete(id);
      return res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete fuel log";
      return res.status(500).json({ message });
    }
  }
}

export const fuelLogController = new FuelLogController();
export default FuelLogController;
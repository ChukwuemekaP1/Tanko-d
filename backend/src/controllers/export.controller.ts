import { Request, Response } from "express";
import { exportToAccess } from "../services/access-export.service.js";
import { logger } from "../utils/logger.js";

export async function handleAccessExport(req: Request, res: Response): Promise<void> {
  // Role guard: only JEFE
  const role = (req as any).userRole as string | undefined;
  if (role !== "JEFE") {
    res.status(403).json({ success: false, error: "Forbidden: JEFE role required" });
    return;
  }

  const { from, to } = req.query as { from?: string; to?: string };

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  if (fromDate && isNaN(fromDate.getTime())) {
    res.status(400).json({ success: false, error: "Invalid 'from' date" });
    return;
  }
  if (toDate && isNaN(toDate.getTime())) {
    res.status(400).json({ success: false, error: "Invalid 'to' date" });
    return;
  }

  let result: Awaited<ReturnType<typeof exportToAccess>> | undefined;
  try {
    result = await exportToAccess({ from: fromDate, to: toDate });
    const filename = result.zipPath.split("/").pop()!;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.sendFile(result.zipPath, async (err) => {
      if (err) logger.error("Error sending export file", { err });
      await result!.cleanup();
    });
  } catch (err) {
    logger.error("Access export failed", { err });
    if (result) await result.cleanup().catch(() => {});
    res.status(500).json({ success: false, error: "Export failed" });
  }
}

import { Request, Response } from "express";
import { escrowService } from "../services/escrow.service.js";

export class EscrowController {
  async createSingleReleaseEscrow(req: Request, res: Response) {
    try {
      const data = req.body;

      const result = await escrowService.createSingleReleaseEscrow({
        ...data,
        title: data.title || data.description || "Escrow",
        milestones: data.milestones?.map((m: any) => ({
          title: m.title || m.description,
          description: m.description,
          amount: m.amount,
        })),
      });

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  async createMultiReleaseEscrow(req: Request, res: Response) {
    try {
      const data = req.body;

      const result = await escrowService.createMultiReleaseEscrow({
        ...data,
        title: data.title || data.description || "Multi-Release Escrow",
        milestones: data.milestones?.map((m: any) => ({
          title: m.title || m.description,
          description: m.description,
          amount: m.amount,
        })),
      });

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async fundEscrow(req: Request, res: Response) {
    try {
      const result = await escrowService.fundEscrow(req.body);
      res.status(result.success ? 200 : 400).json(result);
    } catch {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async fundMultiReleaseEscrow(req: Request, res: Response) {
    try {
      const result = await escrowService.fundMultiReleaseEscrow(req.body);
      res.status(result.success ? 200 : 400).json(result);
    } catch {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async approveMilestone(req: Request, res: Response) {
    try {
      const result = await escrowService.approveMilestone(req.body);
      res.status(result.success ? 200 : 400).json(result);
    } catch {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async approveMultiReleaseMilestone(req: Request, res: Response) {
    try {
      const result = await escrowService.approveMultiReleaseMilestone(req.body);
      res.status(result.success ? 200 : 400).json(result);
    } catch {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async releaseFunds(req: Request, res: Response) {
    try {
      const result = await escrowService.releaseFunds(req.body);
      res.status(result.success ? 200 : 400).json(result);
    } catch {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async releaseMultiReleaseFunds(req: Request, res: Response) {
    try {
      const result = await escrowService.releaseMultiReleaseFunds(req.body);
      res.status(result.success ? 200 : 400).json(result);
    } catch {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getEscrow(req: Request, res: Response) {
    try {
      const { contractId, type } = req.query as any;
      const result = await escrowService.getEscrow(
        contractId,
        type || "single",
      );
      res.status(result.success ? 200 : 404).json(result);
    } catch {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async disputeEscrow(req: Request, res: Response) {
    try {
      const { contractId, signer, rolePublicKey, reason } = req.body;

      const result = await escrowService.disputeEscrow(
        contractId,
        signer,
        rolePublicKey,
        reason,
      );

      res.status(result.success ? 200 : 400).json(result);
    } catch {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async resolveDispute(req: Request, res: Response) {
    try {
      const { contractId, signer, rolePublicKey, resolver, percentage } =
        req.body;

      const result = await escrowService.resolveDispute(
        contractId,
        signer,
        rolePublicKey,
        resolver,
        percentage,
      );

      res.status(result.success ? 200 : 400).json(result);
    } catch {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
}

export const escrowController = new EscrowController();

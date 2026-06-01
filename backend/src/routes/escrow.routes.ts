import { Router } from "express";
import { escrowController } from "../controllers/escrow.controller.js";
import { validate } from "../middleware/validate.js";
import {
  approveMilestoneSchema,
  createEscrowSchema,
  disputeEscrowSchema,
  fundEscrowSchema,
  getEscrowSchema,
  resolveDisputeSchema,
} from "../schemas/escrow.schema.js";
import { releaseFundsSchema } from "../schemas/funds.schema.js";

const router = Router();

router.post(
  "/escrow/single/create",
  validate(createEscrowSchema),
  escrowController.createSingleReleaseEscrow,
);
router.post(
  "/escrow/multi/create",
  validate(createEscrowSchema),
  escrowController.createMultiReleaseEscrow,
);

router.post(
  "/escrow/single/fund",
  validate(fundEscrowSchema),
  escrowController.fundEscrow,
);
router.post(
  "/escrow/multi/fund",
  validate(fundEscrowSchema),
  escrowController.fundMultiReleaseEscrow,
);

router.post(
  "/escrow/single/approve",
  validate(approveMilestoneSchema),
  escrowController.approveMilestone,
);
router.post(
  "/escrow/multi/approve",
  validate(approveMilestoneSchema),
  escrowController.approveMultiReleaseMilestone,
);

router.post(
  "/escrow/single/release",
  validate(releaseFundsSchema),
  escrowController.releaseFunds,
);
router.post(
  "/escrow/multi/release",
  validate(releaseFundsSchema),
  escrowController.releaseMultiReleaseFunds,
);

router.get(
  "/escrow",
  validate(getEscrowSchema, "query"),
  escrowController.getEscrow,
);

router.post(
  "/escrow/dispute",
  validate(disputeEscrowSchema),
  escrowController.disputeEscrow,
);
router.post(
  "/escrow/resolve-dispute",
  validate(resolveDisputeSchema),
  escrowController.resolveDispute,
);

export default router;

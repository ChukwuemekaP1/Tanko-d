import { Router } from "express";
import { fundsController } from "../controllers/funds.controller.js";
import { validate } from "../middleware/validate.js";
import {
  createFundRequestSchema,
  approveFundRequestSchema,
  releaseFundsSchema,
  rejectFundRequestSchema,
  fundTestnetSchema,
} from "../schemas/funds.schema.js";
import { stellarPubKeySchema } from "../schemas/common.schema.js";
import { z } from "zod";

const router = Router();

router.post(
  "/funds/request",
  validate(createFundRequestSchema),
  fundsController.createRequest,
);

router.post(
  "/funds/approve",
  validate(approveFundRequestSchema),
  fundsController.approveRequest,
);

router.post(
  "/funds/release",
  validate(releaseFundsSchema),
  fundsController.releaseFunds,
);

router.post(
  "/funds/reject",
  validate(rejectFundRequestSchema),
  fundsController.rejectRequest,
);

router.get(
  "/funds/request/:id",
  validate(z.object({ id: z.string().uuid() }), "params"),
  fundsController.getRequest,
);

router.get(
  "/funds/pending",
  validate(z.object({ managerPubKey: stellarPubKeySchema }), "query"),
  fundsController.getPendingRequests,
);

router.get(
  "/funds/driver/:publicKey",
  validate(z.object({ publicKey: stellarPubKeySchema }), "params"),
  fundsController.getRequestsByDriver,
);

router.post(
  "/accounts/fund",
  validate(fundTestnetSchema),
  fundsController.fundTestnetAccount,
);

router.get(
  "/escrow/:contractId/status",
  validate(z.object({ contractId: z.string().min(1) }), "params"),
  fundsController.getEscrowStatus,
);

router.post("/accounts/create", fundsController.createTestnetAccount);

export default router;

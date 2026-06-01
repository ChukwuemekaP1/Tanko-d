import { z } from "zod";
import {
  stellarPubKeySchema,
  positiveNumber,
  uuidSchema,
} from "./common.schema.js";

export const createFundRequestSchema = z.object({
  driverPubKey: stellarPubKeySchema,
  managerPubKey: stellarPubKeySchema,
  liters: positiveNumber,
  amount: positiveNumber,
  description: z.string().optional(),
});

export const approveFundRequestSchema = z.object({
  requestId: uuidSchema,
  managerPubKey: stellarPubKeySchema,
  managerSecret: z.string().optional(),
});

export const releaseFundsSchema = z.object({
  requestId: uuidSchema,
  managerPubKey: stellarPubKeySchema,
  managerSecret: z.string().min(1, "managerSecret is required"),
});

export const rejectFundRequestSchema = z.object({
  requestId: uuidSchema,
  managerPubKey: stellarPubKeySchema,
});

export const fundTestnetSchema = z.object({
  publicKey: stellarPubKeySchema,
});

import { z } from "zod";
import {
  stellarPubKeySchema,
  emailSchema,
  optionalString,
  uuidSchema,
} from "./common.schema.js";

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: emailSchema,
  phone: optionalString,
  stellarPubKey: stellarPubKeySchema.optional(),
  role: z.string().optional(),
});

export const updateUserSchema = createUserSchema.partial();

export const userIdParamSchema = z.object({
  id: uuidSchema,
});

export const stellarParamSchema = z.object({
  publicKey: stellarPubKeySchema,
});

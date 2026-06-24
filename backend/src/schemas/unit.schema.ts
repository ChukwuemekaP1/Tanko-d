import { z } from "zod";
import { uuidSchema } from "./common.schema.js";

export const unitIdParamSchema = z.object({
  id: uuidSchema,
});

export const userIdParamSchema = z.object({
  userId: uuidSchema,
});

export const unitQuerySchema = z.object({
  active: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
});

export const createUnitSchema = z.object({
  name: z.string().min(1).max(100),
  plates: z.string().min(1),
  userId: uuidSchema,
  isActive: z.boolean().optional(),
});

export const updateUnitSchema = createUnitSchema.partial();

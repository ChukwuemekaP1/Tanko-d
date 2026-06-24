import { z } from "zod";
import { uuidSchema, positiveNumber } from "./common.schema.js";

export const createFuelLogSchema = z.object({
  date: z.coerce.date(),
  liters: positiveNumber,
  pricePerLiter: positiveNumber,
  amount: positiveNumber,
  fuelType: z.string().optional(),
  station: z.string().min(1),
  stationAddress: z.string().optional(),
  coords: z.string().optional(),
  unitId: uuidSchema,
  userId: uuidSchema,
});

export const updateFuelLogSchema = createFuelLogSchema.partial();

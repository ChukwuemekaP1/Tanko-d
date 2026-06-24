import { z } from "zod";

/** Stellar Public Key: base32, 56 characters, starts with 'G'. */
export const stellarPubKeySchema = z
  .string()
  .length(56, "Stellar Public Key must be exactly 56 characters")
  .regex(/^G[A-Z2-7]{55}$/, "Invalid Stellar Public Key format");

/** UUID */
export const uuidSchema = z.string().uuid("Invalid UUID");

/** Positive number */
export const positiveNumber = z.number().positive("Must be a positive number");

/** Optional string (trimmed) */
export const optionalString = z.string().trim().optional();

/** Email */
export const emailSchema = z.string().email("Invalid email format");

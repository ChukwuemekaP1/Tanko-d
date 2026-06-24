import { z } from "zod";

/** Stellar Public Key: base32, 56 characters, starts with 'G'. */
export const stellarPubKeySchema = z
  .string()
  .length(56, "Stellar Public Key must be exactly 56 characters")
  .regex(/^G[A-Z2-7]{55}$/, "Invalid Stellar Public Key format");

/** Avalanche C-Chain address: EVM hex address. */
export const avalancheCChainAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Avalanche C-Chain address");

/** UUID */
export const uuidSchema = z.string().uuid("Invalid UUID");

/** Positive number */
export const positiveNumber = z.number().positive("Must be a positive number");

/** Optional string (trimmed) */
export const optionalString = z.string().trim().optional();

/** Email */
export const emailSchema = z.string().email("Invalid email format");

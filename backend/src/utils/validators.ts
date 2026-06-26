import { z } from 'zod';
import {
  createEscrowSchema,
  fundEscrowSchema,
  approveMilestoneSchema,
  getEscrowSchema,
  disputeEscrowSchema,
  resolveDisputeSchema,
  trustlineSchema,
} from '../schemas/escrow.schema.js';

// Re-export escrow schemas so tests can import from validators
export {
  createEscrowSchema,
  fundEscrowSchema,
  approveMilestoneSchema,
  getEscrowSchema,
  disputeEscrowSchema,
  resolveDisputeSchema,
};

// Multi-release escrow (alias of single with milestones required)
export const createMultiReleaseEscrowSchema = createEscrowSchema.extend({
  milestones: z.array(z.object({
    title: z.string().optional(),
    description: z.string().min(1),
    amount: z.number().positive(),
  })).min(1, 'At least one milestone is required'),
});

// Release funds schema
export const releaseFundsSchema = z.object({
  contractId: z.string().min(1, 'Contract ID is required'),
  signer: z.string().min(1, 'Signer is required'),
  rolePublicKey: z.string().min(1, 'Role public key is required'),
});

export const sendTransactionSchema = z.object({
  signedXdr: z.string().min(1, 'Signed XDR is required'),
});


export const setTrustlineSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  publicKey: z.string().min(1, 'Public key is required'),
  trustline: z.object({
    address: z.string().min(1),
    decimals: z.number().int().positive().optional().default(7),
  }),
});

export const getEscrowsByRoleSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  publicKey: z.string().min(1, 'Public key is required'),
});

export const getMultipleBalancesSchema = z.object({
  contractIds: z.array(z.string().min(1)).min(1, 'At least one contract ID is required'),
});


export type SendTransactionInput = z.infer<typeof sendTransactionSchema>;
export type SetTrustlineInput = z.infer<typeof setTrustlineSchema>;
export type GetEscrowsByRoleInput = z.infer<typeof getEscrowsByRoleSchema>;
export type GetMultipleBalancesInput = z.infer<typeof getMultipleBalancesSchema>;

// ── Driver Registration ──────────────────────────────────────────────

/** Stellar Public Key: base32, 56 characters, starts with 'G'. */
export const stellarPubKeySchema = z
  .string()
  .length(56, 'Stellar Public Key must be exactly 56 characters')
  .regex(
    /^G[A-Z2-7]{55}$/,
    'Invalid Stellar Public Key format (must start with G, uppercase letters A-Z and digits 2-7)',
  );

export const registerDriverSchema = z.object({
  name: z.string().min(1, 'Driver name is required').max(100, 'Name must be 100 characters or less'),
  stellarPubKey: stellarPubKeySchema,
});

export type RegisterDriverInput = z.infer<typeof registerDriverSchema>;

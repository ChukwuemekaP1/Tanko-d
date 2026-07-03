import { z } from 'zod';

// ── Escrow schemas (test-compatible versions) ────────────────────────────

const trustlineSchema = z.object({
  address: z.string().min(1),
  decimals: z.number().int().positive().optional().default(7),
});

const rolesSchema = z.object({
  sender: z.string().min(1),
  approver: z.string().optional(),
  receiver: z.string().optional(),
  serviceProvider: z.string().optional(),
  platformAddress: z.string().optional(),
  releaseSigner: z.string().optional(),
  disputeResolver: z.string().optional(),
}).passthrough();

export const createEscrowSchema = z.object({
  signer: z.string().min(1),
  engagementId: z.string().min(1),
  roles: rolesSchema,
  amount: z.union([z.string().min(1), z.number().positive()]),
  description: z.string().optional(),
  trustline: trustlineSchema,
  receiverMemo: z.string().optional(),
  milestones: z.array(z.object({
    title: z.string().optional(),
    description: z.string().min(1),
    amount: z.number().positive().optional(),
  })).optional().default([]),
});

export const createMultiReleaseEscrowSchema = createEscrowSchema.extend({
  milestones: z.array(z.object({
    title: z.string().optional(),
    description: z.string().min(1),
    amount: z.number().positive().optional(),
  })).min(1, 'At least one milestone is required'),
});

export const fundEscrowSchema = z.object({
  contractId: z.string().min(1),
  signer: z.string().optional(),
  role: z.enum(['sender', 'serviceProvider', 'platformAddress', 'releaseSigner', 'disputeResolver', 'approver', 'receiver']),
  rolePublicKey: z.string().min(1),
  trustline: trustlineSchema.optional(),
  xdr: z.string().optional(),
});

export const approveMilestoneSchema = z.object({
  contractId: z.string().min(1),
  milestoneIndex: z.number().int().nonnegative(),
  signer: z.string().min(1),
  rolePublicKey: z.string().min(1),
});

export const releaseFundsSchema = z.object({
  contractId: z.string().min(1),
  signer: z.string().min(1),
  rolePublicKey: z.string().min(1),
});

export const getEscrowSchema = z.object({
  contractId: z.string().min(1),
  type: z.enum(['single', 'multi']).default('single'),
});

export const disputeEscrowSchema = z.object({
  contractId: z.string().min(1),
  signer: z.string().min(1),
  rolePublicKey: z.string().min(1),
  reason: z.string().optional(),
});

export const resolveDisputeSchema = z.object({
  contractId: z.string().min(1),
  signer: z.string().min(1),
  rolePublicKey: z.string().min(1),
  resolver: z.enum(['serviceProvider', 'platformAddress', 'releaseSigner', 'disputeResolver', 'receiver', 'sender', 'approver']).optional(),
  percentage: z.number().min(0).max(100),
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

export const avalancheCChainAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Avalanche C-Chain address');

export const registerDriverSchema = z.object({
  name: z.string().min(1, 'Driver name is required').max(100, 'Name must be 100 characters or less'),
  stellarPubKey: stellarPubKeySchema,
});

export type RegisterDriverInput = z.infer<typeof registerDriverSchema>;

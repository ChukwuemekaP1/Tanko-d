import z from "zod";

export const trustlineSchema = z.object({
  address: z.string().min(1, "Trustline address is required"),
  decimals: z.number().int().positive().optional().default(7),
  symbol: z.string().optional(),
});

export const milestoneSchema = z.object({
  title: z.string().optional(),
  description: z.string().min(1, "Milestone description is required"),
  amount: z.number().positive("Milestone amount must be positive"),
});

export const rolesSchema = z.object({
  sender: z.string().min(1, "sender address is required"),
  serviceProvider: z.string().min(1, "serviceProvider address is required"),
  platformAddress: z.string().min(1, "platformAddress is required"),
  releaseSigner: z.string().min(1, "releaseSigner address is required"),
  disputeResolver: z.string().min(1, "disputeResolver address is required"),
  approver: z.string().optional(),
  receiver: z.string().optional(),
});

export const createEscrowSchema = z.object({
  signer: z.string().min(1, "Signer address is required"),
  engagementId: z.string().min(1, "Engagement ID is required"),
  title: z.string().optional(),
  description: z.string().optional(),
  roles: rolesSchema,
  amount: z.number().positive("Amount must be positive"),
  platformFee: z.number().min(0).optional().default(0),
  milestones: z.array(milestoneSchema).optional().default([]),
  trustline: trustlineSchema,
});

export const fundEscrowSchema = z.object({
  contractId: z.string().min(1, "Contract ID is required"),
  xdr: z.string().min(1, "XDR is required"),
  rolePublicKey: z.string().min(1, "Role public key is required"),
});

export const approveMilestoneSchema = z.object({
  contractId: z.string().min(1, "Contract ID is required"),
  milestoneIndex: z
    .number()
    .int()
    .nonnegative("Milestone index must be non-negative"),
  signer: z.string().min(1, "Signer is required"),
  rolePublicKey: z.string().min(1, "Role public key is required"),
});

export const getEscrowSchema = z.object({
  contractId: z.string().min(1, "Contract ID is required"),
  type: z.enum(["single", "multi"]).default("single"),
});

export const disputeEscrowSchema = z.object({
  contractId: z.string().min(1, "Contract ID is required"),
  signer: z.string().min(1, "Signer is required"),
  rolePublicKey: z.string().min(1, "Role public key is required"),
  reason: z.string().optional(),
});

export const resolveDisputeSchema = z.object({
  contractId: z.string().min(1, "Contract ID is required"),
  signer: z.string().min(1, "Signer is required"),
  rolePublicKey: z.string().min(1, "Role public key is required"),
  resolver: z.enum([
    "serviceProvider",
    "platformAddress",
    "releaseSigner",
    "disputeResolver",
  ]),
  percentage: z.number().min(0).max(100),
});

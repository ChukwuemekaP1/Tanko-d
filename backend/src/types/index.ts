export interface Trustline {
  address: string;
  decimals: number;
  symbol?: string;
}

export interface Roles {
  sender: string;
  serviceProvider: string;
  platformAddress: string;
  releaseSigner: string;
  disputeResolver: string;
  approver?: string;
  receiver?: string;
}

export interface EscrowMilestone {
  title?: string;
  description: string;
  amount: number;
  index?: number;
}

export interface Milestone extends EscrowMilestone {
  status?: 'pending' | 'approved' | 'released' | 'disputed';
}

export interface CreateEscrowPayload {
  signer: string;
  engagementId: string;
  title?: string;
  description?: string;
  roles: Roles;
  amount: number;
  platformFee?: number;
  milestones?: EscrowMilestone[];
  trustline: Trustline;
}

export interface FundEscrowPayload {
  contractId: string;
  xdr: string;
  rolePublicKey: string;
}

export interface ApproveMilestonePayload {
  contractId: string;
  milestoneIndex: number;
  signer: string;
  rolePublicKey: string;
}

export interface ReleaseFundsPayload {
  contractId: string;
  signer: string;
  rolePublicKey: string;
}

export interface SendTransactionPayload {
  signedXdr: string;
}

export interface EscrowResponse {
  contractId?: string;
  unsignedTransaction?: string;
  xdr?: string;
  escrowId?: string;
  id?: string;
}

export interface TrustlessWorkResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface EscrowStatus {
  contractId: string;
  status: 'initialized' | 'funded' | 'approved' | 'released' | 'disputed';
  amount: string;
  milestone?: EscrowMilestone;
  milestones?: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface FundRequest {
  id: string;
  driverPublicKey: string;
  managerPublicKey: string;
  amount: string;
  description: string;
  status:
    | 'pending'
    | 'escrow_initialized'
    | 'approved'
    | 'rejected'
    | 'released'
    | 'failed_blockchain';
  contractId?: string;
  escrowXdr?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FundRequestPayload {
  amount: string;
  description?: string;
}

export interface ApproveFundRequestPayload {
  requestId: string;
  managerSecret: string;
  createNewEscrow?: boolean;
}

export interface RejectFundRequestPayload {
  requestId: string;
  reason?: string;
}

export interface TestnetAccount {
  publicKey: string;
  secret: string;
}

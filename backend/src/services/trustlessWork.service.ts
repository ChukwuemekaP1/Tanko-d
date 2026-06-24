import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index.js';
import {
  CreateEscrowPayload,
  FundEscrowPayload,
  ApproveMilestonePayload,
  ReleaseFundsPayload,
  SendTransactionPayload,
  EscrowResponse,
  EscrowStatus,
  Milestone,
} from '../types/index.js';

export interface MultiReleaseEscrowPayload extends CreateEscrowPayload {
  milestones: Omit<Milestone, 'status'>[];
}

export interface TrustlessWorkResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export class TrustlessWorkService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = config.trustlessWork.apiKey;
    this.client = axios.create({
      baseURL: config.trustlessWork.apiUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
    });
  }

  async createSingleReleaseEscrow(payload: CreateEscrowPayload): Promise<TrustlessWorkResponse<EscrowResponse>> {
    try {
      const response = await this.client.post('/deployer/single-release', payload);
      return {
        success: true,
        data: response.data as EscrowResponse,
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async createMultiReleaseEscrow(
    payload: MultiReleaseEscrowPayload
  ): Promise<TrustlessWorkResponse<EscrowResponse>> {
    try {
      const response = await this.client.post('/deployer/multi-release', payload);
      return {
        success: true,
        data: response.data as EscrowResponse,
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async fundEscrow(payload: FundEscrowPayload): Promise<TrustlessWorkResponse<{ txHash: string }>> {
    try {
      const response = await this.client.post('/escrow/single/fund-escrow', payload);
      return {
        success: true,
        data: response.data as { txHash: string },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async fundMultiReleaseEscrow(payload: FundEscrowPayload): Promise<TrustlessWorkResponse<{ txHash: string }>> {
    try {
      const response = await this.client.post('/escrow/multi/fund-escrow', payload);
      return {
        success: true,
        data: response.data as { txHash: string },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async approveMilestone(payload: ApproveMilestonePayload): Promise<TrustlessWorkResponse<{ xdr: string }>> {
    try {
      const response = await this.client.post('/escrow/single/approve-milestone', payload);
      return {
        success: true,
        data: response.data as { xdr: string },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async approveMultiReleaseMilestone(
    payload: ApproveMilestonePayload
  ): Promise<TrustlessWorkResponse<{ xdr: string }>> {
    try {
      const response = await this.client.post('/escrow/multi/approve-milestone', payload);
      return {
        success: true,
        data: response.data as { xdr: string },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async releaseFunds(payload: ReleaseFundsPayload): Promise<TrustlessWorkResponse<{ xdr: string }>> {
    try {
      const response = await this.client.post('/escrow/single/release-funds', payload);
      return {
        success: true,
        data: response.data as { xdr: string },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async releaseMultiReleaseFunds(payload: ReleaseFundsPayload): Promise<TrustlessWorkResponse<{ xdr: string }>> {
    try {
      const response = await this.client.post('/escrow/multi/release-milestone-funds', payload);
      return {
        success: true,
        data: response.data as { xdr: string },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async getEscrow(contractId: string): Promise<TrustlessWorkResponse<EscrowStatus>> {
    try {
      const response = await this.client.get(`/escrow/single/get-escrow?contractId=${contractId}`);
      return {
        success: true,
        data: response.data as EscrowStatus,
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async getMultiReleaseEscrow(contractId: string): Promise<TrustlessWorkResponse<EscrowStatus & { milestones: Milestone[] }>> {
    try {
      const response = await this.client.get(`/escrow/multi/get-escrow?contractId=${contractId}`);
      return {
        success: true,
        data: response.data as EscrowStatus & { milestones: Milestone[] },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async setTrustline(payload: {
    address: string;
    publicKey: string;
    trustline: { address: string; decimals: number };
  }): Promise<TrustlessWorkResponse<{ xdr: string }>> {
    try {
      const response = await this.client.post('/helper/set-trustline', payload);
      return {
        success: true,
        data: response.data as { xdr: string },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async sendTransaction(payload: SendTransactionPayload): Promise<TrustlessWorkResponse<{ txHash: string }>> {
    try {
      const response = await this.client.post('/helper/send-transaction', payload);
      return {
        success: true,
        data: response.data as { txHash: string },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async getEscrowsByRole(
    role: string,
    publicKey: string
  ): Promise<TrustlessWorkResponse<EscrowStatus[]>> {
    try {
      const response = await this.client.get(`/helper/get-escrows-by-role?role=${role}&publicKey=${publicKey}`);
      return {
        success: true,
        data: response.data as EscrowStatus[],
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async getMultipleEscrowBalances(
    contractIds: string[]
  ): Promise<TrustlessWorkResponse<{ contractId: string; balance: string }[]>> {
    try {
      const response = await this.client.post('/escrow/get-multiple-escrow-balance', { contractIds });
      return {
        success: true,
        data: response.data as { contractId: string; balance: string }[],
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async disputeEscrow(
    contractId: string,
    signer: string,
    rolePublicKey: string,
    reason?: string
  ): Promise<TrustlessWorkResponse<{ xdr: string }>> {
    try {
      const response = await this.client.post('/escrow/single/dispute-escrow', {
        contractId,
        signer,
        rolePublicKey,
        reason,
      });
      return {
        success: true,
        data: response.data as { xdr: string },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async resolveDispute(
    contractId: string,
    signer: string,
    rolePublicKey: string,
    resolver: 'serviceProvider' | 'platformAddress' | 'releaseSigner' | 'disputeResolver',
    percentage: number
  ): Promise<TrustlessWorkResponse<{ xdr: string }>> {
    try {
      const response = await this.client.post('/escrow/single/resolve-dispute', {
        contractId,
        signer,
        rolePublicKey,
        resolver,
        percentage,
      });
      return {
        success: true,
        data: response.data as { xdr: string },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): TrustlessWorkResponse<never> {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      return {
        success: false,
        error: message,
        statusCode: error.response?.status,
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
      statusCode: 500,
    };
  }
}

export const trustlessWorkService = new TrustlessWorkService();

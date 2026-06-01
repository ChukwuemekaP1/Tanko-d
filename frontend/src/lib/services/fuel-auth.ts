// @ts-ignore
const { Server } = require('stellar-sdk');
import axios from 'axios';

const HORIZON_URL = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const SOROBAN_CONTRACT_ID = process.env.SOROBAN_CONTRACT_ID;
const TRUSTLESS_WORK_API_URL = process.env.TRUSTLESS_WORK_API_URL || 'https://dev.api.trustlesswork.com';
const TRUSTLESS_WORK_API_KEY = process.env.TRUSTLESS_WORK_API_KEY;
const ESCROW_ID = process.env.ESCROW_ID;

export enum AuthorizationError {
  CONTRACT_UNAUTHORIZED = 'UNAUTHORIZED_BY_CONTRACT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
}

export interface MilestoneResponse {
  id: string;
  title: string;
  amount: string;
  status: string;
}

export interface ApproveMilestoneResponse {
  success: boolean;
  data?: {
    xdr?: string;
  };
  error?: string;
}

export interface FuelUnlockResult {
  success: boolean;
  milestoneId?: string;
  txHash?: string;
  error?: string;
  errorType?: AuthorizationError;
}

interface TrustlessWorkResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class FuelAuthorizationService {
  private horizonServer: Server;
  private contractId: string;
  private escrowId: string;

  constructor() {
    this.horizonServer = new Server(HORIZON_URL);
    this.contractId = SOROBAN_CONTRACT_ID || '';
    this.escrowId = ESCROW_ID || '';
  }

  private async invokeContract(
    driverWallet: string,
    stationWallet: string
  ): Promise<boolean> {
    try {
      const account = await this.horizonServer.loadAccount(driverWallet);
      
      const result = await this.horizonServer.simulateTransaction({
        source: driverWallet,
        ops: [
          {
            type: 'invokeContract',
            destination: this.contractId,
            method: 'verify_tx',
            parameters: [
              { name: 'driver', value: { type: 'address', value: driverWallet } },
              { name: 'station', value: { type: 'address', value: stationWallet } },
            ],
          },
        ],
      });

      if (result.error) {
        console.error('[CONTRACT] Verification failed:', result.error);
        return false;
      }

      const authEntries = result.results?.[0]?.auth;
      if (!authEntries || authEntries.length === 0) {
        console.log('[CONTRACT] No authorization entries, assuming valid');
        return true;
      }

      return true;
    } catch (error: any) {
      console.error('[CONTRACT] Error invoking contract:', error.message);
      if (error.message?.includes('could not resolve')) {
        throw new Error(AuthorizationError.CONTRACT_UNAUTHORIZED);
      }
      throw error;
    }
  }

  private async createMilestone(
    title: string,
    amount: number,
    receiverAddress: string
  ): Promise<TrustlessWorkResponse<MilestoneResponse>> {
    try {
      const amountInStroops = Math.floor(amount * 10 ** 7);

      const response = await axios.post(
        `${TRUSTLESS_WORK_API_URL}/escrows/${this.escrowId}/milestones`,
        {
          title,
          amount: amountInStroops,
          receiver_address: receiverAddress,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': TRUSTLESS_WORK_API_KEY,
          },
        }
      );

      console.log('[API] Milestone created:', response.data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[API] Error creating milestone:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  private async approveMilestone(
    milestoneId: string
  ): Promise<ApproveMilestoneResponse> {
    try {
      const response = await axios.post(
        `${TRUSTLESS_WORK_API_URL}/milestones/${milestoneId}/approve`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': TRUSTLESS_WORK_API_KEY,
          },
        }
      );

      console.log('[API] Milestone approved:', response.data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[API] Error approving milestone:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async requestFuelUnlock(
    driverWallet: string,
    stationWallet: string,
    amount: number,
    title: string
  ): Promise<FuelUnlockResult> {
    console.log('[FUEL AUTH] Starting fuel unlock flow');
    console.log(`[FUEL AUTH] Driver: ${driverWallet.slice(0, 8)}...`);
    console.log(`[FUEL AUTH] Station: ${stationWallet.slice(0, 8)}...`);
    console.log(`[FUEL AUTH] Amount: ${amount} USDC`);

    if (!this.contractId) {
      console.error('[CONFIG] SOROBAN_CONTRACT_ID not set');
      return {
        success: false,
        error: 'Contract not configured',
        errorType: AuthorizationError.VALIDATION_ERROR,
      };
    }

    if (!this.escrowId) {
      console.error('[CONFIG] ESCROW_ID not set');
      return {
        success: false,
        error: 'Escrow not configured',
        errorType: AuthorizationError.VALIDATION_ERROR,
      };
    }

    try {
      console.log('[STEP 1] Verifying on-chain...');
      const isVerified = await this.invokeContract(driverWallet, stationWallet);

      if (!isVerified) {
        console.warn('[STEP 1] Contract verification returned false');
        return {
          success: false,
          error: 'Unauthorized: Driver or station not registered',
          errorType: AuthorizationError.CONTRACT_UNAUTHORIZED,
        };
      }

      console.log('[STEP 1] On-chain verification passed ✓');

      console.log('[STEP 2] Creating milestone...');
      const createResult = await this.createMilestone(
        title,
        amount,
        stationWallet
      );

      if (!createResult.success || !createResult.data?.id) {
        console.error('[STEP 2] Failed to create milestone');
        return {
          success: false,
          error: createResult.error || 'Failed to create milestone',
          errorType: AuthorizationError.API_ERROR,
        };
      }

      const milestoneId = createResult.data.id;
      console.log(`[STEP 2] Milestone created: ${milestoneId} ✓`);

      console.log('[STEP 3] Approving milestone...');
      const approveResult = await this.approveMilestone(milestoneId);

      if (!approveResult.success) {
        console.error('[STEP 3] Failed to approve milestone');
        return {
          success: false,
          error: approveResult.error || 'Failed to approve milestone',
          errorType: AuthorizationError.API_ERROR,
        };
      }

      console.log('[STEP 3] Milestone approved ✓');
      console.log('[FUEL AUTH] Fuel unlock completed successfully!');

      return {
        success: true,
        milestoneId,
        txHash: approveResult.data?.xdr,
      };
    } catch (error: any) {
      console.error('[FUEL AUTH] Error during fuel unlock:', error);

      if (error.message === AuthorizationError.CONTRACT_UNAUTHORIZED) {
        return {
          success: false,
          error: 'Unauthorized: Driver or station not registered in smart contract',
          errorType: AuthorizationError.CONTRACT_UNAUTHORIZED,
        };
      }

      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'Network error: Unable to connect to Stellar network',
          errorType: AuthorizationError.NETWORK_ERROR,
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        errorType: AuthorizationError.NETWORK_ERROR,
      };
    }
  }
}

export const fuelAuthorizationService = new FuelAuthorizationService();
export default fuelAuthorizationService;

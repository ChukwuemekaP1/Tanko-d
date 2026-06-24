import {
  CreateEscrowPayload,
  EscrowResponse,
  TestnetAccount,
} from '../types/index.js';
import { trustlessWorkService } from './trustlessWork.service.js';
import { stellarService } from './stellar.service.js';
import { fundRequestRepository } from '../repositories/fundRequest.repository.js';
import { escrowConfigRepository } from '../repositories/escrowConfig.repository.js';
import { escrowMilestoneRepository } from '../repositories/escrowMilestone.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { sendEmail } from './mail.service.js';
import axios from 'axios';
import prisma from '../db/prisma.js';

export interface CreateFundRequestInput {
  driverPubKey: string;
  managerPubKey: string;
  liters: number;
  amount: number;
  description?: string;
}

export interface ApproveFundRequestInput {
  requestId: string;
  managerSecret?: string;
}

export interface ReleaseFundsInput {
  requestId: string;
  managerSecret: string;
  managerPubKey: string;
}

export interface RejectFundRequestInput {
  requestId: string;
}

export class FundsService {
  async createRequest(input: CreateFundRequestInput) {
    if (!stellarService.validatePublicKey(input.driverPubKey)) {
      return { success: false, error: 'Invalid driver public key' };
    }

    if (!stellarService.validatePublicKey(input.managerPubKey)) {
      return { success: false, error: 'Invalid manager public key' };
    }

    if (input.amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    const request = await fundRequestRepository.create({
      driverPubKey: input.driverPubKey,
      managerPubKey: input.managerPubKey,
      liters: input.liters,
      amount: input.amount,
      description: input.description,
    });

    // Notify the manager about the new fuel request
    const [manager, driver] = await Promise.all([
      userRepository.findByStellarPubKey(input.managerPubKey),
      userRepository.findByStellarPubKey(input.driverPubKey),
    ]);
    if (manager?.email) {
      sendEmail({
        to: manager.email,
        subject: `Fuel request: ${input.liters}L from ${driver?.name ?? 'Driver'}`,
        template: 'fuelRequestCreated',
        context: {
          driverName: driver?.name ?? 'Driver',
          managerName: manager.name,
          liters: input.liters,
          amount: input.amount,
          description: input.description,
        },
      });
    }

    return { success: true, data: request };
  }

  async approveRequest(input: ApproveFundRequestInput, managerPubKey: string) {
    const request = await fundRequestRepository.findById(input.requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    if (
      request.status === 'ESCROW_INITIALIZED' &&
      request.contractId &&
      request.escrowXdr
    ) {
      return {
        success: true,
        data: {
          request: await fundRequestRepository.findById(request.id),
          contractId: request.contractId,
          escrowXdr: request.escrowXdr,
        },
      };
    }

    if (!['PENDING', 'FAILED_BLOCKCHAIN'].includes(request.status)) {
      return { success: false, error: `Request is already ${request.status}` };
    }

    if (request.managerPubKey !== managerPubKey) {
      return { success: false, error: 'Only the assigned manager can approve this request' };
    }

    const escrowConfig = await escrowConfigRepository.getDefault();
    const trustline = {
      address: escrowConfig.usdcAddress,
      decimals: escrowConfig.decimals,
    };

    const escrowPayload: CreateEscrowPayload = {
      signer: managerPubKey,
      engagementId: `TANKO-REQ-${request.id}`,
      title: `Fuel Request - ${request.liters}L`,
      description: request.description || `Fuel request for ${request.liters} liters`,
      roles: {
        sender: managerPubKey,
        serviceProvider: managerPubKey,
        platformAddress: managerPubKey,
        releaseSigner: managerPubKey,
        disputeResolver: managerPubKey,
        approver: managerPubKey,
        receiver: request.driverPubKey,
      },
      amount: request.amount,
      platformFee: escrowConfig.platformFee,
      milestones: [
        {
          title: 'Fuel Log Verification',
          description: `Release ${request.amount} after valid fuel log submission for request ${request.id}.`,
          amount: request.amount,
        },
      ],
      trustline,
    };

    console.info('[FundsService] Initializing Trustless Work escrow', {
      requestId: request.id,
      engagementId: escrowPayload.engagementId,
      managerPubKey,
      network: stellarService.getNetworkPassphrase(),
    });

    try {
      const escrowResult = await trustlessWorkService.createMultiReleaseEscrow({
        ...escrowPayload,
        milestones: escrowPayload.milestones || [],
      });

      console.info('[FundsService] Trustless Work escrow response', {
        requestId: request.id,
        success: escrowResult.success,
        statusCode: escrowResult.statusCode,
        contractId: escrowResult.data?.contractId,
        hasUnsignedXdr: Boolean(
          escrowResult.data?.unsignedTransaction || escrowResult.data?.xdr
        ),
      });

      if (!escrowResult.success || !escrowResult.data) {
        await fundRequestRepository.update(request.id, {
          status: 'FAILED_BLOCKCHAIN',
        });

        return {
          success: false,
          error: escrowResult.error || 'Failed to create escrow',
        };
      }

      const contractId = escrowResult.data.contractId || escrowResult.data.escrowId;
      const unsignedXdr = escrowResult.data.unsignedTransaction || escrowResult.data.xdr;

      if (!contractId || !unsignedXdr) {
        await fundRequestRepository.update(request.id, {
          status: 'FAILED_BLOCKCHAIN',
        });

        return {
          success: false,
          error: 'Trustless Work response missing contractId or unsigned escrow XDR',
        };
      }

      await prisma.$transaction(async (tx: any) => {
        await tx.fundRequest.update({
          where: { id: request.id },
          data: {
            status: 'ESCROW_INITIALIZED',
            contractId,
            escrowXdr: unsignedXdr,
            escrowTxHash: null,
          },
        });

        const existingMilestone = await tx.escrowMilestone.findFirst({
          where: { contractId },
        });

        if (!existingMilestone) {
          await tx.escrowMilestone.create({
            data: {
              escrowId: contractId,
              contractId,
              engagementId: escrowPayload.engagementId,
              title: escrowPayload.title || 'Fuel Request',
              description: escrowPayload.description || 'Fuel request',
              amount: request.amount,
              status: 'PENDING',
            },
          });
        }
      });

      // Notify the driver that escrow is locked and they can fuel up
      const driverUser = await userRepository.findByStellarPubKey(request.driverPubKey);
      if (driverUser?.email) {
        sendEmail({
          to: driverUser.email,
          subject: 'Escrow locked — you are authorized to fuel',
          template: 'escrowLocked',
          context: {
            driverName: driverUser.name,
            liters: request.liters,
            amount: request.amount,
            contractId,
          },
        });
      }

      return {
        success: true,
        data: {
          request: await fundRequestRepository.findById(request.id),
          contractId,
          escrowXdr: unsignedXdr,
        },
      };
    } catch (error) {
      await fundRequestRepository.update(request.id, {
        status: 'FAILED_BLOCKCHAIN',
      });

      console.error('[FundsService] Escrow initialization failed', {
        requestId: request.id,
        error: error instanceof Error ? error.message : error,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize escrow',
      };
    }
  }

  async releaseFunds(input: ReleaseFundsInput) {
    if (!stellarService.validateSecretKey(input.managerSecret)) {
      return { success: false, error: 'Invalid secret key' };
    }

    const request = await fundRequestRepository.findById(input.requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    if (!['ESCROW_INITIALIZED', 'APPROVED'].includes(request.status)) {
      return {
        success: false,
        error: 'Request escrow must be initialized before releasing funds',
      };
    }

    if (!request.contractId) {
      return { success: false, error: 'No escrow contract associated' };
    }

    const escrowStatus = await trustlessWorkService.getMultiReleaseEscrow(request.contractId);

    if (!escrowStatus.success || !escrowStatus.data) {
      return { success: false, error: 'Failed to get escrow status' };
    }

    if (escrowStatus.data.status === 'released') {
      return { success: false, error: 'Funds already released' };
    }

    const approveResult = await trustlessWorkService.approveMultiReleaseMilestone({
      contractId: request.contractId,
      milestoneIndex: 1,
      signer: input.managerPubKey,
      rolePublicKey: input.managerPubKey,
    });

    if (!approveResult.success || !approveResult.data) {
      return { success: false, error: approveResult.error || 'Failed to approve milestone' };
    }

    const signedApproveXdr = stellarService.signTransaction(
      approveResult.data.xdr,
      input.managerSecret
    );
    await stellarService.submitTransaction(signedApproveXdr);

    const releaseResult = await trustlessWorkService.releaseMultiReleaseFunds({
      contractId: request.contractId,
      signer: input.managerPubKey,
      rolePublicKey: input.managerPubKey,
    });

    if (!releaseResult.success || !releaseResult.data) {
      return { success: false, error: releaseResult.error || 'Failed to release funds' };
    }

    const signedReleaseXdr = stellarService.signTransaction(
      releaseResult.data.xdr,
      input.managerSecret
    );
    const txResult = await stellarService.submitTransaction(signedReleaseXdr);

    await fundRequestRepository.update(request.id, { status: 'RELEASED' });

    const milestone = await escrowMilestoneRepository.findByContractId(request.contractId);
    if (milestone) {
      await escrowMilestoneRepository.update(milestone.id, {
        status: 'RELEASED',
        releasedAt: new Date(),
      });
    }

    return { success: true, txHash: txResult.hash };
  }

  rejectRequest(input: RejectFundRequestInput, managerPubKey: string) {
    return this.rejectRequestInternal(input, managerPubKey);
  }

  private async rejectRequestInternal(input: RejectFundRequestInput, managerPubKey: string) {
    const request = await fundRequestRepository.findById(input.requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    if (request.status !== 'PENDING') {
      return { success: false, error: `Cannot reject request with status: ${request.status}` };
    }

    if (request.managerPubKey !== managerPubKey) {
      return { success: false, error: 'Only the assigned manager can reject this request' };
    }

    await fundRequestRepository.update(request.id, {
      status: 'REJECTED',
    });

    return {
      success: true,
      data: await fundRequestRepository.findById(request.id),
    };
  }

  getRequest(id: string) {
    return this.getRequestInternal(id);
  }

  private async getRequestInternal(id: string) {
    const request = await fundRequestRepository.findById(id);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }
    return { success: true, data: request };
  }

  getPendingRequests(managerPubKey: string) {
    return this.getPendingRequestsInternal(managerPubKey);
  }

  private async getPendingRequestsInternal(managerPubKey: string) {
    const requests = await fundRequestRepository.findPendingByManager(managerPubKey);
    return { success: true, data: requests };
  }

  getRequestsByDriver(driverPubKey: string) {
    return this.getRequestsByDriverInternal(driverPubKey);
  }

  private async getRequestsByDriverInternal(driverPubKey: string) {
    const requests = await fundRequestRepository.findByDriverPubKey(driverPubKey);
    return { success: true, data: requests };
  }

  async createTestnetAccount(): Promise<{ success: boolean; data?: TestnetAccount; error?: string }> {
    try {
      const keypair = stellarService.generateKeypair();

      await axios.get(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(keypair.publicKey)}`
      );

      return {
        success: true,
        data: {
          publicKey: keypair.publicKey,
          secret: keypair.secret,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create testnet account',
      };
    }
  }

  async fundTestnetAccount(publicKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.get(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
      );
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fund account',
      };
    }
  }

  async getEscrowStatus(contractId: string) {
    const result = await trustlessWorkService.getMultiReleaseEscrow(contractId);

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Escrow not found' };
    }

    return {
      success: true,
      data: {
        contractId: result.data.contractId,
        status: result.data.status,
        balance: result.data.amount,
      },
    };
  }

  async getEscrowConfig() {
    const config = await escrowConfigRepository.getDefault();
    return { success: true, data: config };
  }

  async updateEscrowConfig(data: { usdcAddress?: string; decimals?: number; platformFee?: number }) {
    const config = await escrowConfigRepository.update('default', data);
    return { success: true, data: config };
  }
}

export const fundsService = new FundsService();

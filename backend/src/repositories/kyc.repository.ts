import prisma from '../db/prisma.js';

export type KYCStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface SubmitKYCDTO {
  userId: string;
  licenseNumber: string;
  licenseExpiry: Date;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  selfieUrl?: string;
}

export interface ReviewKYCDTO {
  status: KYCStatus;
  rejectionReason?: string;
}

export class KYCRepository {
  async findByUserId(userId: string) {
    return prisma.driverKyc.findUnique({
      where: { userId },
      include: { user: true }
    });
  }

  async submit(data: SubmitKYCDTO) {
    return prisma.$transaction(async (tx) => {
      const kyc = await tx.driverKyc.upsert({
        where: { userId: data.userId },
        update: {
          licenseNumber: data.licenseNumber,
          licenseExpiry: data.licenseExpiry,
          idCardFrontUrl: data.idCardFrontUrl,
          idCardBackUrl: data.idCardBackUrl,
          selfieUrl: data.selfieUrl,
          status: 'PENDING',
          rejectionReason: null,
          updatedAt: new Date()
        },
        create: {
          userId: data.userId,
          licenseNumber: data.licenseNumber,
          licenseExpiry: data.licenseExpiry,
          idCardFrontUrl: data.idCardFrontUrl,
          idCardBackUrl: data.idCardBackUrl,
          selfieUrl: data.selfieUrl,
          status: 'PENDING'
        }
      });

      await tx.user.update({
        where: { id: data.userId },
        data: { kycStatus: 'PENDING' }
      });

      return kyc;
    });
  }

  async review(userId: string, data: ReviewKYCDTO) {
    return prisma.$transaction(async (tx) => {
      const kyc = await tx.driverKyc.update({
        where: { userId },
        data: {
          status: data.status,
          rejectionReason: data.status === 'REJECTED' ? data.rejectionReason : null,
          verifiedAt: data.status === 'VERIFIED' ? new Date() : null,
          updatedAt: new Date()
        }
      });

      await tx.user.update({
        where: { id: userId },
        data: { kycStatus: data.status }
      });

      return kyc;
    });
  }

  async findAllPending() {
    return prisma.driverKyc.findMany({
      where: { status: 'PENDING' },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const kycRepository = new KYCRepository();

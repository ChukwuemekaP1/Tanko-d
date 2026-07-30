import prisma from '../db/prisma.js';
import bcrypt from 'bcryptjs';

export interface RegisterDTO {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: 'MANAGER' | 'DRIVER';
  documentId: string;
}

export class AuthService {
  async register(data: RegisterDTO) {
    const { name, email, password, phone, role, documentId } = data;

    // Check if user already exists with email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists.');
    }

    // Check if document ID already used for this role
    if (role === 'MANAGER') {
      const existingDoc = await prisma.managerProfile.findUnique({
        where: { documentId },
      });
      if (existingDoc) {
        throw new Error('Manager document ID already registered.');
      }
    } else if (role === 'DRIVER') {
      const existingDoc = await prisma.driverProfile.findUnique({
        where: { documentId },
      });
      if (existingDoc) {
        throw new Error('Driver document ID already registered.');
      }
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    // Transaction to ensure atomicity
    return prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          phone,
          role,
        },
      });

      // 2. Role-specific creation
      if (role === 'MANAGER') {
        await tx.managerProfile.create({
          data: {
            userId: user.id,
            documentId,
          },
        });

        // Initialize Monedero (FuelWallet)
        await tx.fuelWallet.create({
          data: {
            userId: user.id,
            balance: 0.00,
          },
        });
      } else if (role === 'DRIVER') {
        await tx.driverProfile.create({
          data: {
            userId: user.id,
            documentId,
          },
        });
      }

      return user;
    });
  }
}

export const authService = new AuthService();

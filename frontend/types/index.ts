// Tipos para NextAuth
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'ADMIN' | 'CONDUCTOR'
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'CONDUCTOR'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'ADMIN' | 'CONDUCTOR'
  }
}

// Tipos para Stellar
export interface StellarWalletInfo {
  publicKey: string
  secretKey?: string
  isConnected: boolean
}

export interface StellarBalance {
  asset: string
  balance: string
}

// Tipos para Trustless Work
export interface EscrowConfig {
  title: string
  description: string
  engagementId: string
  amount: string
  assetCode: string
  assetIssuer: string
  roles: {
    serviceProvider: string
    approver: string
    receiver: string
    releaseSigner: string
    disputeResolver: string
  }
  platformFee?: number
}

export interface Peticion {
  id: string
  conductorId: string
  empresaId: string
  montoSolicitado: number
  montoAprobado?: number
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'FIRMADA' | 'COMPLETADA' | 'FALLIDA'
  tipoCombustible: string
  litros?: number
  precioLitro?: number
  ubicacionId?: string
  motivo?: string
  engagementId?: string
  milestoneIndex?: number
  txHash?: string
  createdAt: Date
  approvedAt?: Date
  rejectedAt?: Date
  completedAt?: Date
  conductor?: {
    id: string
    stellarPublicKey: string
    limiteCredito: number
    usuario?: {
      id: string
      nombre: string
      email: string
      stellarAddress?: string
    }
  }
  ubicacion?: {
    id: string
    nombre: string
    direccion: string
  }
}

export interface Transaccion {
  id: string
  empresaId: string
  peticionId?: string
  tipo: 'DEPOSITO' | 'RELEASE' | 'FEE'
  monto: number
  txHash?: string
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'FALLIDA'
  feeMonto?: number
  createdAt: Date
  confirmedAt?: Date
}

// Tipos para exportación
export interface ExportData {
  transacciones: Transaccion[]
  peticiones: Peticion[]
  conductores: any[]
}

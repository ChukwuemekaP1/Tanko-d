import { describe, it, expect } from 'vitest'
import { 
  exportTransactions, 
  exportRequests, 
  exportDrivers,
  generateFilename,
  TransactionExport,
  RequestExport,
  DriverExport
} from '@/lib/excel/export'

describe('Excel Export Service', () => {
  describe('generateFilename', () => {
    it('should generate filename with timestamp', () => {
      const filename = generateFilename('test')
      
      expect(filename).toMatch(/^test_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.xlsx$/)
    })

    it('should generate filename with custom extension', () => {
      const filename = generateFilename('test', 'csv')
      
      expect(filename).toMatch(/\.csv$/)
    })
  })

  describe('exportTransactions', () => {
    it('should generate a buffer for transactions', () => {
      const data: TransactionExport[] = [
        {
          id: 'tx-1',
          date: '2024-03-20T10:00:00Z',
          type: 'RELEASE',
          amount: 4500,
          fee: 13.50,
          status: 'CONFIRMADA',
          txHash: 'abc123',
          driver: 'Juan Pérez',
        },
      ]

      const buffer = exportTransactions(data, {
        filename: 'test_transactions',
        sheetName: 'Transactions',
      })

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })

    it('should handle empty data', () => {
      const buffer = exportTransactions([], {
        filename: 'test_empty',
        sheetName: 'Transactions',
      })

      expect(buffer).toBeInstanceOf(Buffer)
    })
  })

  describe('exportRequests', () => {
    it('should generate a buffer for requests', () => {
      const data: RequestExport[] = [
        {
          id: 'pet-1',
          requestDate: '2024-03-20T10:00:00Z',
          driver: 'Juan Pérez',
          fuelType: 'diesel',
          liters: 180,
          requestedAmount: 4500,
          approvedAmount: 4500,
          status: 'APROBADA',
          location: 'Gasolinera Central',
          reason: 'Carga de rutina',
        },
      ]

      const buffer = exportRequests(data, {
        filename: 'test_requests',
        sheetName: 'Requests',
      })

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })
  })

  describe('exportDrivers', () => {
    it('should generate a buffer for drivers', () => {
      const data: DriverExport[] = [
        {
          id: 'cond-1',
          name: 'Juan Pérez',
          email: 'juan@test.com',
          stellarWallet: 'GA2X...',
          creditLimit: 5000,
          totalRequests: 10,
          pendingRequests: 2,
          approvedRequests: 8,
          rejectedRequests: 0,
        },
      ]

      const buffer = exportDrivers(data, {
        filename: 'test_drivers',
        sheetName: 'Drivers',
      })

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })
  })
})

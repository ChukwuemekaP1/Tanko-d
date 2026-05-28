import { Server } from '@stellar/stellar-sdk/rpc';
import { config } from '../config/index.js';
import { prisma } from '../db/prisma.js';
import { FundRequest, EscrowMilestone, ProcessedEvent } from '../generated/prisma/client.js';

// Define event types for type safety
export type SorobanEventType = 
  | 'escrow_created' 
  | 'funds_locked' 
  | 'escrow_settled';

interface ParsedSorobanEvent {
  eventId: string;
  ledgerSequence: number;
  eventType: SorobanEventType;
  payload: Record<string, any>;
  contractId: string;
}

/**
 * Soroban Event Indexer Service
 * Listens to Soroban events and synchronizes state to PostgreSQL
 */
export class SorobanIndexerService {
  private sorobanServer: Server;
  private readonly contractId: string;
  private readonly pollIntervalMs: number = 5000; // 5 seconds
  private isRunning: boolean = false;
  private lastProcessedLedger: number = 0;

  constructor() {
    // Initialize Soroban RPC client
    const rpcUrl = config.soroban?.rpcUrl || config.stellar.horizonUrl.replace('horizon', 'soroban');
    const networkPassphrase = config.soroban?.networkPassphrase || config.stellar.networkPassphrase;
    
    this.sorobanServer = new Server(rpcUrl, {
      allowHttp: true, // For testnet
      timeout: 30000,
    });
    
    this.contractId = config.soroban?.contractId || process.env.SOROBAN_CONTRACT_ID || '';
    
    if (!this.contractId) {
      throw new Error('SOROBAN_CONTRACT_ID environment variable is required for Soroban indexer');
    }
    
    console.info('[SorobanIndexerService] Initialized');
  }

  /**
   * Start the indexer service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('[SorobanIndexerService] Indexer already running');
      return;
    }
    
    this.isRunning = true;
    console.info('[SorobanIndexerService] Starting Soroban event indexer...');
    
    try {
      // Load last processed ledger from database
      await this.loadLastProcessedLedger();
      
      // Start polling loop
      this.pollEvents();
      
      console.info('[SorobanIndexerService] Soroban event indexer started successfully');
    } catch (error) {
      console.error('[SorobanIndexerService] Failed to start Soroban indexer', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the indexer service
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    console.info('[SorobanIndexerService] Soroban event indexer stopped');
  }

  /**
   * Load the last processed ledger sequence from database
   */
  private async loadLastProcessedLedger(): Promise<void> {
    try {
      const lastEvent = await prisma.processedEvent.findFirst({
        orderBy: { ledgerSequence: 'desc' },
        select: { ledgerSequence: true },
      });
      
      if (lastEvent) {
        this.lastProcessedLedger = lastEvent.ledgerSequence;
        console.info('[SorobanIndexerService] Resuming from ledger', this.lastProcessedLedger);
      } else {
        // Get latest ledger from Soroban to start from current
        const latestLedger = await this.sorobanServer.getLatestLedger();
        this.lastProcessedLedger = Math.max(1, latestLedger.sequence - 100); // Start from recent ledger
        console.info('[SorobanIndexerService] No previous events found, starting from ledger', this.lastProcessedLedger);
      }
    } catch (error) {
      console.error('[SorobanIndexerService] Failed to load last processed ledger', error);
      // Fallback to current ledger - 100
      try {
        const latestLedger = await this.sorobanServer.getLatestLedger();
        this.lastProcessedLedger = Math.max(1, latestLedger.sequence - 100);
      } catch (fallbackError) {
        console.error('[SorobanIndexerService] Failed to get latest ledger for fallback', fallbackError);
        this.lastProcessedLedger = 1;
      }
    }
  }

  /**
   * Main polling loop
   */
  private async pollEvents(): Promise<void> {
    if (!this.isRunning) return;
    
    try {
      // Get latest ledger to determine range
      const latestLedger = await this.sorobanServer.getLatestLedger();
      
      if (latestLedger.sequence <= this.lastProcessedLedger) {
        // No new ledgers, wait and retry
        setTimeout(() => this.pollEvents(), this.pollIntervalMs);
        return;
      }
      
      // Query events for the range [lastProcessedLedger + 1, latestLedger.sequence]
      const events = await this.sorobanServer.getEvents({
        filters: [
          {
            type: 'contract',
            contractIds: [this.contractId],
          }
        ],
        startLedger: this.lastProcessedLedger + 1,
        endLedger: latestLedger.sequence,
      });
      
      // Process events
      if (events.events.length > 0) {
        await this.processEvents(events.events);
        
        // Update last processed ledger
        this.lastProcessedLedger = latestLedger.sequence;
        console.info('[SorobanIndexerService] Processed', events.events.length, 'events up to ledger', latestLedger.sequence);
      } else {
        console.debug('[SorobanIndexerService] No events found in range [', this.lastProcessedLedger + 1, ', ', latestLedger.sequence, ']');
      }
      
    } catch (error) {
      console.error('[SorobanIndexerService] Error during event polling', error);
      
      // Exponential backoff on error (1s → 30s)
      const backoffMs = Math.min(30000, 1000 * Math.pow(2, this.pollIntervalMs / 1000));
      setTimeout(() => this.pollEvents(), backoffMs);
      return;
    }
    
    // Continue polling
    setTimeout(() => this.pollEvents(), this.pollIntervalMs);
  }

  /**
   * Process a batch of Soroban events
   */
  private async processEvents(events: any[]): Promise<void> {
    for (const event of events) {
      try {
        // Parse the event
        const parsedEvent = this.parseSorobanEvent(event);
        
        // Skip if we can't parse
        if (!parsedEvent) continue;
        
        // Check idempotency
        const existingEvent = await prisma.processedEvent.findUnique({
          where: { eventId: parsedEvent.eventId },
        });
        
        if (existingEvent) {
          console.debug('[SorobanIndexerService] Skipping duplicate event', parsedEvent.eventId);
          continue;
        }
        
        // Process the event based on type
        await this.handleEvent(parsedEvent);
        
        // Mark as processed
        await prisma.processedEvent.create({
          data: {
            eventId: parsedEvent.eventId,
            ledgerSequence: parsedEvent.ledgerSequence,
            contractId: parsedEvent.contractId,
          },
        });
        
        console.info('[SorobanIndexerService] Processed', parsedEvent.eventType, 'event', parsedEvent.eventId, 'at ledger', parsedEvent.ledgerSequence);
        
      } catch (error) {
        console.error('[SorobanIndexerService] Failed to process event', event.id, error);
      }
    }
  }

  /**
   * Parse a Soroban event into our internal format
   */
  private parseSorobanEvent(event: any): ParsedSorobanEvent | null {
    try {
      // Extract eventId from event.id
      const eventId = event.id || '';
      
      // Extract ledger sequence
      const ledgerSequence = event.ledger || 0;
      
      // Extract contract ID
      const contractId = event.contractId || this.contractId;
      
      // Extract event type from topic[0] (first topic)
      let eventType: SorobanEventType | null = null;
      if (event.topic && event.topic.length > 0) {
        const topic0 = event.topic[0];
        if (typeof topic0 === 'string') {
          // Try to extract from topic string
          if (topic0.includes('escrow_created')) {
            eventType = 'escrow_created';
          } else if (topic0.includes('funds_locked')) {
            eventType = 'funds_locked';
          } else if (topic0.includes('escrow_settled')) {
            eventType = 'escrow_settled';
          }
        }
      }
      
      // If no event type detected, try to infer from contract ID or other sources
      if (!eventType) {
        // Default to escrow_created for now
        eventType = 'escrow_created';
      }
      
      // Parse payload data
      let payload: Record<string, any> = {};
      if (event.data) {
        try {
          // Base64 decode and parse JSON
          const decoded = Buffer.from(event.data, 'base64').toString('utf8');
          payload = JSON.parse(decoded);
        } catch (parseError) {
          console.warn('[SorobanIndexerService] Failed to parse event data for', eventId, ':', parseError instanceof Error ? parseError.message : String(parseError));
        }
      }
      
      return {
        eventId,
        ledgerSequence,
        eventType,
        payload,
        contractId,
      };
      
    } catch (error) {
      console.error('[SorobanIndexerService] Failed to parse Soroban event:', error);
      return null;
    }
  }

  /**
   * Handle a specific event type and update database state
   */
  private async handleEvent(event: ParsedSorobanEvent): Promise<void> {
    switch (event.eventType) {
      case 'escrow_created':
        await this.handleEscrowCreated(event);
        break;
      case 'funds_locked':
        await this.handleFundsLocked(event);
        break;
      case 'escrow_settled':
        await this.handleEscrowSettled(event);
        break;
      default:
        console.warn('[SorobanIndexerService] Unknown event type:', event.eventType);
        break;
    }
  }

  /**
   * Handle escrow_created event
   * → set request status = PENDING_FUNDS
   */
  private async handleEscrowCreated(event: ParsedSorobanEvent): Promise<void> {
    try {
      // Find fund request by contract ID
      const fundRequest = await prisma.fundRequest.findFirst({
        where: { contractId: event.contractId },
      });
      
      if (!fundRequest) {
        console.warn('[SorobanIndexerService] No fund request found for contract ID', event.contractId);
        return;
      }
      
      // Validate transition: only allow from PENDING to PENDING_FUNDS
      if (fundRequest.status !== 'PENDING') {
        console.warn('[SorobanIndexerService] Drift detected: escrow_created event for fund request', fundRequest.id, 'with status', fundRequest.status, '. Expected PENDING.');
        return;
      }
      
      // Update status
      await prisma.fundRequest.update({
        where: { id: fundRequest.id },
        data: { status: 'PENDING_FUNDS' },
      });
      
      console.info('[SorobanIndexerService] Updated fund request', fundRequest.id, 'to PENDING_FUNDS');
      
    } catch (error) {
      console.error('[SorobanIndexerService] Failed to handle escrow_created event', error);
      throw error;
    }
  }

  /**
   * Handle funds_locked event
   * → set request status = ACTIVE_ESCROW
   */
  private async handleFundsLocked(event: ParsedSorobanEvent): Promise<void> {
    try {
      // Find fund request by contract ID
      const fundRequest = await prisma.fundRequest.findFirst({
        where: { contractId: event.contractId },
      });
      
      if (!fundRequest) {
        console.warn('[SorobanIndexerService] No fund request found for contract ID', event.contractId);
        return;
      }
      
      // Validate transition: only allow from PENDING_FUNDS to ACTIVE_ESCROW
      if (fundRequest.status !== 'PENDING_FUNDS') {
        console.warn('[SorobanIndexerService] Drift detected: funds_locked event for fund request', fundRequest.id, 'with status', fundRequest.status, '. Expected PENDING_FUNDS.');
        return;
      }
      
      // Update status
      await prisma.fundRequest.update({
        where: { id: fundRequest.id },
        data: { status: 'ACTIVE_ESCROW' },
      });
      
      console.info('[SorobanIndexerService] Updated fund request', fundRequest.id, 'to ACTIVE_ESCROW');
      
    } catch (error) {
      console.error('[SorobanIndexerService] Failed to handle funds_locked event', error);
      throw error;
    }
  }

  /**
   * Handle escrow_settled event
   * → set request status = DISPENSED
   * → archive escrow record
   * → log total distributed fuel volume
   */
  private async handleEscrowSettled(event: ParsedSorobanEvent): Promise<void> {
    try {
      // Find fund request by contract ID
      const fundRequest = await prisma.fundRequest.findFirst({
        where: { contractId: event.contractId },
      });
      
      if (!fundRequest) {
        console.warn('[SorobanIndexerService] No fund request found for contract ID', event.contractId);
        return;
      }
      
      // Validate transition: only allow from ACTIVE_ESCROW to DISPENSED
      if (fundRequest.status !== 'ACTIVE_ESCROW') {
        console.warn('[SorobanIndexerService] Drift detected: escrow_settled event for fund request', fundRequest.id, 'with status', fundRequest.status, '. Expected ACTIVE_ESCROW.');
        return;
      }
      
      // Update status and archive
      await prisma.$transaction(async (tx) => {
        // Update fund request
        await tx.fundRequest.update({
          where: { id: fundRequest.id },
          data: { status: 'DISPENSED' },
        });
        
        // Archive escrow milestone if exists
        await tx.escrowMilestone.updateMany({
          where: { contractId: event.contractId },
          data: { status: 'ARCHIVED' },
        });
        
        // Log distributed fuel volume (if available in payload)
        if (event.payload && typeof event.payload === 'object') {
          const liters = event.payload.liters || event.payload.amount || fundRequest.liters;
          console.info('[SorobanIndexerService] Distributed', liters, 'liters of fuel for fund request', fundRequest.id);
        }
      });
      
      console.info('[SorobanIndexerService] Updated fund request', fundRequest.id, 'to DISPENSED and archived milestones');
      
    } catch (error) {
      console.error('[SorobanIndexerService] Failed to handle escrow_settled event', error);
      throw error;
    }
  }
}

// Export singleton instance
export const sorobanIndexerService = new SorobanIndexerService();

// Auto-start on module load for development
if (process.env.NODE_ENV === 'development') {
  // Don't auto-start in dev to avoid conflicts with multiple instances
}

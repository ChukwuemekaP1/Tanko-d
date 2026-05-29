import { Request, Response } from 'express';
import { kycRepository, SubmitKYCDTO, ReviewKYCDTO } from '../repositories/kyc.repository.js';

export class KYCController {
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const kyc = await kycRepository.findByUserId(userId);
      
      res.status(200).json({ success: true, data: kyc });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch KYC status',
      });
    }
  }

  async submit(req: Request, res: Response): Promise<void> {
    try {
      const data: SubmitKYCDTO = req.body;
      const kyc = await kycRepository.submit(data);
      
      res.status(201).json({ success: true, data: kyc });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit KYC',
      });
    }
  }

  async review(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const data: ReviewKYCDTO = req.body;
      const kyc = await kycRepository.review(userId, data);
      
      res.status(200).json({ success: true, data: kyc });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to review KYC',
      });
    }
  }

  async getAllPending(req: Request, res: Response): Promise<void> {
    try {
      const kycs = await kycRepository.findAllPending();
      res.status(200).json({ success: true, data: kycs });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pending KYCs',
      });
    }
  }
}

export const kycController = new KYCController();

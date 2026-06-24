import { Request, Response } from 'express';
import { stationRepository, CreateStationDTO, UpdateStationDTO } from '../repositories/station.repository.js';

export class StationController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.active === 'true';
      const stations = activeOnly
        ? await stationRepository.findActive()
        : await stationRepository.findAll();
      res.json({ success: true, data: stations });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch stations' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const station = await stationRepository.findById(req.params.id);
      if (!station) { res.status(404).json({ success: false, error: 'Station not found' }); return; }
      res.json({ success: true, data: station });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch station' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const station = await stationRepository.create(req.body as CreateStationDTO);
      res.status(201).json({ success: true, data: station });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to create station' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const station = await stationRepository.update(req.params.id, req.body as UpdateStationDTO);
      res.json({ success: true, data: station });
    } catch (error: any) {
      if (error.code === 'P2025') { res.status(404).json({ success: false, error: 'Station not found' }); return; }
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to update station' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await stationRepository.delete(req.params.id);
      res.json({ success: true, message: 'Station deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') { res.status(404).json({ success: false, error: 'Station not found' }); return; }
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to delete station' });
    }
  }
}

export const stationController = new StationController();

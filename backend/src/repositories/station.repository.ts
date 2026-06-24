import prisma from '../db/prisma.js';

export interface CreateStationDTO {
  name: string;
  address: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  hours?: string;
  services?: string[];
  status?: string;
}

export interface UpdateStationDTO extends Partial<CreateStationDTO> {}

export class StationRepository {
  findAll() {
    return prisma.gasStation.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: string) {
    return prisma.gasStation.findUnique({ where: { id } });
  }

  findActive() {
    return prisma.gasStation.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } });
  }

  create(data: CreateStationDTO) {
    return prisma.gasStation.create({ data });
  }

  update(id: string, data: UpdateStationDTO) {
    return prisma.gasStation.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.gasStation.delete({ where: { id } });
  }
}

export const stationRepository = new StationRepository();

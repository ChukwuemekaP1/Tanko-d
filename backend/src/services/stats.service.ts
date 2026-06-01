import { fuelLogRepository } from "../repositories/fuelLog.repository.js";
import { fundRequestRepository } from "../repositories/fundRequest.repository.js";

type DateArg = Date | number | undefined;

export interface DashboardStats {
  totalFuelSpend: number;
  totalFuelLiters: number;
  totalRequests: number;
  pendingRequests: number;
  totalReleased: number;
  consumptionByDriver: Array<{ driverPubKey: string; totalSpend: number; totalLiters: number; count: number }>;
  spendByDriver: Array<{ driverPubKey: string; totalSpend: number }>;
  litersByDriver: Array<{ driverPubKey: string; totalLiters: number }>;
}

export interface StatsSummary {
  totalLiters: number;
  totalCost: number;
  approvedRequests: number;
  consumptionByUnit: Array<{
    name: string;
    value: number;
  }>;
}

function normalizeDateArgs(startOrLimit?: DateArg, endDate?: Date, limit = 50) {
  if (typeof startOrLimit === "number") {
    return {
      startDate: undefined as Date | undefined,
      endDate: undefined as Date | undefined,
      limit: startOrLimit,
    };
  }

  return {
    startDate: startOrLimit instanceof Date ? startOrLimit : undefined,
    endDate,
    limit,
  };
}

export class StatsService {
  async getDashboardStats(startDate?: Date, endDate?: Date): Promise<DashboardStats> {
    const [
      totalFuelSpend,
      totalFuelLiters,
      totalRequests,
      pendingRequests,
      totalReleased,
      consumptionByDriver,
      spendByDriver,
      litersByDriver,
    ] = await Promise.all([
      fuelLogRepository.getTotalSpend(startDate, endDate),
      fuelLogRepository.getTotalLiters(startDate, endDate),
      fundRequestRepository.count(startDate, endDate),
      fundRequestRepository.countPending(startDate, endDate),
      fundRequestRepository.getTotalReleased(startDate, endDate),
      fuelLogRepository.getConsumptionByDriver(startDate, endDate),
      fuelLogRepository.getTotalSpendByDriver(startDate, endDate),
      fuelLogRepository.getTotalLitersByDriver(startDate, endDate),
    ]);

    return {
      totalFuelSpend: totalFuelSpend || 0,
      totalFuelLiters: totalFuelLiters || 0,
      totalRequests: totalRequests || 0,
      pendingRequests: pendingRequests || 0,
      totalReleased: totalReleased || 0,
      consumptionByDriver: consumptionByDriver || [],
      spendByDriver: spendByDriver || [],
      litersByDriver: litersByDriver || [],
    };
  }

  async getConsumptionByDriver(startDate?: Date, endDate?: Date) {
    return fuelLogRepository.getConsumptionByDriver(startDate, endDate);
  }

  async getRecentTransactions(
    startOrLimit?: DateArg,
    endDate?: Date,
    limit = 50,
  ) {
    const normalized = normalizeDateArgs(startOrLimit, endDate, limit);
    const transactions = await fuelLogRepository.findAll(
      normalized.startDate,
      normalized.endDate,
    );

    return transactions.slice(0, normalized.limit);
  }

  async getReportStats(startDate?: Date, endDate?: Date) {
    const [
      summary,
      consumptionByDriver,
      recentTransactions,
      fuelSpendByDriver,
      fuelLitersByDriver,
    ] = await Promise.all([
      this.getDashboardStats(startDate, endDate),
      this.getConsumptionByDriver(startDate, endDate),
      fuelLogRepository.findAll(startDate, endDate),
      fuelLogRepository.getTotalSpendByDriver(startDate, endDate),
      fuelLogRepository.getTotalLitersByDriver(startDate, endDate),
    ]);

    return {
      ...summary,
      summary,
      dashboardStats: summary,
      stats: summary,
      consumptionByDriver,
      driverBreakdown: consumptionByDriver,
      recentTransactions,
      transactions: recentTransactions,
      fuelSpendByDriver,
      fuelLitersByDriver,
    };
  }

  async getStatsSummary(): Promise<StatsSummary> {
    const [
      totalLitersResult,
      totalCostResult,
      approvedRequestsCount,
      consumptionByUnit,
    ] = await Promise.all([
      fuelLogRepository.getTotalLiters(),
      fuelLogRepository.getTotalSpend(),
      fundRequestRepository.countByStatus("APPROVED"),
      fuelLogRepository.getConsumptionByUnit(),
    ]);

    return {
      totalLiters: totalLitersResult || 0,
      totalCost: totalCostResult || 0,
      approvedRequests: approvedRequestsCount || 0,
      consumptionByUnit: consumptionByUnit.map((unit) => ({
        name: unit.name,
        value: unit.liters,
      })),
    };
  }
}

export const statsService = new StatsService();
export default StatsService;

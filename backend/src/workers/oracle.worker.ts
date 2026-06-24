import { config } from '../config/index.js';
import { oracleService } from '../services/oracle.service.js';

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function startOracleWorker(): void {
  if (!config.oracle.workerEnabled) {
    console.info('[OracleWorker] Disabled (ORACLE_WORKER_ENABLED=false)');
    return;
  }

  const intervalMs = config.oracle.workerIntervalMs;

  const run = async () => {
    try {
      const updated = await oracleService.refreshPrices();
      console.info('[OracleWorker] Prices refreshed', {
        count: updated.length,
        fuels: updated.map((p) => p.fuel_type),
      });
    } catch (error) {
      console.error('[OracleWorker] Refresh failed', error);
    }
  };

  void run();
  intervalHandle = setInterval(() => void run(), intervalMs);
  console.info(`[OracleWorker] Started (interval ${intervalMs}ms)`);
}

export function stopOracleWorker(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

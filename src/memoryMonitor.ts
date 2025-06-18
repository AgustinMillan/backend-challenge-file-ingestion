import { logger } from "./logger";
import { appState } from "./state";

interface MemoryStats {
  maxRss: number;
  maxHeapUsed: number;
  maxExternal: number;
  lastCheck: Date;
  peakTime: Date;
}

let memoryStats: MemoryStats = {
  maxRss: 0,
  maxHeapUsed: 0,
  maxExternal: 0,
  lastCheck: new Date(),
  peakTime: new Date(),
};

export function bytesToMB(bytes: number, decimals = 2): number {
  return parseFloat((bytes / (1024 * 1024)).toFixed(decimals));
}

export function startMemoryMonitoring(intervalMs = 3000): void {
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const currentRss = bytesToMB(memoryUsage.rss);
    const currentHeapUsed = bytesToMB(memoryUsage.heapUsed);
    const currentExternal = bytesToMB(memoryUsage.external);
    const now = new Date();

    if (currentRss > memoryStats.maxRss) {
      memoryStats.maxRss = currentRss;
      memoryStats.peakTime = now;
    }
    if (currentHeapUsed > memoryStats.maxHeapUsed) {
      memoryStats.maxHeapUsed = currentHeapUsed;
    }
    if (currentExternal > memoryStats.maxExternal) {
      memoryStats.maxExternal = currentExternal;
    }

    memoryStats.lastCheck = now;

    if (now.getSeconds() % 3 === 0 && appState.isProcessing === true) {
      logger.info(
        `Memory snapshot: ${JSON.stringify({
          current: memoryUsage,
          peaks: {
            rss: bytesToMB(memoryStats.maxRss),
            heapUsed: bytesToMB(memoryStats.maxHeapUsed),
            external: bytesToMB(memoryStats.maxExternal),
            at: memoryStats.peakTime,
          },
        })}`
      );
    }
  }, intervalMs);
}

export function getMemoryStats(): MemoryStats & {
  current: Partial<NodeJS.MemoryUsage>;
} {
  const { rss, heapUsed, external } = process.memoryUsage();
  return {
    ...memoryStats,
    current: {
      rss: bytesToMB(rss),
      heapUsed: bytesToMB(heapUsed),
      external: bytesToMB(external),
    },
  };
}

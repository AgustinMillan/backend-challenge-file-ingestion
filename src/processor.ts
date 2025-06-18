import * as fs from "fs";
import * as readline from "readline";
import { memoryUsage } from "node:process";
import { parseLine } from "./parser";
import { insertClientes } from "./db";
import { logger } from "./logger";
import { appState } from "./state";

const BATCH_SIZE = 1000;
const MEMORY_THRESHOLD = 200 * 1024 * 1024; // 200MB

export async function processFile(filePath: string): Promise<ProcessResult> {
  let batch: any[] = [];
  let totalProcessed = 0;
  let totalErrors = 0;
  let isPaused = false;

  appState.isProcessing = true;
  appState.processingStartTime = new Date();
  appState.processingEndTime = null;
  appState.totalProcessingTime = null;

  // Configurar monitoreo de memoria
  const memoryMonitor = setInterval(() => {
    const { heapUsed } = memoryUsage();
    if (heapUsed > MEMORY_THRESHOLD && !isPaused) {
      isPaused = true;
      console.warn("[MEMORY] Pausando temporalmente el procesamiento");
    } else if (heapUsed < MEMORY_THRESHOLD * 0.8 && isPaused) {
      isPaused = false;
      console.info("[MEMORY] Reanudando procesamiento");
    }
  }, 5000);

  try {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const startTime = performance.now();

    for await (const line of rl) {
      // Pausa controlada por memoria
      while (isPaused) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const { cliente, error } = parseLine(line);

      if (cliente) {
        batch.push(cliente);

        if (batch.length >= BATCH_SIZE) {
          await insertClientes(batch);
          totalProcessed += batch.length;
          batch = [];
          logger.progress(`[PROGRESS] Insertados: ${totalProcessed}`);
        }
      } else {
        totalErrors++;
        logger.error(
          `[PARSE ERROR] ${error} | Linea: ${line.substring(0, 50)}...`
        );
      }
    }

    // Insertar el último lote incompleto
    if (batch.length > 0) {
      await insertClientes(batch);
      totalProcessed += batch.length;
    }

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    appState.processingEndTime = new Date();
    appState.totalProcessingTime =
      (appState.processingEndTime.getTime() -
        appState.processingStartTime.getTime()) /
      1000;
    appState.isProcessing = false;
    return {
      totalRecords: totalProcessed,
      errorCount: totalErrors,
      durationSeconds: duration,
    };
  } finally {
    clearInterval(memoryMonitor);
  }
}

interface ProcessResult {
  totalRecords: number;
  errorCount: number;
  durationSeconds: string;
}

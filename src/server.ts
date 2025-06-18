import express from "express";
import { validateDb } from "./db";
import { processFile } from "./processor";
import path from "path";
import { getMemoryStats, startMemoryMonitoring } from "./memoryMonitor";
import { appState } from "./state";

const app = express();

const filePath = path.join(
  __dirname,
  "..",
  "data-generator",
  "challenge",
  "input",
  "CLIENTES_IN_0425.dat"
);

export function bytesToMB(bytes: number, decimals = 2): number {
  return parseFloat((bytes / (1024 * 1024)).toFixed(decimals));
}

app.get("/health", async (_req, res) => {
  const memoryData = getMemoryStats();

  const healthCheck = {
    status: "OK",
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: {
      current: memoryData.current,
      peaks: {
        rss: memoryData.maxRss,
        heapUsed: memoryData.maxHeapUsed,
        external: memoryData.maxExternal,
        at: memoryData.peakTime,
      },
    },
    database: await validateDb(),
    processing: {
      active: appState.isProcessing,
      startTime: appState.processingStartTime,
      endTime: appState.processingEndTime,
      durationSeconds: appState.totalProcessingTime,
    },
  };

  res.json(healthCheck);
});

app.get("/process", async (_req, res): Promise<void> => {
  if (appState.isProcessing) {
    res.status(429).json({
      error: "Processing already in progress",
    });
    return;
  }

  processFile(filePath);
  res.status(200).json({
    message: "File processing started",
    filePath,
  });
  return;
});

app.get("/get-logs", (req, res) => {
  const logFilePath = path.join(__dirname, "..", "logs");

  res.sendFile(`${logFilePath}/${req.query.file}.log`, (err) => {
    if (err) {
      console.error("Error sending log file:", err);
      res.status(500).send("Error sending log file");
    } else {
      console.log("Log file sent successfully");
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servicio operativo en http://localhost:${PORT}/health`);
  startMemoryMonitoring();
});

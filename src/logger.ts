import fs from "fs";
import path from "path";
import { format } from "date-fns";

const LOGS_DIR = path.join(__dirname, "../logs");
const ERROR_LOG = path.join(LOGS_DIR, "error.log");
const PROCESS_LOG = path.join(LOGS_DIR, "process.log");

// Crear directorio si no existe
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const logToFile = (filePath: string, message: string): void => {
  const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss");
  const logMessage = `[${timestamp}] ${message}\n`;

  fs.appendFile(filePath, logMessage, (err) => {
    if (err) console.error("Error writing to log file:", err);
  });
};

export const logger = {
  error: (message: string) => {
    logToFile(ERROR_LOG, `${message}`);
  },
  progress: (message: string) => {
    logToFile(PROCESS_LOG, `[PROGRESS] ${message}`);
  },
  info: (message: string) => {
    logToFile(PROCESS_LOG, `[INFO] ${message}`);
  },
};

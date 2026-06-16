import winston from 'winston';
import Transport from 'winston-transport';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  [key: string]: unknown;
}

const logBuffer: LogEntry[] = [];
const MAX_LOGS = 50;

class MemoryTransport extends Transport {
  log(info: LogEntry, callback: () => void): void {
    const entry: LogEntry = {
      timestamp: (info.timestamp as string) || new Date().toISOString(),
      level:     info.level,
      message:   info.message,
      service:   (info.service as string) || process.env.SERVICE_NAME || 'unknown',
    };
    logBuffer.push(entry);
    if (logBuffer.length > MAX_LOGS) logBuffer.shift();
    callback();
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'unknown-service',
  },
  transports: [
    new winston.transports.Console(),
    new MemoryTransport(),
  ],
});

export function getLogBuffer(): LogEntry[] {
  return [...logBuffer].reverse();
}

export default logger;

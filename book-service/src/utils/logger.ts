// src/utils/logger.ts
import { createLogger, transports, format } from 'winston';
export const logger = createLogger({
  level: 'debug',
  format: format.combine(format.timestamp(), format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level}] ${message}`;
  })),
  transports: [new transports.Console()],
});

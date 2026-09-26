import type { Logger } from "pino";
import { pino } from "pino";

const REDACT_PATHS = [
  "authorization",
  "*.authorization",
  "headers.authorization",
  "req.headers.authorization",
  "apiKey",
  "*.apiKey",
  "password",
  "*.password",
  "GROQ_API_KEY",
  "GEMINI_API_KEY",
];

interface LoggerConfig {
  level: string;
  env: string;
}

export function createLogger(config: LoggerConfig): Logger {
  return pino({
    level: config.level,
    redact: { paths: REDACT_PATHS, censor: "[redacted]" },
    base: { env: config.env },
    transport: config.env === "local" ? { target: "pino-pretty" } : undefined,
  });
}

export type { Logger };
export * from "./request-logger";

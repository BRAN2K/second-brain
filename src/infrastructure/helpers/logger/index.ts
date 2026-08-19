import { type Logger, pino } from "pino";
import type { Config } from "@/infrastructure/helpers/config";

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

export function createLogger(config: Config): Logger {
  return pino({
    level: config.LOG_LEVEL,
    redact: { paths: REDACT_PATHS, censor: "[redacted]" },
    base: { env: config.APP_ENV },
    transport: config.APP_ENV === "local" ? { target: "pino-pretty" } : undefined,
  });
}

export * from "./request-logger";
export type { Logger };

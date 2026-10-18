import type { Logger as PinoLogger } from "pino";
import { trace } from "@opentelemetry/api";
import { pino } from "pino";

const DEFAULT_REDACT_PATHS = [
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

export interface LoggerConfig {
  level: string;
  env: string;
  service?: { name: string; version?: string };
  redactPaths?: string[];
}

export class Logger {
  private static instance: Logger;
  private readonly client: PinoLogger;

  private constructor(config: LoggerConfig) {
    this.client = pino({
      level: config.level,
      redact: { paths: config.redactPaths ?? DEFAULT_REDACT_PATHS, censor: "[redacted]" },
      base: {
        env: config.env,
        ...(config.service?.name ? { "service.name": config.service.name } : {}),
        ...(config.service?.version ? { "service.version": config.service.version } : {}),
      },
      mixin: Logger.traceContext,
      formatters: { level: Logger.severity },
      transport: config.env === "local" ? { target: "pino-pretty" } : undefined,
    });
  }

  static configure(config: LoggerConfig): Logger {
    Logger.instance = new Logger(config);
    return Logger.instance;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger({
        level: process.env.LOG_LEVEL ?? "info",
        env: process.env.APP_ENV ?? process.env.NODE_ENV ?? "local",
      });
    }

    return Logger.instance;
  }

  fatal(obj: unknown, msg?: string): void {
    this.client.fatal(obj, msg);
  }

  error(obj: unknown, msg?: string): void {
    this.client.error(obj, msg);
  }

  warn(obj: unknown, msg?: string): void {
    this.client.warn(obj, msg);
  }

  info(obj: unknown, msg?: string): void {
    this.client.info(obj, msg);
  }

  debug(obj: unknown, msg?: string): void {
    this.client.debug(obj, msg);
  }

  trace(obj: unknown, msg?: string): void {
    this.client.trace(obj, msg);
  }

  private static severity(label: string, number: number): { level: number; severity_text: string } {
    return { level: number, severity_text: label.toUpperCase() };
  }

  private static traceContext(): Record<string, string> {
    const spanContext = trace.getActiveSpan()?.spanContext();
    if (!spanContext) {
      return {};
    }

    return {
      trace_id: spanContext.traceId,
      span_id: spanContext.spanId,
      trace_flags: `0${spanContext.traceFlags.toString(16)}`,
    };
  }
}

export const logger = {
  fatal: (obj: unknown, msg?: string): void => Logger.getInstance().fatal(obj, msg),
  error: (obj: unknown, msg?: string): void => Logger.getInstance().error(obj, msg),
  warn: (obj: unknown, msg?: string): void => Logger.getInstance().warn(obj, msg),
  info: (obj: unknown, msg?: string): void => Logger.getInstance().info(obj, msg),
  debug: (obj: unknown, msg?: string): void => Logger.getInstance().debug(obj, msg),
  trace: (obj: unknown, msg?: string): void => Logger.getInstance().trace(obj, msg),
};

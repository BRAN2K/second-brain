import { type Logger, pino } from "pino";
import type { Config } from "@/infrastructure/config";

export type { Logger };

/**
 * Structured JSON logger (pino). Logs go to stdout — shipping them to Loki is an infra
 * concern (promtail/Docker log driver in docker-compose.observability.yml), so the app
 * has no Loki coupling. Secrets are redacted defensively even though we control fields.
 */

const REDACT_PATHS = [
	"authorization",
	"*.authorization",
	"headers.authorization",
	"req.headers.authorization",
	"apiKey",
	"*.apiKey",
	"password",
	"*.password",
	"OPENAI_API_KEY",
	"GROQ_API_KEY",
	"GEMINI_API_KEY",
];

export function createLogger(config: Config): Logger {
	return pino({
		level: config.LOG_LEVEL,
		redact: { paths: REDACT_PATHS, censor: "[redacted]" },
		base: { env: config.APP_ENV },
	});
}

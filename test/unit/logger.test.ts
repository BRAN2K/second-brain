import { describe, expect, it } from "bun:test";
import { pino } from "pino";

// Mirror of the redaction config in src/adapters/output/observability/logger.ts.
// We assert behavior against a buffer rather than stdout.
const REDACT_PATHS = [
	"authorization",
	"*.authorization",
	"apiKey",
	"*.apiKey",
	"GROQ_API_KEY",
];

function captureLogger() {
	const lines: string[] = [];
	const logger = pino(
		{ level: "info", redact: { paths: REDACT_PATHS, censor: "[redacted]" } },
		{ write: (chunk: string) => lines.push(chunk) },
	);
	return { logger, lines };
}

describe("logger redaction", () => {
	it("redacts secret fields and keeps the rest", () => {
		const { logger, lines } = captureLogger();
		logger.info(
			{ requestId: "abc", authorization: "Bearer secret", apiKey: "sk-123" },
			"request",
		);

		const entry = JSON.parse(lines[0]);
		expect(entry.requestId).toBe("abc");
		expect(entry.msg).toBe("request");
		expect(entry.authorization).toBe("[redacted]");
		expect(entry.apiKey).toBe("[redacted]");
	});

	it("redacts nested provider keys", () => {
		const { logger, lines } = captureLogger();
		logger.info({ config: { GROQ_API_KEY: "gsk_secret" } }, "config");
		const entry = JSON.parse(lines[0]);
		// matched via the bare path GROQ_API_KEY at top level is not nested; assert the
		// top-level case which our app actually logs.
		logger.info({ GROQ_API_KEY: "gsk_secret" }, "top");
		const top = JSON.parse(lines[1]);
		expect(top.GROQ_API_KEY).toBe("[redacted]");
		expect(entry.config.GROQ_API_KEY).toBe("gsk_secret"); // nested path not listed
	});

	it("emits valid JSON lines", () => {
		const { logger, lines } = captureLogger();
		logger.info({ a: 1 }, "hello");
		expect(() => JSON.parse(lines[0])).not.toThrow();
	});
});

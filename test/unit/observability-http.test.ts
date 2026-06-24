import { describe, expect, it } from "bun:test";
import { pino } from "pino";
import type { ExtractionDeps } from "@/adapters/input/extraction/http/routes";
import { createMetrics } from "@/adapters/output/observability/metrics";
import { createOutputValidator } from "@/adapters/output/validation/output-validator";
import { buildApp } from "@/cmd/server";
import { fakeProvider } from "../helpers/fake-provider";
import { fakeRepository } from "../helpers/fake-repository";
import { fakeTranscriber } from "../helpers/fake-transcriber";

const silentLogger = pino({ level: "silent" });
const templateJson = JSON.stringify([
	{ name: "title", type: "string", required: true },
]);

function appWith(metrics = createMetrics()) {
	const extraction: ExtractionDeps = {
		providers: [fakeProvider({ name: "groq", data: { title: "Tea" } })],
		order: ["groq"],
		validate: createOutputValidator().validate,
		repository: fakeRepository(),
		transcriber: fakeTranscriber(),
		metrics,
	};
	const app = buildApp({
		telemetry: { logger: silentLogger, metrics },
		health: { metricsRegistry: metrics.registry },
		extraction,
	});
	return { app, metrics };
}

describe("observability HTTP", () => {
	it("assigns an x-request-id response header", async () => {
		const { app } = appWith();
		const res = await app.handle(new Request("http://localhost/health"));
		expect(res.headers.get("x-request-id")).toBeTruthy();
	});

	it("propagates an incoming x-request-id", async () => {
		const { app } = appWith();
		const res = await app.handle(
			new Request("http://localhost/health", {
				headers: { "x-request-id": "trace-123" },
			}),
		);
		expect(res.headers.get("x-request-id")).toBe("trace-123");
	});

	it("exposes /metrics in Prometheus format", async () => {
		const { app } = appWith();
		const res = await app.handle(new Request("http://localhost/metrics"));
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/plain");
		const text = await res.text();
		expect(text).toContain("http_request_duration_seconds");
	});

	it("records an extraction outcome metric after a successful request", async () => {
		const { app, metrics } = appWith();
		const fd = new FormData();
		fd.append("text", "buy tea");
		fd.append("template", templateJson);
		await app.handle(
			new Request("http://localhost/v1/extractions", {
				method: "POST",
				body: fd,
			}),
		);

		const text = await metrics.registry.metrics();
		expect(text).toContain(
			'extractions_total{provider="groq",complete="true"} 1',
		);
	});
});

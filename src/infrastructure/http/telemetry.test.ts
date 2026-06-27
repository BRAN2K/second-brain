import { describe, expect, it } from "bun:test";
import { fakeProvider } from "@test/helpers/fake-provider";
import { fakeRepository } from "@test/helpers/fake-repository";
import { fakeTranscriber } from "@test/helpers/fake-transcriber";
import { pino } from "pino";
import type { ExtractionDeps } from "@/adapters/input/extraction/http/routes";
import { createOutputValidator } from "@/adapters/output/validation/output-validator";
import { buildApp } from "@/infrastructure/container/server";
import { createMetrics } from "@/infrastructure/metrics";

const silentLogger = pino({ level: "silent" });
const templateJson = JSON.stringify([
	{ name: "title", type: "string", required: true },
]);

function appWith(
	metrics = createMetrics(),
	providers = [fakeProvider({ name: "groq", data: { title: "Tea" } })],
) {
	const extraction: ExtractionDeps = {
		providers,
		order: providers.map((p) => p.name),
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

	it("increments the HTTP duration histogram for the matched route", async () => {
		// Guards the telemetry wiring end-to-end. The HTTP metric is recorded in
		// Elysia's onAfterResponse hook, which only fires for a real network response
		// (not app.handle), so we bind an ephemeral port and issue a real fetch.
		const { app, metrics } = appWith();
		const server = app.listen(0);
		try {
			const port = server.server?.port;
			await fetch(`http://localhost:${port}/health`);
			// onAfterResponse runs just after the body is flushed; let it settle.
			await new Promise((resolve) => setTimeout(resolve, 50));

			const text = await metrics.registry.metrics();
			expect(text).toContain(
				'http_request_duration_seconds_count{method="GET",route="/health",status="200"} 1',
			);
		} finally {
			server.stop();
		}
	});

	it("records an error metric when an extraction fails with 5xx", async () => {
		const { app, metrics } = appWith(createMetrics(), [
			fakeProvider({ name: "groq", outcomes: ["permanent"] }),
		]);
		const fd = new FormData();
		fd.append("text", "buy tea");
		fd.append("template", templateJson);
		const res = await app.handle(
			new Request("http://localhost/v1/extractions", {
				method: "POST",
				body: fd,
			}),
		);

		expect(res.status).toBeGreaterThanOrEqual(500);
		const text = await metrics.registry.metrics();
		expect(text).toContain('extraction_errors_total{reason="ProviderError"} 1');
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

import { describe, expect, it } from "bun:test";
import { createMetrics } from "@/infrastructure/metrics";

describe("createMetrics", () => {
  it("records HTTP duration with method/route/status labels", async () => {
    const metrics = createMetrics();
    metrics.recordHttp("POST", "/v1/extractions", 200, 123);

    const text = await metrics.registry.metrics();
    expect(text).toContain("http_request_duration_seconds");
    expect(text).toContain('route="/v1/extractions"');
    expect(text).toContain('status="200"');
  });

  it("counts extractions and tokens", async () => {
    const metrics = createMetrics();
    metrics.recordExtraction({
      provider: "groq",
      complete: true,
      inputTokens: 10,
      outputTokens: 4,
    });

    const text = await metrics.registry.metrics();
    expect(text).toContain(
      'extractions_total{provider="groq",complete="true"} 1',
    );
    expect(text).toContain(
      'extraction_tokens_total{provider="groq",type="input"} 10',
    );
    expect(text).toContain(
      'extraction_tokens_total{provider="groq",type="output"} 4',
    );
  });

  it("counts errors by reason", async () => {
    const metrics = createMetrics();
    metrics.recordError("ProviderError");
    const text = await metrics.registry.metrics();
    expect(text).toContain('extraction_errors_total{reason="ProviderError"} 1');
  });

  it("includes default process metrics", async () => {
    const metrics = createMetrics();
    const text = await metrics.registry.metrics();
    expect(text).toContain("process_cpu_user_seconds_total");
  });
});

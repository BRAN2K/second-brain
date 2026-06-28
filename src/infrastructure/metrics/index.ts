import {
  Counter,
  collectDefaultMetrics,
  Histogram,
  Registry,
} from "prom-client";

/**
 * Prometheus metrics (prom-client) exposed at `/metrics` and scraped by Prometheus
 * (see docker-compose.observability.yml). HTTP timing is recorded by the telemetry
 * plugin; extraction outcomes are recorded by the extraction route, keeping the domain
 * free of metrics concerns.
 */
export interface ExtractionOutcome {
  provider: string;
  complete: boolean;
  inputTokens?: number;
  outputTokens?: number;
}

export interface Metrics {
  readonly registry: Registry;
  recordHttp(
    method: string,
    route: string,
    status: number,
    durationMs: number,
  ): void;
  recordExtraction(outcome: ExtractionOutcome): void;
  recordError(reason: string): void;
}

export function createMetrics(): Metrics {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });

  const httpDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status"],
    buckets: [0.005, 0.025, 0.1, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
  });

  const extractions = new Counter({
    name: "extractions_total",
    help: "Completed extractions by provider and completeness",
    labelNames: ["provider", "complete"],
    registers: [registry],
  });

  const tokens = new Counter({
    name: "extraction_tokens_total",
    help: "LLM tokens consumed by provider and direction",
    labelNames: ["provider", "type"],
    registers: [registry],
  });

  const errors = new Counter({
    name: "extraction_errors_total",
    help: "Failed extraction requests by reason",
    labelNames: ["reason"],
    registers: [registry],
  });

  return {
    registry,
    recordHttp(method, route, status, durationMs) {
      httpDuration
        .labels(method, route, String(status))
        .observe(durationMs / 1000);
    },
    recordExtraction(outcome) {
      extractions.labels(outcome.provider, String(outcome.complete)).inc();
      if (outcome.inputTokens) {
        tokens.labels(outcome.provider, "input").inc(outcome.inputTokens);
      }
      if (outcome.outputTokens) {
        tokens.labels(outcome.provider, "output").inc(outcome.outputTokens);
      }
    },
    recordError(reason) {
      errors.labels(reason).inc();
    },
  };
}

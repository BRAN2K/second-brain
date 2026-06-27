import { Elysia } from "elysia";
import type { Logger } from "@/infrastructure/logger";
import type { Metrics } from "@/infrastructure/metrics";

/**
 * Cross-cutting HTTP telemetry: assigns/propagates an `x-request-id`, logs each request
 * (structured JSON via pino), and records HTTP duration metrics. Kept as an input-layer
 * plugin so the domain and use-cases stay free of logging/metrics concerns. Route is the
 * matched pattern (e.g. `/v1/extractions/:id`) to keep metric label cardinality bounded.
 */
export interface TelemetryDeps {
  logger: Logger;
  metrics: Metrics;
}

export function telemetry({ logger, metrics }: TelemetryDeps) {
  return new Elysia({ name: "telemetry" })
    .derive({ as: "global" }, ({ request, set }) => {
      const requestId =
        request.headers.get("x-request-id") ?? crypto.randomUUID();
      set.headers["x-request-id"] = requestId;
      return { requestId, startTime: performance.now() };
    })
    .onAfterResponse({ as: "global" }, (ctx) => {
      const { request, set, requestId, startTime, route } =
        ctx as typeof ctx & {
          requestId: string;
          startTime: number;
          route?: string;
        };
      const durationMs = performance.now() - startTime;
      const status = typeof set.status === "number" ? set.status : 200;
      const path = route ?? new URL(request.url).pathname;

      metrics.recordHttp(request.method, path, status, durationMs);
      logger.info(
        {
          requestId,
          method: request.method,
          route: path,
          status,
          durationMs: Math.round(durationMs),
        },
        "request",
      );
    })
    .onError({ as: "global" }, (ctx) => {
      const { request, error } = ctx;
      const requestId = (ctx as typeof ctx & { requestId?: string }).requestId;
      logger.error(
        {
          requestId,
          method: request.method,
          err:
            error instanceof Error
              ? { name: error.name, message: error.message }
              : error,
        },
        "request error",
      );
    });
}

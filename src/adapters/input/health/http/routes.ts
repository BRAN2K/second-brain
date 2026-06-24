import { Elysia } from "elysia";
import type { Registry } from "prom-client";

export interface HealthDeps {
	/** Readiness probe (e.g. DB reachable). When omitted, readiness is assumed ok. */
	checkReady?: () => Promise<boolean>;
	/** Prometheus registry; when provided, exposes `/metrics`. */
	metricsRegistry?: Registry;
}

/**
 * Liveness/readiness/metrics endpoints (input adapter).
 * `/health` = process is up. `/ready` = able to serve traffic. The readiness probe is
 * injected by the composition root (Postgres reachable AND >= 1 available provider).
 * `/metrics` exposes Prometheus metrics when a registry is provided.
 */
export function healthRoutes(deps: HealthDeps = {}) {
	const app = new Elysia()
		.get("/health", () => ({ status: "ok" }))
		.get("/ready", async ({ set }) => {
			const ready = deps.checkReady ? await deps.checkReady() : true;
			if (!ready) {
				set.status = 503;
				return { status: "unavailable" };
			}
			return { status: "ready" };
		});

	if (deps.metricsRegistry) {
		const registry = deps.metricsRegistry;
		app.get("/metrics", async ({ set }) => {
			set.headers["content-type"] = registry.contentType;
			return await registry.metrics();
		});
	}

	return app;
}

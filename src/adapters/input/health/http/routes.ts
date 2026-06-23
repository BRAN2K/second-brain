import { Elysia } from "elysia";

export interface HealthDeps {
	/** Readiness probe (e.g. DB reachable). When omitted, readiness is assumed ok. */
	checkReady?: () => Promise<boolean>;
}

/**
 * Liveness/readiness endpoints (input adapter).
 * `/health` = process is up. `/ready` = able to serve traffic (Postgres reachable;
 * PR4+ will also require >= 1 available provider).
 */
export function healthRoutes(deps: HealthDeps = {}) {
	return new Elysia()
		.get("/health", () => ({ status: "ok" }))
		.get("/ready", async ({ set }) => {
			const ready = deps.checkReady ? await deps.checkReady() : true;
			if (!ready) {
				set.status = 503;
				return { status: "unavailable" };
			}
			return { status: "ready" };
		});
}

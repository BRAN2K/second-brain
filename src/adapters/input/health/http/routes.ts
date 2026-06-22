import { Elysia } from "elysia";

/**
 * Liveness/readiness endpoints (input adapter).
 * `/health` = process is up. `/ready` = able to serve traffic; PR1 extends it to
 * check Postgres reachability and PR4+ to require >= 1 available provider.
 */
export const healthRoutes = new Elysia()
	.get("/health", () => ({ status: "ok" }))
	.get("/ready", () => ({ status: "ready" }));

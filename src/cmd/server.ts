import { Elysia } from "elysia";
import { sql } from "kysely";
import {
	type HealthDeps,
	healthRoutes,
} from "@/adapters/input/health/http/routes";
import { loadConfig } from "@/config";
import { createContainer } from "./container";

export interface AppDeps {
	health?: HealthDeps;
}

/**
 * Composition root. `buildApp` wires input adapters onto an Elysia instance without
 * binding to a port — tests drive it via `app.handle(new Request(...))`.
 * `startServer` loads config (fail-fast), builds the container, and binds the port.
 */
export function buildApp(deps: AppDeps = {}) {
	return new Elysia().use(healthRoutes(deps.health ?? {}));
}

export function startServer() {
	const config = loadConfig();
	const container = createContainer(config);

	const app = buildApp({
		health: {
			checkReady: async () => {
				try {
					await sql`select 1`.execute(container.db);
					return true;
				} catch {
					return false;
				}
			},
		},
	}).listen(config.PORT);

	console.log(
		`[${config.APP_ENV}] listening on http://localhost:${config.PORT}`,
	);
	return app;
}

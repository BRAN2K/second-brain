import { Elysia } from "elysia";
import { sql } from "kysely";
import {
	type ExtractionDeps,
	extractionRoutes,
} from "@/adapters/input/extraction/http/routes";
import {
	type HealthDeps,
	healthRoutes,
} from "@/adapters/input/health/http/routes";
import { loadConfig } from "@/config";
import { createContainer } from "./container";

export interface AppDeps {
	health?: HealthDeps;
	extraction?: ExtractionDeps;
}

/**
 * Composition root. `buildApp` wires input adapters onto an Elysia instance without
 * binding to a port — tests drive it via `app.handle(new Request(...))`.
 * `startServer` loads config (fail-fast), builds the container, and binds the port.
 */
export function buildApp(deps: AppDeps = {}) {
	const app = new Elysia().use(healthRoutes(deps.health ?? {}));
	if (deps.extraction) {
		app.use(extractionRoutes(deps.extraction));
	}
	return app;
}

export function startServer() {
	const config = loadConfig();
	const container = createContainer(config);

	const app = buildApp({
		health: {
			// Ready = Postgres reachable AND at least one provider configured.
			checkReady: async () => {
				if (container.providerRegistry.available().length === 0) {
					return false;
				}
				try {
					await sql`select 1`.execute(container.db);
					return true;
				} catch {
					return false;
				}
			},
		},
		extraction: {
			providers: container.providerRegistry.all(),
			order: container.providerRegistry.order,
			validate: container.outputValidator.validate,
			repository: container.extractionRepository,
		},
	}).listen(config.PORT);

	console.log(
		`[${config.APP_ENV}] listening on http://localhost:${config.PORT}`,
	);
	return app;
}

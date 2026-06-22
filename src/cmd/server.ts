import { Elysia } from "elysia";
import { healthRoutes } from "@/adapters/input/health/http/routes";
import { type Config, loadConfig } from "@/config";

/**
 * Composition root. `buildApp` wires the input adapters onto an Elysia instance
 * without binding to a port — tests drive it via `app.handle(new Request(...))`.
 * `startServer` loads config (fail-fast) and binds the port for real runs.
 */
export function buildApp(_config?: Config) {
	return new Elysia().use(healthRoutes);
}

export function startServer() {
	const config = loadConfig();
	const app = buildApp(config).listen(config.PORT);
	console.log(
		`[${config.APP_ENV}] listening on http://localhost:${config.PORT}`,
	);
	return app;
}

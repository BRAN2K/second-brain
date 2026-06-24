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
import { type TelemetryDeps, telemetry } from "@/adapters/input/http/telemetry";
import { loadConfig } from "@/config";
import { createContainer } from "./container";

export interface AppDeps {
  health?: HealthDeps;
  extraction?: ExtractionDeps;
  telemetry?: TelemetryDeps;
}

/**
 * Composition root. `buildApp` wires input adapters onto an Elysia instance without
 * binding to a port — tests drive it via `app.handle(new Request(...))`.
 * `startServer` loads config (fail-fast), builds the container, and binds the port.
 */
export function buildApp(deps: AppDeps = {}) {
  const app = new Elysia();
  if (deps.telemetry) {
    app.use(telemetry(deps.telemetry));
  }
  app.use(healthRoutes(deps.health ?? {}));
  if (deps.extraction) {
    app.use(extractionRoutes(deps.extraction));
  }
  return app;
}

export function startServer() {
  const config = loadConfig();
  const container = createContainer(config);

  const app = buildApp({
    telemetry: { logger: container.logger, metrics: container.metrics },
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
      metricsRegistry: container.metrics.registry,
    },
    extraction: {
      providers: container.providerRegistry.all(),
      order: container.providerRegistry.order,
      validate: container.outputValidator.validate,
      repository: container.extractionRepository,
      transcriber: container.transcriber,
      metrics: container.metrics,
    },
  }).listen(config.PORT);

  // `env` is already attached to every line via the logger's base fields.
  container.logger.info({ port: config.PORT }, "server listening");
  return app;
}

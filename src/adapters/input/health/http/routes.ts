import { Elysia } from "elysia";
import type { Registry } from "prom-client";

export interface HealthDeps {
  checkReady?: () => Promise<boolean>;
  metricsRegistry?: Registry;
}

// TODO: refactor this function later
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

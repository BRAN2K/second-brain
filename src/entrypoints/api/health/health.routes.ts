import type { Kysely } from "kysely";
import type { Database } from "@/adapters/output/repositories/database";
import { Elysia } from "elysia";
import { livenessRoute } from "./liveness/liveness.route";
import { readinessRoute } from "./readiness/readiness.route";

export function healthRoutes(db: Kysely<Database>) {
  const app = new Elysia();

  app.use(livenessRoute());
  app.use(readinessRoute(db));

  return app;
}

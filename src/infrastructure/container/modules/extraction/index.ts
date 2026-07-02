import { type AnyElysia, Elysia } from "elysia";
import type { Kysely } from "kysely";
import type { Database } from "@/adapters/output/database/postgres/types";
import type { Config } from "@/infrastructure/helpers/config";
import { createExtractionRoute } from "./create-extraction";

export interface SharedDeps {
  db: Kysely<Database>;
}

export type ExtractionRouteFactory = (
  config: Config,
  shared: SharedDeps,
) => AnyElysia;

/**
 * Every route of the extraction module. Adding a use case = create its factory
 * file next to this one and list it here; nothing else changes.
 */
const routes: ExtractionRouteFactory[] = [createExtractionRoute];

export function createExtractionModule(config: Config, shared: SharedDeps) {
  const app = new Elysia();
  for (const route of routes) {
    app.use(route(config, shared));
  }
  return app;
}

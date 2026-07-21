import { type AnyElysia, Elysia } from "elysia";
import type { Kysely } from "kysely";
import type { Database } from "@/adapters/output/database/postgres/types";
import type { Config } from "@/infrastructure/helpers/config";
import { createTemplateRoute } from "./create-template";

export interface SharedDeps {
  db: Kysely<Database>;
}

export type TemplateRouteFactory = (config: Config, shared: SharedDeps) => AnyElysia;

const routes: TemplateRouteFactory[] = [createTemplateRoute];

export function createTemplateModule(config: Config, shared: SharedDeps) {
  const app = new Elysia();
  for (const route of routes) {
    app.use(route(config, shared));
  }
  return app;
}

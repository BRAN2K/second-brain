import type { Kysely } from "kysely";
import type { Database } from "@/adapters/output/repositories/database";
import { Elysia } from "elysia";
import { createTemplateRoute } from "./create-template/create-template.route";
import { listTemplatesRoute } from "./list-templates/list-templates.route";

export function templateRoutes(db: Kysely<Database>) {
  const app = new Elysia();

  app.use(createTemplateRoute(db));
  app.use(listTemplatesRoute(db));

  return app;
}

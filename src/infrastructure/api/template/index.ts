import { Elysia } from "elysia";
import { env } from "@/infrastructure/env";
import { getDbConnection } from "@/libs/database/postgres/client";
import { createTemplateRoute } from "./create-template";
import { listTemplatesRoute } from "./list-templates";

export function templateRoutes() {
  const db = getDbConnection(env.DATABASE_URL);
  const app = new Elysia();

  app.use(createTemplateRoute(db));
  app.use(listTemplatesRoute(db));

  return app;
}

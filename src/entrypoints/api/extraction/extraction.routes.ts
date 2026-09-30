import type { Kysely } from "kysely";
import type { Database } from "@/adapters/output/repositories/database";
import { Elysia } from "elysia";
import { createExtractionRoute } from "./create-extraction/create-extraction.route";

export function extractionRoutes(db: Kysely<Database>) {
  const app = new Elysia();

  app.use(createExtractionRoute(db));

  return app;
}

import { Elysia } from "elysia";
import { env } from "@/infrastructure/env";
import { getDbConnection } from "@/libs/database/postgres/client";
import { createExtractionFactory } from "./create-extraction";

export const extractionRoutes = () => {
  const db = getDbConnection(env.DATABASE_URL);
  const app = new Elysia();

  app.use(createExtractionFactory(db));

  return app;
};

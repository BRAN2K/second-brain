import type { Kysely } from "kysely";
import type { CreateExtractionController } from "@/adapters/input/http/extraction/create-extraction/controller";
import type { Database } from "@/adapters/output/repositories/database";
import { Elysia } from "elysia";
import { CreateExtractionFactory } from "./create-extraction.factory";
import { createExtractionSchema } from "./create-extraction.schema";

export const createExtractionRoute = (db: Kysely<Database>) => {
  const createExtraction: CreateExtractionController = CreateExtractionFactory(db);

  return new Elysia().post(
    "/extractions",
    async ({ body, status }) => {
      const response = await createExtraction.execute(body);

      return status(response.status, response.body);
    },
    createExtractionSchema,
  );
};

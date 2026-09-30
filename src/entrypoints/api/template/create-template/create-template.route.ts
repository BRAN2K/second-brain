import type { Kysely } from "kysely";
import type { CreateTemplateController } from "@/adapters/input/http/template/create-template/controller";
import type { Database } from "@/adapters/output/repositories/database";
import { Elysia } from "elysia";
import { CreateTemplateFactory } from "./create-template.factory";
import { createTemplateSchema } from "./create-template.schema";

export const createTemplateRoute = (db: Kysely<Database>) => {
  const createTemplate: CreateTemplateController = CreateTemplateFactory(db);

  return new Elysia().post(
    "/templates",
    async ({ body, status }) => {
      const response = await createTemplate.execute(body);

      return status(response.status, response.body);
    },
    createTemplateSchema,
  );
};

import type { Kysely } from "kysely";
import type { ListTemplatesController } from "@/adapters/input/http/template/list-templates/controller";
import type { Database } from "@/adapters/output/repositories/database";
import { Elysia } from "elysia";
import { ListTemplatesFactory } from "./list-templates.factory";
import { listTemplatesSchema } from "./list-templates.schema";

export const listTemplatesRoute = (db: Kysely<Database>) => {
  const listTemplates: ListTemplatesController = ListTemplatesFactory(db);

  return new Elysia().get(
    "/templates",
    async ({ query, status }) => {
      const response = await listTemplates.execute(query);

      return status(response.status, response.body);
    },
    listTemplatesSchema,
  );
};

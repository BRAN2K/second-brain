import type { Kysely } from "kysely";
import type { Database } from "@/adapters/output/repositories/database";
import { ListTemplatesController } from "@/adapters/input/http/template/list-templates/controller";
import { PostgresTemplateRepository } from "@/adapters/output/repositories/template/template.repository";
import { ListTemplatesUseCase } from "@/application/use-cases/template/list-templates.use-case";

export const ListTemplatesFactory = (db: Kysely<Database>): ListTemplatesController =>
  new ListTemplatesController(new ListTemplatesUseCase(new PostgresTemplateRepository(db)));

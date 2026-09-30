import type { Kysely } from "kysely";
import type { Database } from "@/adapters/output/repositories/database";
import { CreateTemplateController } from "@/adapters/input/http/template/create-template/controller";
import { PostgresTemplateRepository } from "@/adapters/output/repositories/template/template.repository";
import { CreateTemplateUseCase } from "@/application/use-cases/template/create-template.use-case";

export const CreateTemplateFactory = (db: Kysely<Database>): CreateTemplateController =>
  new CreateTemplateController(new CreateTemplateUseCase(new PostgresTemplateRepository(db)));

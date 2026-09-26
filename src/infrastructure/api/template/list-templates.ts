import type { dbType } from "@/libs/database/postgres/client";
import { ListTemplatesController } from "@/adapters/input/template/http/list-templates/controller";
import { PostgresTemplateRepository } from "@/adapters/output/database/postgres/template/template.repository";
import { ListTemplatesUseCase } from "@/application/template/use-cases/list-templates.use-case";

export function listTemplatesRoute(dbConnection: dbType) {
  const templateRepository = new PostgresTemplateRepository(dbConnection);
  const listTemplatesUseCase = new ListTemplatesUseCase(templateRepository);
  const listTemplatesController = new ListTemplatesController(listTemplatesUseCase);

  return listTemplatesController.execute();
}

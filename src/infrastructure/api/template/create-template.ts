import type { dbType } from "@/libs/database/postgres/client";
import { CreateTemplateController } from "@/adapters/input/template/http/create-template/controller";
import { PostgresTemplateRepository } from "@/adapters/output/database/postgres/template/template.repository";
import { CreateTemplateUseCase } from "@/application/template/use-cases/create-template.use-case";

export function createTemplateRoute(dbConnection: dbType) {
  const templateRepository = new PostgresTemplateRepository(dbConnection);
  const createTemplateUseCase = new CreateTemplateUseCase(templateRepository);
  const createTemplateController = new CreateTemplateController(createTemplateUseCase);

  return createTemplateController.execute();
}

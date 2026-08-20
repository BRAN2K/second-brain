import type { Config } from "@/libs/config";
import type { SharedDeps } from "./index";
import { CreateTemplateController } from "@/adapters/input/template/http/create-template/controller";
import { PostgresTemplateRepository } from "@/adapters/output/database/postgres/template/template-repository";
import { CreateTemplateUseCase } from "@/application/template/use-cases/create-template";

export function createTemplateRoute(_config: Config, shared: SharedDeps) {
  const templateRepository = new PostgresTemplateRepository(shared.db);
  const createTemplateUseCase = new CreateTemplateUseCase(templateRepository);
  const createTemplateController = new CreateTemplateController(createTemplateUseCase);

  return createTemplateController.execute();
}

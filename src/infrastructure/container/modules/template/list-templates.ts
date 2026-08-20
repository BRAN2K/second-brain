import type { Config } from "@/libs/config";
import type { SharedDeps } from "./index";
import { ListTemplatesController } from "@/adapters/input/template/http/list-templates/controller";
import { PostgresTemplateRepository } from "@/adapters/output/database/postgres/template/template-repository";
import { ListTemplatesUseCase } from "@/application/template/use-cases/list-templates";

export function listTemplatesRoute(_config: Config, shared: SharedDeps) {
  const templateRepository = new PostgresTemplateRepository(shared.db);
  const listTemplatesUseCase = new ListTemplatesUseCase(templateRepository);
  const listTemplatesController = new ListTemplatesController(listTemplatesUseCase);

  return listTemplatesController.execute();
}

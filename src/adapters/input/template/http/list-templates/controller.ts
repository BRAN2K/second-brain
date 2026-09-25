import type { ListTemplatesUseCase } from "@/application/template/use-cases/list-templates.use-case";
import { Elysia } from "elysia";
import { toResponse } from "./mapper";
import { routeConfig } from "./route";

export class ListTemplatesController {
  constructor(private readonly listTemplatesUseCase: ListTemplatesUseCase) {}

  public execute() {
    return new Elysia().get(
      "/templates",
      async ({ query }) => {
        const page = await this.listTemplatesUseCase.execute({
          cursor: query.cursor,
          limit: query.limit,
        });

        return toResponse(page);
      },
      routeConfig,
    );
  }
}

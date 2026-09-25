import type { CreateTemplateUseCase } from "@/application/template/use-cases/create-template.use-case";
import { Elysia } from "elysia";
import { httpErrorSchemas } from "@/libs/errors";
import { toResponse } from "./mapper";
import { routeConfig } from "./route";
import { createTemplateSchemas } from "./schemas";

export class CreateTemplateController {
  constructor(private readonly createTemplateUseCase: CreateTemplateUseCase) {}

  public execute() {
    return new Elysia()
      .use(httpErrorSchemas)
      .use(createTemplateSchemas)
      .post(
        "/templates",
        async ({ body, status }) => {
          const template = await this.createTemplateUseCase.execute(body);

          return status(201, toResponse(template));
        },
        routeConfig,
      );
  }
}

import type { CreateTemplateUseCase } from "@/application/template/use-cases/create-template";
import { Elysia } from "elysia";
import { httpErrorSchemas } from "@/libs/errors";
import { toResponse } from "./mapper";
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
        {
          body: "template.create.request",
          response: {
            201: "template.create.response",
            400: "error",
            422: "error",
            500: "error",
          },
          detail: {
            summary: "Create a template",
            description: "Creates an extraction template with its field definitions.",
            tags: ["Templates"],
          },
        },
      );
  }
}

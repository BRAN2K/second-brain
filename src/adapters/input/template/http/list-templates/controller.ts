import { Elysia } from "elysia";
import type { ListTemplatesUseCase } from "@/application/template/use-cases/list-templates";
import { httpErrorSchemas } from "@/libs/errors";
import { toResponse } from "./mapper";
import { listTemplatesSchemas } from "./schemas";

export class ListTemplatesController {
  constructor(private readonly listTemplatesUseCase: ListTemplatesUseCase) {}

  public execute() {
    return new Elysia()
      .use(httpErrorSchemas)
      .use(listTemplatesSchemas)
      .get(
        "/templates",
        async ({ query }) => {
          const page = await this.listTemplatesUseCase.execute({
            cursor: query.cursor,
            limit: query.limit,
          });

          return toResponse(page);
        },
        {
          query: "template.list.request",
          response: {
            200: "template.list.response",
            400: "error",
            500: "error",
          },
          detail: {
            summary: "List templates",
            description: "Lists extraction templates with cursor-based pagination.",
            tags: ["Templates"],
          },
        },
      );
  }
}

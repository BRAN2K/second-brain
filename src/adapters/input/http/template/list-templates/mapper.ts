import type { ListTemplatesInput } from "@/application/use-cases/template/dtos/list-templates.dto";
import type { ListTemplatesRequest } from "./request";

export const ListTemplatesMapper = {
  toUseCase(query: ListTemplatesRequest): ListTemplatesInput {
    return {
      cursor: query.cursor,
      limit: query.limit,
    };
  },
};

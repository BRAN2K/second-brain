import { listTemplatesRequestSchema } from "@/adapters/input/http/template/list-templates/request";
import { listTemplatesResponseSchema } from "@/adapters/input/http/template/list-templates/response";
import { errorSchema } from "@/libs/errors";

export const listTemplatesSchema = {
  query: listTemplatesRequestSchema,
  response: {
    200: listTemplatesResponseSchema,
    400: errorSchema,
    500: errorSchema,
  },
  detail: {
    summary: "List templates",
    description: "Lists extraction templates with cursor-based pagination.",
    tags: ["Templates"],
  },
};

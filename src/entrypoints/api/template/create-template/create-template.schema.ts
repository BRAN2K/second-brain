import { templateResponseSchema } from "@/adapters/input/http/template/_shared/template.response";
import { createTemplateRequestSchema } from "@/adapters/input/http/template/create-template/request";
import { errorSchema } from "@/libs/errors";

export const createTemplateSchema = {
  body: createTemplateRequestSchema,
  response: {
    201: templateResponseSchema,
    400: errorSchema,
    422: errorSchema,
    500: errorSchema,
  },
  detail: {
    summary: "Create a template",
    description: "Creates an extraction template with its field definitions.",
    tags: ["Templates"],
  },
};

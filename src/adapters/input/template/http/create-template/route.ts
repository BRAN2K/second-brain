import { errorSchema } from "@/libs/errors";
import { createTemplateRequestSchema } from "./request";
import { createTemplateResponseSchema } from "./response";

export const routeConfig = {
  body: createTemplateRequestSchema,
  response: {
    201: createTemplateResponseSchema,
    400: errorSchema,
    422: errorSchema,
    500: errorSchema,
  },
  detail: {
    summary: "Create a template",
    description: "Creates an extraction template with its field definitions.",
    tags: ["Templates"] as string[],
  },
} as const;

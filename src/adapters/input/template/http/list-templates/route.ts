import { errorSchema } from "@/libs/errors";
import { listTemplatesRequestSchema } from "./request";
import { listTemplatesResponseSchema } from "./response";

export const routeConfig = {
  query: listTemplatesRequestSchema,
  response: {
    200: listTemplatesResponseSchema,
    400: errorSchema,
    500: errorSchema,
  },
  detail: {
    summary: "List templates",
    description: "Lists extraction templates with cursor-based pagination.",
    tags: ["Templates"] as string[],
  },
} as const;

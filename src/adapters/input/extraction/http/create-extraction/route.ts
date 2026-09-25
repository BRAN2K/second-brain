import { errorSchema } from "@/libs/errors";
import { createExtractionRequestSchema } from "./request";
import { createExtractionResponseSchema } from "./response";

export const routeConfig = {
  body: createExtractionRequestSchema,
  response: {
    201: createExtractionResponseSchema,
    400: errorSchema,
    404: errorSchema,
    422: errorSchema,
    500: errorSchema,
  },
  detail: {
    summary: "Create an extraction",
    description: "Extracts structured data from text or an audio file using a template.",
    tags: ["Extractions"] as string[],
  },
} as const;

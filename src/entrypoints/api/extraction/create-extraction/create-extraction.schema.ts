import { createExtractionRequestSchema } from "@/adapters/input/http/extraction/create-extraction/request";
import { createExtractionResponseSchema } from "@/adapters/input/http/extraction/create-extraction/response";
import { errorSchema } from "@/libs/errors";

export const createExtractionSchema = {
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
    tags: ["Extractions"],
  },
};

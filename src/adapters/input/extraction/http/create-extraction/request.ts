import type { Static } from "elysia";
import { t } from "elysia";
import { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type.enum";

export const createExtractionRequestSchema = t.Object(
  {
    sourceType: t.Enum(ExtractionSourceType),
    templateId: t.String({ description: "Template whose fields the extraction must produce" }),
    inputText: t.Optional(t.String({ description: "Required when sourceType is text" })),
    file: t.Optional(t.File({ description: "Audio file, required when sourceType is audio" })),
    instructions: t.Optional(t.String({ description: "Extra instructions for the LLM" })),
  },
  { description: "Payload to create an extraction" },
);

export type CreateExtractionRequest = Static<typeof createExtractionRequestSchema>;

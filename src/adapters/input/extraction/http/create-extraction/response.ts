import type { Static } from "elysia";
import { t } from "elysia";
import { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type.enum";

export const createExtractionResponseSchema = t.Object(
  {
    id: t.String(),
    templateId: t.String(),
    sourceType: t.Enum(ExtractionSourceType),
    inputText: t.String(),
    result: t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean(), t.Null()])),
    missingFields: t.Array(
      t.Object({
        field: t.String(),
        usedDefault: t.Boolean(),
      }),
    ),
    complete: t.Boolean(),
    provider: t.String(),
    model: t.String(),
    meta: t.Object({
      inputTokens: t.Number(),
      outputTokens: t.Number(),
      transcriptionDurationMs: t.Number(),
    }),
    createdAt: t.String(),
  },
  { description: "An extraction result" },
);

export type CreateExtractionResponse = Static<typeof createExtractionResponseSchema>;

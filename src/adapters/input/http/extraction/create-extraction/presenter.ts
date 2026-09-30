import type { Extraction } from "@/domain/extraction/entities/extraction.aggregate";
import type { ExtractionFieldValue } from "@/domain/extraction/services/extraction-llm-provider.service";
import type { CreateExtractionResponse } from "./response";

export const CreateExtractionPresenter = {
  toHttp(extraction: Extraction): CreateExtractionResponse {
    return {
      id: extraction.id,
      templateId: extraction.templateId,
      sourceType: extraction.sourceType,
      inputText: extraction.inputText,
      result: (extraction.result ?? {}) as Record<string, ExtractionFieldValue>,
      missingFields: extraction.missingFields.map((missing) => ({
        field: missing.field,
        usedDefault: missing.usedDefault,
      })),
      complete: extraction.complete,
      provider: extraction.provider,
      model: extraction.model,
      meta: {
        inputTokens: extraction.meta.inputTokens,
        outputTokens: extraction.meta.outputTokens,
        transcriptionDurationMs: extraction.meta.transcriptionDurationMs,
      },
      createdAt: extraction.createdAt.toISOString(),
    };
  },
};

import type { GeminiGenerateContentResponse } from "@/adapters/output/services/llm/gemini/dtos/generate-content-response";
import { TemplateSnapshot } from "@/domain/extraction/value-objects/template-snapshot.value-object";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind.enum";
import { makeTemplate } from "@/test/factories/domain/template.aggregate.factory";

export function buildSnapshot(): TemplateSnapshot {
  return TemplateSnapshot.fromTemplate(
    makeTemplate({
      items: [
        {
          name: "produto",
          kind: TemplateFieldKind.String,
          required: true,
          description: "Nome do produto comprado",
        },
        { name: "quantidade", kind: TemplateFieldKind.Number, required: true, default: 1 },
        { name: "data", kind: TemplateFieldKind.Date, required: true },
        {
          name: "forma_pagamento",
          kind: TemplateFieldKind.Enum,
          required: false,
          values: ["pix", "cartao de credito", "dinheiro"],
        },
        { name: "parcelado", kind: TemplateFieldKind.Boolean, required: false },
      ],
      rules: ["Compras genéricas como `mercado` devem ter quantidade 1."],
    }),
  );
}

export const extractedData = {
  produto: "aspirador",
  quantidade: 1,
  data: "2026-07-05T00:00:00Z",
  forma_pagamento: "pix",
  parcelado: null,
};

export function geminiPayload(
  overrides: { finishReason?: string; text?: string } = {},
): GeminiGenerateContentResponse {
  return {
    candidates: [
      {
        content: {
          role: "model",
          parts: [{ text: overrides.text ?? JSON.stringify(extractedData) }],
        },
        finishReason: overrides.finishReason ?? "STOP",
      },
    ],
    usageMetadata: {
      promptTokenCount: 120,
      candidatesTokenCount: 30,
      thoughtsTokenCount: 8,
      totalTokenCount: 158,
    },
    modelVersion: "gemini-2.5-flash-001",
  };
}

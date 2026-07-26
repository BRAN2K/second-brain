import type { GeminiGenerateContentResponse } from "@/adapters/output/llm/gemini/dtos/generate-content-response";
import { TemplateSnapshot } from "@/domain/extraction/value-objects/template-snapshot";
import { Template } from "@/domain/template/entities/template";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind";
import { TemplateItem } from "@/domain/template/value-objects/template-item";

export function buildSnapshot(): TemplateSnapshot {
  return TemplateSnapshot.fromTemplate(
    Template.create({
      name: "compra",
      description: "Template para extrair informações de compras",
      items: [
        TemplateItem.create({
          name: "produto",
          kind: TemplateFieldKind.String,
          required: true,
          description: "Nome do produto comprado",
        }),
        TemplateItem.create({
          name: "quantidade",
          kind: TemplateFieldKind.Number,
          required: true,
          default: 1,
        }),
        TemplateItem.create({ name: "data", kind: TemplateFieldKind.Date, required: true }),
        TemplateItem.create({
          name: "forma_pagamento",
          kind: TemplateFieldKind.Enum,
          required: false,
          values: ["pix", "cartao de credito", "dinheiro"],
        }),
        TemplateItem.create({
          name: "parcelado",
          kind: TemplateFieldKind.Boolean,
          required: false,
        }),
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

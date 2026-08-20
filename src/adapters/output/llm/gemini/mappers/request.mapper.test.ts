import { describe, expect, it } from "bun:test";
import { toGeminiRequest } from "@/adapters/output/llm/gemini/mappers/request.mapper";
import { buildSnapshot } from "@/adapters/output/llm/gemini/test.fixtures";
import { buildExtractionPrompt } from "@/adapters/output/llm/prompts/extraction.prompt";

describe("toGeminiRequest", () => {
  it("sends the input text as the user message", () => {
    const request = toGeminiRequest({
      content: "comprei um aspirador ontem no pix",
      template: buildSnapshot(),
    });

    expect(request.contents).toEqual([
      { role: "user", parts: [{ text: "comprei um aspirador ontem no pix" }] },
    ]);
  });

  it("uses the shared extraction prompt as the system instruction", () => {
    const snapshot = buildSnapshot();
    const request = toGeminiRequest({
      content: "texto",
      template: snapshot,
      instructions: "considere valores em reais",
    });

    expect(request.systemInstruction?.parts[0]?.text).toBe(
      buildExtractionPrompt(snapshot, "considere valores em reais"),
    );
  });

  it("builds a JSON response schema mapping every kind, all fields required and nullable", () => {
    const request = toGeminiRequest({ content: "texto", template: buildSnapshot() });

    expect(request.generationConfig?.responseMimeType).toBe("application/json");
    expect(request.generationConfig?.temperature).toBe(0);

    const schema = request.generationConfig?.responseSchema;
    expect(schema?.type).toBe("OBJECT");
    expect(schema?.required).toEqual([
      "produto",
      "quantidade",
      "data",
      "forma_pagamento",
      "parcelado",
    ]);
    expect(schema?.propertyOrdering).toEqual(schema?.required);

    expect(schema?.properties?.produto).toEqual({
      type: "STRING",
      nullable: true,
      description: "Nome do produto comprado",
    });
    expect(schema?.properties?.quantidade).toEqual({ type: "NUMBER", nullable: true });
    expect(schema?.properties?.data).toEqual({
      type: "STRING",
      format: "date-time",
      nullable: true,
    });
    expect(schema?.properties?.forma_pagamento).toEqual({
      type: "STRING",
      enum: ["pix", "cartao de credito", "dinheiro"],
      nullable: true,
    });
    expect(schema?.properties?.parcelado).toEqual({ type: "BOOLEAN", nullable: true });
  });
});

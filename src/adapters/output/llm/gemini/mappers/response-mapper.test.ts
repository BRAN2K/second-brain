import { describe, expect, it } from "bun:test";
import { toExtractionResult } from "@/adapters/output/llm/gemini/mappers/response-mapper";
import { extractedData, geminiPayload } from "@/adapters/output/llm/gemini/test-fixtures";
import { UpstreamError } from "@/infrastructure/helpers/errors";

describe("toExtractionResult", () => {
  it("maps data, model and token usage (thinking tokens count as output)", () => {
    expect(toExtractionResult(geminiPayload())).toEqual({
      data: extractedData,
      provider: "gemini",
      model: "gemini-2.5-flash-001",
      inputTokens: 120,
      outputTokens: 38,
    });
  });

  it("rejects blocked prompts, reporting the block reason", () => {
    const payload = geminiPayload();
    payload.candidates = undefined;
    payload.promptFeedback = { blockReason: "SAFETY" };

    let caught: unknown;
    try {
      toExtractionResult(payload);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(UpstreamError);
    expect((caught as UpstreamError).issues).toEqual(["prompt was blocked (SAFETY)"]);
  });

  it("rejects generations that did not finish with STOP", () => {
    const payload = geminiPayload({ finishReason: "MAX_TOKENS" });

    expect(() => toExtractionResult(payload)).toThrow(UpstreamError);
  });

  it("rejects responses whose text is not valid JSON", () => {
    const payload = geminiPayload({ text: "not json" });

    expect(() => toExtractionResult(payload)).toThrow(UpstreamError);
  });
});

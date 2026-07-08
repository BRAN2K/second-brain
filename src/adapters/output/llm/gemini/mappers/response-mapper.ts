import { GEMINI_PROVIDER } from "@/adapters/output/llm/gemini/constants";
import type { GeminiGenerateContentResponse } from "@/adapters/output/llm/gemini/dtos/generate-content-response";
import { InvalidProviderOutput } from "@/domain/extraction/errors/invalid-provider-output";
import type {
  ExtractionFieldValue,
  ExtractionResult,
} from "@/domain/extraction/ports/http/extraction-llm-provider";

export function toExtractionResult(payload: GeminiGenerateContentResponse): ExtractionResult {
  const usage = payload.usageMetadata;

  return {
    data: extractionData(payload),
    provider: GEMINI_PROVIDER,
    model: payload.modelVersion,
    inputTokens: usage.promptTokenCount,
    outputTokens: usage.candidatesTokenCount + (usage.thoughtsTokenCount ?? 0),
  };
}

function extractionData(
  payload: GeminiGenerateContentResponse,
): Record<string, ExtractionFieldValue> {
  const text = generatedText(payload);
  const parsed = parseJson(text) as Record<string, ExtractionFieldValue>;

  return parsed;
}

function generatedText(payload: GeminiGenerateContentResponse): string {
  const candidate = payload.candidates?.[0];

  if (!candidate) {
    const blockReason = payload.promptFeedback?.blockReason;
    const message = blockReason
      ? `prompt was blocked (${blockReason})`
      : "response has no candidates";

    throw new InvalidProviderOutput(GEMINI_PROVIDER, [message]);
  }

  if (candidate.finishReason !== "STOP") {
    throw new InvalidProviderOutput(GEMINI_PROVIDER, [
      `generation did not complete (finishReason: ${candidate.finishReason})`,
    ]);
  }

  const text = candidate.content.parts?.[0]?.text;
  if (!text) {
    throw new InvalidProviderOutput(GEMINI_PROVIDER, ["response has no text part"]);
  }

  return text;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new InvalidProviderOutput(GEMINI_PROVIDER, ["response text is not valid JSON"]);
  }
}

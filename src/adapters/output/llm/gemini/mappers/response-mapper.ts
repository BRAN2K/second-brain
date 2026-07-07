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
  const candidate = payload.candidates?.[0];

  if (!candidate) {
    const blockReason = payload.promptFeedback?.blockReason;
    throw invalid(
      blockReason ? `prompt was blocked (${blockReason})` : "response has no candidates",
    );
  }

  if (candidate.finishReason !== "STOP") {
    throw invalid(`generation did not complete (finishReason: ${candidate.finishReason})`);
  }

  const text = candidate.content.parts?.[0]?.text;
  if (!text) {
    throw invalid("response has no text part");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw invalid("response text is not valid JSON");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw invalid("extraction output must be a JSON object");
  }

  for (const [field, value] of Object.entries(parsed)) {
    if (value !== null && !["string", "number", "boolean"].includes(typeof value)) {
      throw invalid(`field "${field}" must be a scalar or null`);
    }
  }

  return parsed as Record<string, ExtractionFieldValue>;
}

function invalid(issue: string): InvalidProviderOutput {
  return new InvalidProviderOutput(GEMINI_PROVIDER, [issue]);
}

import type { GroqChatCompletionResponse } from "@/adapters/output/services/llm/groq/dtos/chat-completion-response";
import type {
  ExtractionFieldValue,
  ExtractionResult,
} from "@/domain/extraction/services/extraction-llm-provider.service";
import { GROQ_PROVIDER } from "@/adapters/output/services/llm/groq/constants";
import { EXTRACTION_BRN } from "@/domain/extraction/brn";
import { PROBLEM, UpstreamError } from "@/libs/errors";

function invalidProviderOutput(issues: string[]): UpstreamError {
  return new UpstreamError({
    resource: EXTRACTION_BRN.resource,
    scope: EXTRACTION_BRN.scope.providerOutput,
    problem: PROBLEM.INVALID,
    message: `Provider "${GROQ_PROVIDER}" returned invalid output`,
    issues,
  });
}

export function toExtractionResult(payload: GroqChatCompletionResponse): ExtractionResult {
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw invalidProviderOutput(["response has no content"]);
  }

  try {
    return {
      data: JSON.parse(content) as Record<string, ExtractionFieldValue>,
      provider: GROQ_PROVIDER,
      model: payload.model,
      inputTokens: payload.usage?.prompt_tokens ?? 0,
      outputTokens: payload.usage?.completion_tokens ?? 0,
    };
  } catch {
    throw invalidProviderOutput(["response content is not valid JSON"]);
  }
}

import type { GroqChatCompletionRequest } from "@/adapters/output/services/llm/groq/dtos/chat-completion-request";
import type { GroqChatCompletionResponse } from "@/adapters/output/services/llm/groq/dtos/chat-completion-response";
import type {
  ExtractionInput,
  ExtractionLLMProviderService,
  ExtractionResult,
} from "@/domain/extraction/services/extraction-llm-provider.service";
import { GROQ_BASE_URL, GROQ_PROVIDER } from "@/adapters/output/services/llm/groq/constants";
import { toGroqRequest } from "@/adapters/output/services/llm/groq/mappers/request.mapper";
import { toExtractionResult } from "@/adapters/output/services/llm/groq/mappers/response.mapper";
import { EXTRACTION_BRN } from "@/domain/extraction/brn";
import { UpstreamError } from "@/libs/errors";

export class GroqExtractionService implements ExtractionLLMProviderService {
  constructor(private readonly groqApiKey: string) {}

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const payload = await this.chatCompletions(toGroqRequest(input));
    return toExtractionResult(payload);
  }

  private async chatCompletions(
    request: GroqChatCompletionRequest,
  ): Promise<GroqChatCompletionResponse> {
    let response: Response;
    try {
      response = await fetch(GROQ_BASE_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.groqApiKey}`,
        },
        body: JSON.stringify(request),
      });
    } catch (cause) {
      throw providerFailed(cause);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw providerFailed(new Error(`${response.status} - ${body}`));
    }

    return (await response.json()) as GroqChatCompletionResponse;
  }
}

function providerFailed(cause: unknown): UpstreamError {
  return new UpstreamError({
    resource: EXTRACTION_BRN.resource,
    scope: EXTRACTION_BRN.scope.provider,
    message: `Provider failed: "${GROQ_PROVIDER}"`,
    cause,
  });
}

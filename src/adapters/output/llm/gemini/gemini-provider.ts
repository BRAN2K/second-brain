import type { GeminiGenerateContentRequest } from "@/adapters/output/llm/gemini/dtos/generate-content-request";
import type { GeminiGenerateContentResponse } from "@/adapters/output/llm/gemini/dtos/generate-content-response";
import type {
  ExtractionInput,
  ExtractionResult,
  IExtractionLLMProvider,
} from "@/domain/extraction/ports/extraction-llm-provider.port";
import {
  GEMINI_BASE_URL,
  GEMINI_MODEL,
  GEMINI_PROVIDER,
} from "@/adapters/output/llm/gemini/constants";
import { toGeminiRequest } from "@/adapters/output/llm/gemini/mappers/request-mapper";
import { toExtractionResult } from "@/adapters/output/llm/gemini/mappers/response-mapper";
import { EXTRACTION_BRN } from "@/domain/extraction/brn";
import { UpstreamError } from "@/libs/errors";

export class GeminiExtractionLLMProvider implements IExtractionLLMProvider {
  constructor(private readonly geminiApiKey: string) {}

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const payload = await this.generateContent(toGeminiRequest(input));
    return toExtractionResult(payload);
  }

  private async generateContent(
    request: GeminiGenerateContentRequest,
  ): Promise<GeminiGenerateContentResponse> {
    let response: Response;
    try {
      response = await fetch(`${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.geminiApiKey,
        },
        body: JSON.stringify(request),
      });
    } catch (cause) {
      throw providerFailed(cause);
    }

    if (!response.ok) {
      throw await httpFailure(response);
    }

    return (await response.json()) as GeminiGenerateContentResponse;
  }
}

function providerFailed(cause: unknown): UpstreamError {
  return new UpstreamError({
    resource: EXTRACTION_BRN.resource,
    scope: EXTRACTION_BRN.scope.provider,
    message: `Provider "${GEMINI_PROVIDER}" failed`,
    cause,
  });
}

async function httpFailure(response: Response): Promise<UpstreamError> {
  const body = await response.text().catch(() => "");

  return providerFailed(new Error(`${response.status} - ${body}`));
}

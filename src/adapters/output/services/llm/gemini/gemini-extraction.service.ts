import type { GeminiGenerateContentRequest } from "@/adapters/output/services/llm/gemini/dtos/generate-content-request";
import type { GeminiGenerateContentResponse } from "@/adapters/output/services/llm/gemini/dtos/generate-content-response";
import type {
  ExtractionInput,
  ExtractionLLMProviderService,
  ExtractionResult,
} from "@/domain/extraction/services/extraction-llm-provider.service";
import {
  GEMINI_BASE_URL,
  GEMINI_MODEL,
  GEMINI_PROVIDER,
} from "@/adapters/output/services/llm/gemini/constants";
import { toGeminiRequest } from "@/adapters/output/services/llm/gemini/mappers/request.mapper";
import { toExtractionResult } from "@/adapters/output/services/llm/gemini/mappers/response.mapper";
import { EXTRACTION_BRN } from "@/domain/extraction/brn";
import { UpstreamError } from "@/libs/errors";

export class GeminiExtractionService implements ExtractionLLMProviderService {
  constructor(private readonly geminiApiKey: string) {}

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const payload = await this.generateContent(toGeminiRequest(input));
    return toExtractionResult(payload);
  }

  private async generateContent(
    request: GeminiGenerateContentRequest,
  ): Promise<GeminiGenerateContentResponse> {
    const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`;
    let lastFailure: UpstreamError | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      let response: Response;
      try {
        response = await fetch(url, {
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
        const failure = await httpFailure(response);
        if (!isRetryable(response.status) || attempt === MAX_RETRIES) {
          throw failure;
        }
        lastFailure = failure;
        await sleep(backoffDelay(attempt));
        continue;
      }

      return (await response.json()) as GeminiGenerateContentResponse;
    }

    throw lastFailure;
  }
}

const MAX_RETRIES = 3;
const RETRYABLE_STATUS = [429, 500, 503];

function isRetryable(status: number): boolean {
  return RETRYABLE_STATUS.includes(status);
}

function backoffDelay(attempt: number): number {
  return 2 ** attempt * 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function providerFailed(cause: unknown): UpstreamError {
  return new UpstreamError({
    resource: EXTRACTION_BRN.resource,
    scope: EXTRACTION_BRN.scope.provider,
    message: `Provider failed: "${GEMINI_PROVIDER}"`,
    cause,
  });
}

async function httpFailure(response: Response): Promise<UpstreamError> {
  const body = await response.text().catch(() => "");

  return providerFailed(new Error(`${response.status} - ${body}`));
}

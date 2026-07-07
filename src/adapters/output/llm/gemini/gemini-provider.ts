import { GEMINI_PROVIDER } from "@/adapters/output/llm/gemini/constants";
import type { GeminiGenerateContentRequest } from "@/adapters/output/llm/gemini/dtos/generate-content-request";
import type { GeminiGenerateContentResponse } from "@/adapters/output/llm/gemini/dtos/generate-content-response";
import { toGeminiRequest } from "@/adapters/output/llm/gemini/mappers/request-mapper";
import { toExtractionResult } from "@/adapters/output/llm/gemini/mappers/response-mapper";
import { ProviderError } from "@/domain/extraction/errors/provider-error";
import type {
  ExtractionInput,
  ExtractionResult,
  IExtractionLLMProvider,
} from "@/domain/extraction/ports/http/extraction-llm-provider";

export class GeminiExtractionLLMProvider implements IExtractionLLMProvider {
  constructor(
    private readonly geminiApiKey: string,
    private readonly geminiModel: string,
    private readonly geminiUrl: string,
  ) {}

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const payload = await this.generateContent(toGeminiRequest(input));
    return toExtractionResult(payload);
  }

  private async generateContent(
    request: GeminiGenerateContentRequest,
  ): Promise<GeminiGenerateContentResponse> {
    let response: Response;
    try {
      response = await fetch(`${this.geminiUrl}/models/${this.geminiModel}:generateContent`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.geminiApiKey,
        },
        body: JSON.stringify(request),
      });
    } catch (cause) {
      throw new ProviderError(GEMINI_PROVIDER, true, { cause });
    }

    if (!response.ok) {
      const transient = response.status === 429 || response.status >= 500;
      const body = await response.text().catch(() => "");
      throw new ProviderError(GEMINI_PROVIDER, transient, {
        cause: new Error(`${response.status} - ${body}`),
      });
    }

    return (await response.json()) as GeminiGenerateContentResponse;
  }
}

import type {
  ExtractionInput,
  ExtractionLLMProviderService,
  ExtractionResult,
} from "@/domain/extraction/services/extraction-llm-provider.service";

export class FallbackExtractionService implements ExtractionLLMProviderService {
  constructor(private readonly providers: ExtractionLLMProviderService[]) {}

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    let lastError: unknown;

    for (const provider of this.providers) {
      try {
        return await provider.extract(input);
      } catch (cause) {
        lastError = cause;
      }
    }

    throw lastError;
  }
}

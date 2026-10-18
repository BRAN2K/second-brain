import type {
  ExtractionInput,
  ExtractionLLMProviderService,
  ExtractionResult,
} from "@/domain/extraction/services/extraction-llm-provider.service";
import { logger } from "@/libs/logger";

export class FallbackExtractionService implements ExtractionLLMProviderService {
  constructor(private readonly providers: ExtractionLLMProviderService[]) {}

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    let lastError: unknown;

    for (const provider of this.providers) {
      try {
        return await provider.extract(input);
      } catch (cause) {
        lastError = cause;
        logger.warn({ err: cause }, "extraction provider failed, trying the next one");
      }
    }

    throw lastError;
  }
}

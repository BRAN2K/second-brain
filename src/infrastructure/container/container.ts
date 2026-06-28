import { KyselyExtractionRepository } from "@/adapters/output/database/extraction-repository";
import { createLlmRegistry } from "@/adapters/output/llm/index";
import { createGroqWhisper } from "@/adapters/output/transcription/groq-whisper";
import { createOutputValidator } from "@/adapters/output/validation/output-validator";
import type { Config } from "@/infrastructure/config";
import { createDb } from "@/infrastructure/database/client";
import { createLogger } from "@/infrastructure/logger";
import { createMetrics } from "@/infrastructure/metrics";

/**
 * Composition root wiring: builds concrete adapters from config and exposes them
 * for injection into routes/use-cases.
 */
export function createContainer(config: Config) {
  const db = createDb(config.DATABASE_URL);
  const extractionRepository = new KyselyExtractionRepository(db);
  const providerRegistry = createLlmRegistry(config);
  const outputValidator = createOutputValidator();
  const transcriber = createGroqWhisper({
    apiKey: config.GROQ_API_KEY,
    model: config.GROQ_WHISPER_MODEL,
  });
  const logger = createLogger(config);
  const metrics = createMetrics();

  return {
    db,
    extractionRepository,
    providerRegistry,
    outputValidator,
    transcriber,
    logger,
    metrics,
  };
}

export type Container = ReturnType<typeof createContainer>;

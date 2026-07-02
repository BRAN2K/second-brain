import { CreateExtractionController } from "@/adapters/input/extraction/http/create-extraction";
import { PostgresExtractionRepository } from "@/adapters/output/database/postgres/extraction/extraction-repository";
import { GeminiExtractionLLMProvider } from "@/adapters/output/llm/gemini-provider";
import { GroqWhisperTranscriberLLMProvider } from "@/adapters/output/transcription/groq-whisper";
import { CreateExtractionUseCase } from "@/domain/extraction/use-cases/create-extraction";
import type { Config } from "@/infrastructure/helpers/config";
import type { SharedDeps } from "./index";

export function createExtractionRoute(config: Config, shared: SharedDeps) {
  const extractionRepository = new PostgresExtractionRepository(shared.db);
  const extractionLLMProvider = new GeminiExtractionLLMProvider(
    config.GEMINI_API_KEY,
    config.GEMINI_MODEL,
    config.GEMINI_URL,
  );
  const transcriberLLMProvider = new GroqWhisperTranscriberLLMProvider(
    config.GROQ_API_KEY,
    config.GROQ_WHISPER_MODEL,
    config.GROQ_WHISPER_URL,
  );
  const createExtractionUseCase = new CreateExtractionUseCase(
    extractionLLMProvider,
    extractionRepository,
    transcriberLLMProvider,
  );
  const createExtractionController = new CreateExtractionController(
    createExtractionUseCase,
  );

  return createExtractionController.execute();
}

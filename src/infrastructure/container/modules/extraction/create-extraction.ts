import type { Config } from "@/libs/config";
import type { SharedDeps } from "./index";
import { CreateExtractionController } from "@/adapters/input/extraction/http/create-extraction";
import { PostgresExtractionRepository } from "@/adapters/output/database/postgres/extraction/extraction.repository";
import { PostgresTemplateRepository } from "@/adapters/output/database/postgres/template/template.repository";
import { GeminiExtractionLLMProvider } from "@/adapters/output/llm/gemini/gemini.provider";
import { GroqWhisperTranscriberLLMProvider } from "@/adapters/output/transcription/groq.whisper";
import { CreateExtractionUseCase } from "@/application/extraction/use-cases/create-extraction.use-case";

export function createExtractionRoute(config: Config, shared: SharedDeps) {
  const extractionRepository = new PostgresExtractionRepository(shared.db);
  const templateRepository = new PostgresTemplateRepository(shared.db);
  const extractionLLMProvider = new GeminiExtractionLLMProvider(config.GEMINI_API_KEY);
  const transcriberLLMProvider = new GroqWhisperTranscriberLLMProvider(config.GROQ_API_KEY);
  const createExtractionUseCase = new CreateExtractionUseCase(
    extractionLLMProvider,
    extractionRepository,
    templateRepository,
    transcriberLLMProvider,
  );
  const createExtractionController = new CreateExtractionController(createExtractionUseCase);

  return createExtractionController.execute();
}

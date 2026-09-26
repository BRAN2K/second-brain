import type { dbType } from "@/libs/database/postgres/client";
import { CreateExtractionController } from "@/adapters/input/extraction/http/create-extraction/controller";
import { PostgresExtractionRepository } from "@/adapters/output/database/postgres/extraction/extraction.repository";
import { PostgresTemplateRepository } from "@/adapters/output/database/postgres/template/template.repository";
import { GeminiExtractionLLMProvider } from "@/adapters/output/llm/gemini/gemini.provider";
import { GroqWhisperTranscriberLLMProvider } from "@/adapters/output/transcription/groq.whisper";
import { CreateExtractionUseCase } from "@/application/extraction/use-cases/create-extraction.use-case";
import { env } from "@/infrastructure/env";

export function createExtractionFactory(dbConnection: dbType) {
  const extractionRepository = new PostgresExtractionRepository(dbConnection);
  const templateRepository = new PostgresTemplateRepository(dbConnection);
  const extractionLLMProvider = new GeminiExtractionLLMProvider(env.GEMINI_API_KEY);
  const transcriberLLMProvider = new GroqWhisperTranscriberLLMProvider(env.GROQ_API_KEY);
  const createExtractionUseCase = new CreateExtractionUseCase(
    extractionLLMProvider,
    extractionRepository,
    templateRepository,
    transcriberLLMProvider,
  );
  const createExtractionController = new CreateExtractionController(createExtractionUseCase);

  return createExtractionController.execute();
}

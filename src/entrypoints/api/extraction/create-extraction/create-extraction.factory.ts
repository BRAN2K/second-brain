import type { Kysely } from "kysely";
import type { Database } from "@/adapters/output/repositories/database";
import { CreateExtractionController } from "@/adapters/input/http/extraction/create-extraction/controller";
import { PostgresExtractionRepository } from "@/adapters/output/repositories/extraction/extraction.repository";
import { PostgresTemplateRepository } from "@/adapters/output/repositories/template/template.repository";
import { FallbackExtractionService } from "@/adapters/output/services/llm/fallback-extraction.service";
import { GeminiExtractionService } from "@/adapters/output/services/llm/gemini/gemini-extraction.service";
import { GroqExtractionService } from "@/adapters/output/services/llm/groq/groq-extraction.service";
import { GroqTranscriberService } from "@/adapters/output/services/transcription/groq-transcriber.service";
import { CreateExtractionUseCase } from "@/application/use-cases/extraction/create-extraction.use-case";
import { env } from "@/infrastructure/env";

export const CreateExtractionFactory = (db: Kysely<Database>): CreateExtractionController =>
  new CreateExtractionController(
    new CreateExtractionUseCase(
      new FallbackExtractionService([
        new GroqExtractionService(env.GROQ_API_KEY),
        new GeminiExtractionService(env.GEMINI_API_KEY),
      ]),
      new PostgresExtractionRepository(db),
      new PostgresTemplateRepository(db),
      new GroqTranscriberService(env.GROQ_API_KEY),
    ),
  );

import type { GeminiContent } from "@/adapters/output/llm/gemini/dtos/content";
import type { GeminiSchema } from "@/adapters/output/llm/gemini/dtos/response-schema";

// Request body of models.generateContent; only contents is required.
// Reference: https://ai.google.dev/api/generate-content
export interface GeminiGenerationConfig {
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: GeminiSchema;
}

export interface GeminiGenerateContentRequest {
  contents: GeminiContent[];
  systemInstruction?: GeminiContent;
  generationConfig?: GeminiGenerationConfig;
}

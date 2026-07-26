import type { GeminiContent } from "@/adapters/output/llm/gemini/dtos/content";

// Response body of models.generateContent.
// Reference: https://ai.google.dev/api/generate-content

export type GeminiFinishReason = "STOP" | "MAX_TOKENS" | "SAFETY" | (string & {});

export interface GeminiCandidate {
  content: GeminiContent;
  finishReason: GeminiFinishReason;
}

export interface GeminiUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
  thoughtsTokenCount?: number;
}

export interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
  usageMetadata: GeminiUsageMetadata;
  modelVersion: string;
}

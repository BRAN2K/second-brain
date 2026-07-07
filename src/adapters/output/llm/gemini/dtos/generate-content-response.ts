import type { GeminiContent } from "@/adapters/output/llm/gemini/dtos/content";

// Response body of models.generateContent.
// Reference: https://ai.google.dev/api/generate-content
export interface GeminiCandidate {
  content: GeminiContent;
  finishReason: "STOP" | "MAX_TOKENS" | "SAFETY" | (string & {});
}

export interface GeminiUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
  // Thinking models only; billed as output tokens.
  thoughtsTokenCount?: number;
}

export interface GeminiGenerateContentResponse {
  // Absent when the prompt itself is blocked (see promptFeedback.blockReason).
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
  usageMetadata: GeminiUsageMetadata;
  modelVersion: string;
}

import type { JsonSchema } from "@/adapters/output/services/llm/groq/dtos/json-schema";

// Request body of the Groq Chat Completions API (OpenAI-compatible).
// Reference: https://console.groq.com/docs/api-reference
export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: JsonSchema;
  };
}

export interface GroqChatCompletionRequest {
  model: string;
  messages: GroqMessage[];
  temperature: number;
  response_format: GroqResponseFormat;
}

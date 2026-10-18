// Response body of the Groq Chat Completions API (OpenAI-compatible).
// Reference: https://console.groq.com/docs/api-reference
export interface GroqChatCompletionResponse {
  model: string;
  choices: { message: { content: string } }[];
  usage: { prompt_tokens: number; completion_tokens: number };
}

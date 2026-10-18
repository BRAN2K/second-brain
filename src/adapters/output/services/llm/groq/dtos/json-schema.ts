// Subset of JSON Schema accepted by Groq's structured outputs (strict mode).
// Reference: https://console.groq.com/docs/structured-outputs
export interface JsonSchema {
  type?: string | string[];
  description?: string;
  enum?: (string | null)[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
}

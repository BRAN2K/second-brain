// Subset of the OpenAPI schema object accepted by generationConfig.responseSchema.
// Reference: https://ai.google.dev/api/caching#Schema
export interface GeminiSchema {
  type: "STRING" | "NUMBER" | "BOOLEAN" | "OBJECT";
  description?: string;
  format?: string;
  enum?: string[];
  nullable?: boolean;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  propertyOrdering?: string[];
}

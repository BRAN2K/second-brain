// Content blocks shared by the generateContent request and response.
// Reference: https://ai.google.dev/api/generate-content

// A part carries one of: text, inline_data or file_data. We only use text.
export interface GeminiPart {
  text?: string;
}

export interface GeminiContent {
  role?: string;
  parts: GeminiPart[];
}

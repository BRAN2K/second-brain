import type {
  CanonicalSchema,
  JsonSchema,
} from "@/domain/extraction/services/template-to-schema";

/**
 * Per-dialect translation of the canonical JSON Schema. OpenAI-compatible endpoints
 * (OpenAI, Groq) are driven by `json_object` mode plus a schema embedded in the prompt
 * (`schemaInstruction`); Gemini takes a native `responseSchema` in its OpenAPI-ish
 * dialect (`toGeminiSchema`). Either way, provider output is re-validated on our side.
 */

/** Prompt fragment that tells an OpenAI-compatible model the exact shape to return. */
export function schemaInstruction(canonical: CanonicalSchema): string {
  return [
    "Return a single JSON object matching this JSON Schema:",
    JSON.stringify(canonical),
    "Use null for any field you cannot determine. Respond with JSON only — no prose.",
  ].join("\n");
}

/** Gemini `responseSchema` dialect (OpenAPI subset: uppercase types, `nullable`). */
export interface GeminiSchema {
  type: "STRING" | "NUMBER" | "BOOLEAN" | "ARRAY" | "OBJECT";
  nullable?: boolean;
  description?: string;
  enum?: string[];
  format?: string;
  items?: GeminiSchema;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
}

function leafToGemini(schema: JsonSchema): GeminiSchema {
  if (schema.type === "array") {
    return {
      type: "ARRAY",
      nullable: true,
      items: schema.items ? leafToGemini(schema.items) : { type: "STRING" },
    };
  }
  if (schema.enum) {
    return {
      type: "STRING",
      nullable: true,
      format: "enum",
      enum: schema.enum,
    };
  }
  switch (schema.type) {
    case "number":
      return { type: "NUMBER", nullable: true };
    case "boolean":
      return { type: "BOOLEAN", nullable: true };
    default:
      // string (incl. our `date`, mapped to plain STRING — Gemini lacks a date format)
      return { type: "STRING", nullable: true };
  }
}

export function toGeminiSchema(canonical: CanonicalSchema): GeminiSchema {
  const properties: Record<string, GeminiSchema> = {};
  for (const [name, prop] of Object.entries(canonical.properties)) {
    const gemini = leafToGemini(prop);
    if (prop.description) {
      gemini.description = prop.description;
    }
    properties[name] = gemini;
  }
  return {
    type: "OBJECT",
    properties,
    required: canonical.required,
  };
}

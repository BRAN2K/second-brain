import type { CanonicalSchema } from "@/domain/extraction/value-objects/canonical-schema";

/**
 * Driven port for an LLM extraction provider (OpenAI / Gemini / Groq). Concrete
 * adapters live in `adapters/output/llm` and translate the canonical JSON Schema to
 * their own dialect. The domain never imports provider SDKs.
 *
 * Provider output is NEVER the source of truth — it is always re-validated on our side
 * (see `adapters/output/validation`) and completeness is decided by the `Template`.
 */

export interface ExtractionInput {
  /** Text (or transcription) to extract from. */
  content: string;
  /** Strict canonical schema describing the fields to extract. */
  schema: CanonicalSchema;
  /** Optional extra guidance appended to the provider prompt. */
  instructions?: string;
}

/** Provider-reported metadata about a single extraction call. */
export interface ProviderRawMeta {
  model: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ExtractionOutput {
  /** Raw structured data as returned by the provider (still unvalidated). */
  data: unknown;
  raw: ProviderRawMeta;
}

export interface ExtractionProvider {
  /** Stable identifier, e.g. `"groq"`. Kept as `string` so fakes/tests are free. */
  readonly name: string;
  /** Whether the provider is usable right now (e.g. its API key is configured). */
  isAvailable(): boolean;
  extract(input: ExtractionInput): Promise<ExtractionOutput>;
}

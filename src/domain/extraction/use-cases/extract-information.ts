import type { Extraction } from "@/domain/extraction/entities/extraction";
import type { Template } from "@/domain/extraction/entities/template";
import { InvalidProviderOutput } from "@/domain/extraction/errors/invalid-provider-output";
import { TranscriptionUnavailable } from "@/domain/extraction/errors/transcription-unavailable";
import type { ExtractionProvider } from "@/domain/extraction/ports/http/extraction-provider";
import type { Transcriber } from "@/domain/extraction/ports/http/transcriber";
import type { ExtractionRepository } from "@/domain/extraction/repositories/extraction";
import { findMissingFields } from "@/domain/extraction/services/missing-fields";
import { selectAndExtract } from "@/domain/extraction/services/provider-selection";
import {
  type CanonicalSchema,
  templateToSchema,
} from "@/domain/extraction/services/template-to-schema";

/**
 * The extraction use-case: orchestrates the pure domain services and the injected
 * adapters end to end — (transcribe audio?) → template → schema → provider
 * selection/fallback → lenient validation → missingFields → persist. Framework-free:
 * the validator is injected as a plain function so the domain never imports the Ajv
 * adapter. Audio is one extra pre-step (ADR 0006); `?provider=` controls extraction only.
 */

/** Lenient structural validation, injected (matches the validation adapter's shape). */
export type ValidateOutput = (
  schema: CanonicalSchema,
  data: unknown,
) => { valid: boolean; data: unknown; errors: string[] };

export interface ExtractInformationDeps {
  /** All known providers; availability + order govern selection. */
  providers: ExtractionProvider[];
  order: string[];
  validate: ValidateOutput;
  repository: ExtractionRepository;
  /** Speech-to-text, used only when the source is audio. */
  transcriber: Transcriber;
}

/** Either raw text or an audio file — exactly one, enforced at the HTTP edge. */
export type ExtractionSource =
  | { kind: "text"; text: string }
  | { kind: "audio"; file: Blob; filename: string };

export interface ExtractInformationInput {
  source: ExtractionSource;
  template: Template;
  instructions?: string;
  /** Forced provider from `?provider=`; disables fallback when set. */
  forced?: string;
}

export interface ExtractionResult {
  id: string;
  data: unknown;
  missingFields: string[];
  complete: boolean;
  meta: {
    provider: string;
    model: string;
    fallbackUsed: boolean;
    latencyMs: number;
    inputTokens?: number;
    outputTokens?: number;
  };
}

export async function extractInformation(
  deps: ExtractInformationDeps,
  input: ExtractInformationInput,
): Promise<ExtractionResult> {
  // Validate the template first — fail fast (422) before paying for transcription/LLM.
  // Throws TemplateInvalid (→422) on a semantically broken template.
  const { schema, required } = templateToSchema(input.template);

  // Audio is one pre-step: transcribe to text, then run the same pipeline.
  let sourceType: "text" | "audio";
  let inputText: string;
  if (input.source.kind === "audio") {
    if (!deps.transcriber.isAvailable()) {
      throw new TranscriptionUnavailable(); // → 503
    }
    // Throws TranscriptionFailed (→502).
    const transcription = await deps.transcriber.transcribe({
      file: input.source.file,
      filename: input.source.filename,
    });
    sourceType = "audio";
    inputText = transcription.text;
  } else {
    sourceType = "text";
    inputText = input.source.text;
  }

  // Throws NoProviderAvailable (→502/503) or ProviderError (→502).
  const selection = await selectAndExtract(
    deps.providers,
    { content: inputText, schema, instructions: input.instructions },
    { forced: input.forced, order: deps.order },
  );

  const validation = deps.validate(schema, selection.data);
  if (!validation.valid) {
    throw new InvalidProviderOutput(selection.provider, validation.errors);
  }

  const missingFields = findMissingFields(required, validation.data);
  const complete = missingFields.length === 0;

  const saved: Extraction = await deps.repository.save({
    sourceType,
    inputText,
    template: input.template,
    result: validation.data,
    missingFields,
    complete,
    provider: selection.provider,
    model: selection.raw.model,
    meta: {
      fallbackUsed: selection.fallbackUsed,
      latencyMs: selection.raw.latencyMs,
      inputTokens: selection.raw.inputTokens,
      outputTokens: selection.raw.outputTokens,
    },
  });

  return {
    id: saved.id,
    data: validation.data,
    missingFields,
    complete,
    meta: {
      provider: selection.provider,
      model: selection.raw.model,
      fallbackUsed: selection.fallbackUsed,
      latencyMs: selection.raw.latencyMs,
      inputTokens: selection.raw.inputTokens,
      outputTokens: selection.raw.outputTokens,
    },
  };
}

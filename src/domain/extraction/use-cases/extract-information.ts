import { Extraction } from "@/domain/extraction/entities/extraction";
import { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type";
import { InvalidProviderOutput } from "@/domain/extraction/errors/invalid-provider-output";
import { NoProviderAvailable } from "@/domain/extraction/errors/no-provider-available";
import { TranscriptionUnavailable } from "@/domain/extraction/errors/transcription-unavailable";
import type { ExtractionProvider } from "@/domain/extraction/ports/http/extraction-provider";
import type { Transcriber } from "@/domain/extraction/ports/http/transcriber";
import type { ExtractionRepository } from "@/domain/extraction/repositories/extraction";
import type { CanonicalSchema } from "@/domain/extraction/value-objects/canonical-schema";
import type { ExtractionSource } from "@/domain/extraction/value-objects/extraction-source";
import {
  type RawTemplateField,
  Template,
} from "@/domain/extraction/value-objects/template";

/**
 * The extraction use-case: orchestrates the rich domain objects and the injected adapters
 * end to end — (transcribe audio?) → template → schema → provider → lenient validation →
 * persist. Framework-free: the validator is injected as a plain function so the domain
 * never imports the Ajv adapter. A single provider is used (no fallback in v1); audio is
 * one extra pre-step (ADR 0006).
 */

/** Lenient structural validation, injected (matches the validation adapter's shape). */
export type ValidateOutput = (
  schema: CanonicalSchema,
  data: unknown,
) => { valid: boolean; data: unknown; errors: string[] };

export interface ExtractInformationDeps {
  /** The single configured extraction provider. */
  provider: ExtractionProvider;
  validate: ValidateOutput;
  repository: ExtractionRepository;
  /** Speech-to-text, used only when the source is audio. */
  transcriber: Transcriber;
}

export interface ExtractInformationInput {
  source: ExtractionSource;
  /** Raw template field list (the domain validates it). */
  template: RawTemplateField[];
  instructions?: string;
}

export interface ExtractionResult {
  id: string;
  data: unknown;
  missingFields: string[];
  complete: boolean;
  meta: {
    provider: string;
    model: string;
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
  const template = Template.create(input.template);
  const schema = template.toCanonicalSchema();

  // Audio is one pre-step: transcribe to text, then run the same pipeline.
  let sourceType: ExtractionSourceType;
  let inputText: string;
  if (input.source.isAudio()) {
    if (!deps.transcriber.isAvailable()) {
      throw new TranscriptionUnavailable(); // → 503
    }
    const transcription = await deps.transcriber.transcribe({
      file: input.source.file,
      filename: input.source.filename,
    });
    sourceType = ExtractionSourceType.Audio;
    inputText = transcription.text;
  } else {
    sourceType = ExtractionSourceType.Text;
    inputText = input.source.text;
  }

  if (!deps.provider.isAvailable()) {
    throw new NoProviderAvailable(); // → 503
  }
  const output = await deps.provider.extract({
    content: inputText,
    schema,
    instructions: input.instructions,
  });

  const validation = deps.validate(schema, output.data);
  if (!validation.valid) {
    throw new InvalidProviderOutput(deps.provider.name, validation.errors);
  }

  // The aggregate derives missingFields/complete from the template — single source of truth.
  const extraction = Extraction.create({
    sourceType,
    inputText,
    template,
    result: validation.data,
    provider: deps.provider.name,
    model: output.raw.model,
    meta: {
      latencyMs: output.raw.latencyMs,
      inputTokens: output.raw.inputTokens,
      outputTokens: output.raw.outputTokens,
    },
  });

  const saved = await deps.repository.save(extraction);

  return {
    id: saved.id,
    data: saved.result,
    missingFields: saved.missingFields,
    complete: saved.complete,
    meta: {
      provider: deps.provider.name,
      model: output.raw.model,
      latencyMs: output.raw.latencyMs,
      inputTokens: output.raw.inputTokens,
      outputTokens: output.raw.outputTokens,
    },
  };
}

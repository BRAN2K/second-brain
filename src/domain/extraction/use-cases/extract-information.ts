import { Extraction } from "@/domain/extraction/entities/extraction";
import { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type";
import { InvalidProviderOutput } from "@/domain/extraction/errors/invalid-provider-output";
import { NoProviderAvailable } from "@/domain/extraction/errors/no-provider-available";
import { TranscriptionUnavailable } from "@/domain/extraction/errors/transcription-unavailable";
import type { ExtractionProvider } from "@/domain/extraction/ports/http/extraction-provider";
import type { Transcriber } from "@/domain/extraction/ports/http/transcriber";
import type { ExtractionRepository } from "@/domain/extraction/repositories/extraction";
import type { CanonicalSchema } from "@/domain/extraction/value-objects/canonical-schema";
import {
  type RawTemplateField,
  Template,
} from "@/domain/extraction/value-objects/template";

/** Lenient structural validation, injected (matches the validation adapter's shape). */
export type ValidateOutput = (
  schema: CanonicalSchema,
  data: unknown,
) => { valid: boolean; data: unknown; errors: string[] };

export interface ExtractInformationDeps {
  provider: ExtractionProvider;
  validate: ValidateOutput;
  repository: ExtractionRepository;
  transcriber: Transcriber;
}

export type ExtractInformationInput =
  | {
      sourceType: ExtractionSourceType.Text;
      inputText: string;
      template: RawTemplateField[];
      instructions?: string;
    }
  | {
      sourceType: ExtractionSourceType.Audio;
      file: Blob;
      filename: string;
      template: RawTemplateField[];
      instructions?: string;
    };

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

  let inputText: string;
  if (input.sourceType === ExtractionSourceType.Audio) {
    if (!deps.transcriber.isAvailable()) {
      throw new TranscriptionUnavailable();
    }
    const transcription = await deps.transcriber.transcribe({
      file: input.file,
      filename: input.filename,
    });
    inputText = transcription.text;
  } else {
    inputText = input.inputText;
  }

  if (!deps.provider.isAvailable()) {
    throw new NoProviderAvailable();
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

  const extraction = Extraction.create({
    sourceType: input.sourceType,
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

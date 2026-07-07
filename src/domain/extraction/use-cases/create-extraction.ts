import { Extraction } from "@/domain/extraction/entities/extraction";
import { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type";
import { ExtractionInvalid } from "@/domain/extraction/errors/extraction-invalid";
import type {
  ExtractionFieldValue,
  IExtractionLLMProvider,
} from "@/domain/extraction/ports/http/extraction-llm-provider";
import type { ITranscriberLLMProvider } from "@/domain/extraction/ports/http/transcriber-llm-provider";
import type { IExtractionRepository } from "@/domain/extraction/repositories/extraction";
import { ExtractionMissingField } from "@/domain/extraction/value-objects/extraction-missing-field";
import { TemplateSnapshot } from "@/domain/extraction/value-objects/template-snapshot";
import { TemplateNotFound } from "@/domain/template/errors/template-not-found";
import type { ITemplateRepository } from "@/domain/template/repositories/template";
import type { TemplateItem } from "@/domain/template/value-objects/template-item";

export interface CreateExtractionInput {
  sourceType: ExtractionSourceType;
  templateId: string;
  inputText?: string;
  file?: Blob;
  instructions?: string;
}

interface TranscriptionMeta {
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export class CreateExtractionUseCase {
  constructor(
    private readonly extractionProvider: IExtractionLLMProvider,
    private readonly extractionRepository: IExtractionRepository,
    private readonly templateRepository: ITemplateRepository,
    private readonly transcriber: ITranscriberLLMProvider,
  ) {}

  async execute(input: CreateExtractionInput): Promise<Extraction> {
    const startedAt = Date.now();
    const template = await this.templateRepository.findById(input.templateId);

    if (!template) {
      throw new TemplateNotFound(input.templateId);
    }

    const { text, transcription } = await this.resolveInputText(input);

    const snapshot = TemplateSnapshot.fromTemplate(template);

    const output = await this.extractionProvider.extract({
      content: text,
      template: snapshot,
      instructions: input.instructions,
    });

    const { result, missingFields } = this.resolveResult(template.items, output.data);

    const extraction = Extraction.create({
      templateId: template.id,
      sourceType: input.sourceType,
      inputText: text,
      template: snapshot,
      result,
      missingFields,
      provider: output.provider,
      model: output.model,
      meta: {
        tokensUsed: output.inputTokens + output.outputTokens,
        processingTime: Date.now() - startedAt,
        ...(transcription && { transcription }),
      },
    });

    return this.extractionRepository.save(extraction);
  }

  private async resolveInputText(
    input: CreateExtractionInput,
  ): Promise<{ text: string; transcription?: TranscriptionMeta }> {
    if (input.sourceType === ExtractionSourceType.Audio) {
      if (!input.file) {
        throw new ExtractionInvalid(["file is required when sourceType is audio"]);
      }

      const transcription = await this.transcriber.transcribe({ file: input.file });

      return {
        text: transcription.text,
        transcription: {
          model: transcription.model,
          inputTokens: transcription.inputTokens,
          outputTokens: transcription.outputTokens,
        },
      };
    }

    if (!input.inputText) {
      throw new ExtractionInvalid(["inputText is required when sourceType is text"]);
    }

    return { text: input.inputText };
  }

  // Applies the partial-success semantics to the provider output:
  // - extracted fields are kept (only fields the template declares);
  // - null/absent fields fall back to the item default, recorded as usedDefault;
  // - null/absent required fields without default are recorded as plain missing;
  // - null/absent optional fields without default are simply omitted.
  private resolveResult(
    items: TemplateItem[],
    data: Record<string, ExtractionFieldValue>,
  ): { result: Record<string, ExtractionFieldValue>; missingFields: ExtractionMissingField[] } {
    const result: Record<string, ExtractionFieldValue> = {};
    const missingFields: ExtractionMissingField[] = [];

    for (const item of items) {
      const value = data[item.name];

      if (value !== undefined && value !== null) {
        result[item.name] = value;
        continue;
      }

      if (item.default !== undefined) {
        result[item.name] = item.default;
        missingFields.push(ExtractionMissingField.create({ field: item.name, usedDefault: true }));
        continue;
      }

      if (item.required) {
        missingFields.push(ExtractionMissingField.create({ field: item.name, usedDefault: false }));
      }
    }

    return { result, missingFields };
  }
}

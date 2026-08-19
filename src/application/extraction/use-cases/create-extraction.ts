import { EXTRACTION_BRN } from "@/domain/extraction/brn";
import { Extraction } from "@/domain/extraction/entities/extraction";
import { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type";
import type { IExtractionLLMProvider } from "@/domain/extraction/ports/extraction-llm-provider";
import type { ITranscriberLLMProvider } from "@/domain/extraction/ports/transcriber-llm-provider";
import type { IExtractionRepository } from "@/domain/extraction/repositories/extraction";
import { ExtractionMeta } from "@/domain/extraction/value-objects/extraction-meta";
import { TemplateSnapshot } from "@/domain/extraction/value-objects/template-snapshot";
import { TEMPLATE_BRN } from "@/domain/template/brn";
import type { ITemplateRepository } from "@/domain/template/repositories/template";
import { NotFoundError, UnprocessableEntityError } from "@/infrastructure/helpers/errors";
import { toExtractionData } from "./mappers/extraction-data-mapper";

export interface CreateExtractionInput {
  sourceType: ExtractionSourceType;
  templateId: string;
  inputText?: string;
  file?: Blob;
  instructions?: string;
}

export class CreateExtractionUseCase {
  constructor(
    private readonly extractionProvider: IExtractionLLMProvider,
    private readonly extractionRepository: IExtractionRepository,
    private readonly templateRepository: ITemplateRepository,
    private readonly transcriber: ITranscriberLLMProvider,
  ) {}

  async execute(input: CreateExtractionInput): Promise<Extraction> {
    const transcriptionStartedAt = Date.now();
    const template = await this.templateRepository.findById(input.templateId);

    if (!template) {
      throw new NotFoundError({
        resource: TEMPLATE_BRN.resource,
        message: `Template ${input.templateId} not found`,
      });
    }

    const text = await this.resolveInputText(input);

    const snapshot = TemplateSnapshot.fromTemplate(template);

    const output = await this.extractionProvider.extract({
      content: text,
      template: snapshot,
      instructions: input.instructions,
    });

    const { result, missingFields } = toExtractionData(template.items, output.data);

    const extraction = Extraction.create({
      templateId: template.id,
      sourceType: input.sourceType,
      inputText: text,
      template: snapshot,
      result,
      missingFields,
      provider: output.provider,
      model: output.model,
      meta: ExtractionMeta.create({
        inputTokens: output.inputTokens,
        outputTokens: output.outputTokens,
        transcriptionDurationMs: Date.now() - transcriptionStartedAt,
      }),
    });

    return this.extractionRepository.save(extraction);
  }

  private async resolveInputText(input: CreateExtractionInput): Promise<string> {
    if (input.sourceType === ExtractionSourceType.Audio) {
      if (!input.file) {
        throw new UnprocessableEntityError(["file is required when sourceType is audio"], {
          resource: EXTRACTION_BRN.resource,
        });
      }

      const transcription = await this.transcriber.transcribe({ file: input.file });

      return transcription.text;
    }

    if (!input.inputText) {
      throw new UnprocessableEntityError(["inputText is required when sourceType is text"], {
        resource: EXTRACTION_BRN.resource,
      });
    }

    return input.inputText;
  }
}

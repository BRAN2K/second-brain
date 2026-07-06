import type { Extraction } from "@/domain/extraction/entities/extraction";
import type { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type";
import type { IExtractionLLMProvider } from "@/domain/extraction/ports/http/extraction-llm-provider";
import type { ITranscriberLLMProvider } from "@/domain/extraction/ports/http/transcriber-llm-provider";
import type { IExtractionRepository } from "@/domain/extraction/repositories/extraction";
import type { ITemplateRepository } from "@/domain/template/repositories/template";

export interface CreateExtractionInput {
  templateId: string;
  sourceType: ExtractionSourceType;
  file?: Blob;
  inputText?: string;
  instructions?: string;
}

export class CreateExtractionUseCase {
  constructor(
    private readonly extractionProvider: IExtractionLLMProvider,
    private readonly extractionRepository: IExtractionRepository,
    private readonly templateRepository: ITemplateRepository,
    private readonly transcriber: ITranscriberLLMProvider,
  ) {}

  async execute(_input: CreateExtractionInput): Promise<Extraction> {
    // TODO: Implemente use case
    void this.extractionProvider;
    void this.extractionRepository;
    void this.templateRepository;
    void this.transcriber;

    return {} as Extraction;
  }
}

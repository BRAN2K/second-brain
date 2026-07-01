import type { Extraction } from "@/domain/extraction/entities/extraction";
import type { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type";
import type { ExtractionProvider } from "@/domain/extraction/ports/http/extraction-provider";
import type { Transcriber } from "@/domain/extraction/ports/http/transcriber";
import type { ExtractionRepository } from "@/domain/extraction/repositories/extraction";

export interface ExtractFromTemplateInput {
  sourceType: ExtractionSourceType;
  file: Blob;
  inputText: string;
  filename: string;
  template: any[]; //TODO: define a proper type for the template
  instructions?: string;
}

export class ExtractFromTemplateUseCase {
  constructor(
    private readonly extractionProvider: ExtractionProvider,
    private readonly extractionRepository: ExtractionRepository,
    private readonly transcriber: Transcriber,
  ) {}

  async execute(input: ExtractFromTemplateInput): Promise<Extraction> {
    // TODO: Implemente use case

    return {} as Extraction;
  }
}

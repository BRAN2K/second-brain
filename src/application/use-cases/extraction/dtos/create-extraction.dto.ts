import type { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type.enum";

export interface CreateExtractionInput {
  sourceType: ExtractionSourceType;
  templateId: string;
  inputText?: string;
  file?: Blob;
  instructions?: string;
}

import type { TemplateSnapshot } from "@/domain/extraction/value-objects/template-snapshot.value-object";

export type ExtractionFieldValue = string | number | boolean | null;

export interface ExtractionInput {
  content: string;
  template: TemplateSnapshot;
  instructions?: string;
}
export interface ExtractionResult {
  data: Record<string, ExtractionFieldValue>;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface IExtractionLLMProvider {
  extract(input: ExtractionInput): Promise<ExtractionResult>;
}

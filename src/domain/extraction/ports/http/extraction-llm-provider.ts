import type { TemplateSnapshot } from "@/domain/extraction/value-objects/template-snapshot";

export interface ExtractionInput {
  content: string;
  template: TemplateSnapshot;
  instructions?: string;
}

// Todos os TemplateFieldKind são escalares: string, number, boolean,
// date (string ISO) e enum (string). null = provider não achou o campo no texto.
export type ExtractionFieldValue = string | number | boolean | null;

export interface ExtractionResult {
  // Contrato: contém exatamente os campos declarados no template,
  // com null para os não encontrados.
  data: Record<string, ExtractionFieldValue>;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface IExtractionLLMProvider {
  extract(input: ExtractionInput): Promise<ExtractionResult>;
}

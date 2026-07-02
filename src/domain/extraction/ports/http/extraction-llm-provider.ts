export interface ExtractionInput {
  content: string;
  schema: unknown; //TODO: define a proper type
  instructions?: string;
}

export interface ProviderRawMeta {
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ExtractionOutput {
  data: unknown; //TODO: define a proper type
  raw: ProviderRawMeta;
}

export interface IExtractionLLMProvider {
  extract(input: ExtractionInput): Promise<ExtractionOutput>;
}

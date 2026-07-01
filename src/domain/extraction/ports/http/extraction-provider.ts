export interface ExtractionInput {
  content: string;
  schema: any; //TODO: define a proper type
  instructions?: string;
}

export interface ProviderRawMeta {
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ExtractionOutput {
  data: any; //TODO: define a proper type
  raw: ProviderRawMeta;
}

export interface ExtractionProvider {
  extract(input: ExtractionInput): Promise<ExtractionOutput>;
}

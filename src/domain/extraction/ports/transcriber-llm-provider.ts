export interface TranscriptionRequest {
  file: Blob;
}

export interface TranscriptionResult {
  text: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ITranscriberLLMProvider {
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResult>;
}

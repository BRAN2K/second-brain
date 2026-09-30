export interface TranscriptionRequest {
  file: Blob;
}

export interface TranscriptionResult {
  text: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface TranscriberLLMProviderService {
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResult>;
}

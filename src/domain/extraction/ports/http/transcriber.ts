export interface TranscriptionRequest {
  file: Blob;
}

export interface TranscriptionResult {
  text: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface Transcriber {
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResult>;
}

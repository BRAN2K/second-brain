/**
 * Driven port for speech-to-text. Audio is a separate stage (ADR 0006): audio →
 * transcript → the same extraction pipeline as text. The concrete adapter lives in
 * `adapters/output/transcription`. The original audio is never stored — only its text.
 */
export interface TranscriptionRequest {
	/** The uploaded audio bytes. */
	file: Blob;
	filename: string;
}

export interface TranscriptionResult {
	text: string;
	model: string;
	latencyMs: number;
}

export interface Transcriber {
	/** Whether speech-to-text is usable right now (e.g. its API key is configured). */
	isAvailable(): boolean;
	transcribe(request: TranscriptionRequest): Promise<TranscriptionResult>;
}

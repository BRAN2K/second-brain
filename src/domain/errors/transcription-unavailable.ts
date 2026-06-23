/**
 * Raised when audio extraction is requested but no transcriber is configured (e.g. the
 * STT API key is missing). Mapped to 503 — the capability is simply not available.
 */
export class TranscriptionUnavailable extends Error {
	constructor() {
		super("Audio transcription is not available");
		this.name = "TranscriptionUnavailable";
	}
}

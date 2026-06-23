/**
 * Raised when the transcription call itself fails (network/HTTP/parse). Mapped to 502 —
 * a processing failure of the upstream STT service.
 */
export class TranscriptionFailed extends Error {
	constructor(options?: { cause?: unknown }) {
		super("Audio transcription failed", options);
		this.name = "TranscriptionFailed";
	}
}

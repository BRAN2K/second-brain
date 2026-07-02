export class TranscriptionFailed extends Error {
  constructor(options?: { cause?: unknown }) {
    super("Audio transcription failed", options);
    this.name = "TranscriptionFailed";
  }
}

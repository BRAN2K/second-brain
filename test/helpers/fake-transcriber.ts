import { TranscriptionFailed } from "@/domain/errors/transcription-failed";
import type {
	Transcriber,
	TranscriptionRequest,
} from "@/domain/ports/transcriber";

export interface FakeTranscriber extends Transcriber {
	calls: number;
}

interface FakeOptions {
	available?: boolean;
	text?: string;
	fail?: boolean;
}

/** Test double for the `Transcriber` port; records call count. */
export function fakeTranscriber(options: FakeOptions = {}): FakeTranscriber {
	const transcriber: FakeTranscriber = {
		calls: 0,
		isAvailable: () => options.available ?? true,
		async transcribe(_request: TranscriptionRequest) {
			transcriber.calls++;
			if (options.fail) {
				throw new TranscriptionFailed();
			}
			return {
				text: options.text ?? "transcribed text",
				model: "whisper-test",
				latencyMs: 1,
			};
		},
	};
	return transcriber;
}

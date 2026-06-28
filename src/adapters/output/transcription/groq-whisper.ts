import { TranscriptionFailed } from "@/domain/extraction/errors/transcription-failed";
import type {
  Transcriber,
  TranscriptionRequest,
  TranscriptionResult,
} from "@/domain/extraction/ports/http/transcriber";

/**
 * Speech-to-text via Groq Whisper (`whisper-large-v3-turbo`) over the OpenAI-compatible
 * `audio/transcriptions` endpoint, using raw `fetch` (no SDK). Cheap and fast; the size
 * cap (24 MB → 413) is enforced at the HTTP edge before we get here.
 */
export interface GroqWhisperConfig {
  apiKey: string | undefined;
  model: string;
}

const URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export function createGroqWhisper(cfg: GroqWhisperConfig): Transcriber {
  return {
    isAvailable: () => Boolean(cfg.apiKey),

    async transcribe(req: TranscriptionRequest): Promise<TranscriptionResult> {
      const start = Date.now();
      const form = new FormData();
      form.append("file", req.file, req.filename);
      form.append("model", cfg.model);
      form.append("response_format", "json");

      let response: Response;
      try {
        response = await fetch(URL, {
          method: "POST",
          headers: { authorization: `Bearer ${cfg.apiKey}` },
          body: form,
        });
      } catch (cause) {
        throw new TranscriptionFailed({ cause });
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new TranscriptionFailed({ cause: body });
      }

      const json = (await response.json()) as { text?: string };
      if (typeof json.text !== "string") {
        throw new TranscriptionFailed({ cause: "empty transcription" });
      }

      return {
        text: json.text,
        model: cfg.model,
        latencyMs: Date.now() - start,
      };
    },
  };
}

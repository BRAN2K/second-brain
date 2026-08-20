import type {
  ITranscriberLLMProvider,
  TranscriptionRequest,
  TranscriptionResult,
} from "@/domain/extraction/ports/transcriber-llm-provider";
import { EXTRACTION_BRN } from "@/domain/extraction/brn";
import { UpstreamError } from "@/libs/errors";

const GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_WHISPER_MODEL = "whisper-large-v3-turbo";

function transcriptionFailed(cause: unknown): UpstreamError {
  return new UpstreamError({
    resource: EXTRACTION_BRN.resource,
    scope: EXTRACTION_BRN.scope.transcription,
    message: "Audio transcription failed",
    cause,
  });
}

export class GroqWhisperTranscriberLLMProvider implements ITranscriberLLMProvider {
  constructor(private readonly groqApiKey: string) {}

  async transcribe(req: TranscriptionRequest): Promise<TranscriptionResult> {
    const formData = this.buildFormData(req);

    let response: Response;
    try {
      response = await fetch(GROQ_WHISPER_URL, {
        method: "POST",
        headers: { authorization: `Bearer ${this.groqApiKey}` },
        body: formData,
      });
    } catch (cause) {
      throw transcriptionFailed(cause);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw transcriptionFailed(body);
    }

    const json = (await response.json()) as { text?: string };
    if (typeof json.text !== "string") {
      throw transcriptionFailed("empty transcription");
    }

    return {
      text: json.text,
      model: GROQ_WHISPER_MODEL,
    };
  }

  private buildFormData(req: TranscriptionRequest): FormData {
    const form = new FormData();

    form.append("file", req.file);
    form.append("model", GROQ_WHISPER_MODEL);
    form.append("response_format", "json");

    return form;
  }
}
